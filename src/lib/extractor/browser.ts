import type { Browser } from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { extractDesignData } from "./in-page";

// Lazy-load puppeteer-extra + stealth only when extraction is actually called.
// Top-level import would crash all routes if stealth's CJS deps are missing.
async function loadPuppeteerExtra() {
  const [{ default: puppeteerExtra }, { default: StealthPlugin }] = await Promise.all([
    import("puppeteer-extra"),
    import("puppeteer-extra-plugin-stealth"),
  ]);
  puppeteerExtra.use(StealthPlugin());
  return puppeteerExtra;
}

/** Thrown when the target site is protected by a WAF/CAPTCHA challenge */
export class WafBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WafBlockedError";
  }
}

/** Check if the page HTML shows a WAF/CAPTCHA challenge instead of real content */
function detectWafChallenge(html: string, title: string): string | null {
  const lc = html.toLowerCase();

  // AWS WAF
  if (lc.includes("captcha.awswaf.com") || lc.includes("awswaf.com/captcha")) {
    return "AWS WAF CAPTCHA";
  }
  // Cloudflare
  if (
    lc.includes("cf-browser-verification") ||
    lc.includes("cf-challenge-running") ||
    lc.includes("challenge-platform") ||
    title.toLowerCase().includes("just a moment")
  ) {
    return "Cloudflare Challenge";
  }
  // Akamai Bot Manager
  if (lc.includes("_abck") && lc.includes("bm-verify")) {
    return "Akamai Bot Manager";
  }
  // DataDome
  if (lc.includes("datadome-captcha") || lc.includes("dd_cookie_test")) {
    return "DataDome CAPTCHA";
  }
  // PerimeterX
  if (lc.includes("px-captcha") || lc.includes("_px_")) {
    return "PerimeterX CAPTCHA";
  }
  // hCaptcha / reCAPTCHA blocking the whole page (small body, challenge iframe)
  if (html.length < 3000 && (lc.includes("hcaptcha.com") || lc.includes("recaptcha"))) {
    return "CAPTCHA challenge";
  }
  return null;
}

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

let browserInstance: Browser | null = null;

const BASE_LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
];

export interface ProxyConfig {
  /** Proxy host:port, e.g. "proxy-server.scraperapi.com:8001" */
  server: string;
  username: string;
  password: string;
}

export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  const puppeteerExtra = await loadPuppeteerExtra();
  browserInstance = (await puppeteerExtra.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: BASE_LAUNCH_ARGS,
  })) as unknown as Browser;
  return browserInstance;
}

/**
 * Launches a fresh (non-cached) browser routed through the given proxy.
 * Caller is responsible for closing it.
 */
async function launchProxiedBrowser(proxy: ProxyConfig): Promise<Browser> {
  const puppeteerExtra = await loadPuppeteerExtra();
  return (await puppeteerExtra.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [...BASE_LAUNCH_ARGS, `--proxy-server=${proxy.server}`],
  })) as unknown as Browser;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function extractFromPage(
  url: string,
  opts?: { proxy?: ProxyConfig }
): Promise<RawExtraction> {
  const proxy = opts?.proxy;
  const browser = proxy ? await launchProxiedBrowser(proxy) : await getBrowser();
  const shouldCloseBrowser = Boolean(proxy);
  const page = await browser.newPage();

  if (proxy) {
    await page.authenticate({ username: proxy.username, password: proxy.password });
  }

  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  );

  // ── Intercept font file downloads ──
  const downloadedFonts: Array<{ family: string; url: string; localPath: string; format: string }> = [];
  const siteSlug = new URL(url).hostname.replace(/[^a-z0-9]/gi, "-");
  const siteFontsDir = path.join(FONTS_DIR, siteSlug);
  await fs.mkdir(siteFontsDir, { recursive: true });

  await page.setRequestInterception(true);
  page.on("request", (req) => req.continue());
  page.on("response", async (response) => {
    try {
      const resUrl = response.url();
      const contentType = response.headers()["content-type"] || "";
      const isFont =
        resUrl.match(/\.(woff2?|ttf|otf|eot)(\?|$)/i) ||
        contentType.includes("font/") ||
        contentType.includes("application/font");

      if (isFont && response.ok()) {
        const ext = resUrl.match(/\.(woff2?|ttf|otf|eot)/i)?.[1] || "woff2";
        const fileName = `${downloadedFonts.length}-${path.basename(resUrl).split("?")[0] || `font.${ext}`}`;
        const localPath = path.join(siteFontsDir, fileName);

        const buffer = await response.buffer();
        await fs.writeFile(localPath, buffer);

        downloadedFonts.push({
          family: "", // Will be matched later from @font-face rules
          url: resUrl,
          localPath: `/fonts/${siteSlug}/${fileName}`,
          format: ext,
        });
      }
    } catch {
      // Some responses can't be buffered — skip
    }
  });

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Detect WAF/CAPTCHA pages — fail fast instead of extracting challenge page
    const earlyHtml = await page.content();
    const earlyTitle = await page.title();
    const blocker = detectWafChallenge(earlyHtml, earlyTitle);
    if (blocker) {
      throw new WafBlockedError(
        `Site protected by ${blocker} — extraction blocked. Try a different URL or contact support.`
      );
    }

    // Scroll the ENTIRE page to trigger lazy-loaded fonts, images, and content
    await page.evaluate(async () => {
      const scrollStep = Math.floor(window.innerHeight * 0.8);
      let lastHeight = 0;
      let currentPos = 0;

      // Keep scrolling until we've seen everything (handles infinite scroll too)
      for (let attempt = 0; attempt < 50; attempt++) {
        const maxScroll = document.body.scrollHeight;
        if (currentPos >= maxScroll) break;

        window.scrollTo(0, currentPos);
        await new Promise((r) => setTimeout(r, 300));
        currentPos += scrollStep;

        // Check if page grew (lazy content loaded)
        if (document.body.scrollHeight > lastHeight) {
          lastHeight = document.body.scrollHeight;
        }
      }

      // Scroll back to top
      window.scrollTo(0, 0);
    });

    // Wait for ALL fonts to finish loading after scroll triggered them
    await page.waitForFunction(() => document.fonts.ready, { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    const screenshot = await page.screenshot({
      encoding: "base64",
      type: "png",
      fullPage: false,
    });

    const extraction = await page.evaluate(extractDesignData);

    // Hover/focus capture — hover on a representative button and re-read its
    // computed style. Wrap in try/finally so a single selector miss doesn't
    // tank the whole extraction.
    const componentStates: Array<{
      type: string;
      hover?: Record<string, string>;
      focus?: Record<string, string>;
    }> = [];
    for (const { type, selector } of [
      { type: "button", selector: "button, a[role='button'], a[class*='btn' i]" },
      { type: "link", selector: "main a:not([role='button']):not([class*='btn' i])" },
    ]) {
      try {
        const el = await page.$(selector);
        if (!el) continue;
        await el.hover().catch(() => {});
        await new Promise((r) => setTimeout(r, 120));
        const hover = await page.evaluate((e: Element) => {
          const cs = getComputedStyle(e as HTMLElement);
          return {
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            boxShadow: cs.boxShadow,
            borderColor: cs.borderColor,
            transform: cs.transform,
            opacity: cs.opacity,
            textDecoration: cs.textDecoration,
          };
        }, el);
        // Focus capture
        let focus: Record<string, string> | undefined;
        try {
          await el.focus();
          await new Promise((r) => setTimeout(r, 80));
          focus = await page.evaluate((e: Element) => {
            const cs = getComputedStyle(e as HTMLElement);
            return {
              outline: cs.outline,
              outlineColor: cs.outlineColor,
              outlineOffset: cs.outlineOffset,
              boxShadow: cs.boxShadow,
              borderColor: cs.borderColor,
            };
          }, el);
        } catch { /* focus not applicable */ }
        componentStates.push({ type, hover, focus });
        // Move mouse off so next iteration starts clean
        await page.mouse.move(0, 0).catch(() => {});
      } catch {
        // Single selector failures don't block the rest
      }
    }

    // Logo download — if the extractor found an <img> logo, intercept by URL.
    // SVG logos are already inlined via `extraction.logo.inlineSvg`.
    try {
      const logoInfo = extraction.logo;
      if (logoInfo && logoInfo.kind === "img" && logoInfo.url && !logoInfo.url.startsWith("data:")) {
        const siteSlug = new URL(url).hostname.replace(/[^a-z0-9]/gi, "-");
        const siteFontsDir = path.join(FONTS_DIR, siteSlug);
        const ext = (logoInfo.url.match(/\.(png|jpg|jpeg|webp|svg|gif|ico)(\?|$)/i)?.[1] || "png").toLowerCase();
        const buf = await page.evaluate(async (u: string) => {
          try {
            const r = await fetch(u, { mode: "cors" });
            const b = await r.arrayBuffer();
            return Array.from(new Uint8Array(b));
          } catch {
            return null;
          }
        }, logoInfo.url);
        if (buf) {
          const fileName = `logo.${ext}`;
          await fs.mkdir(siteFontsDir, { recursive: true });
          const localPath = path.join(siteFontsDir, fileName);
          await fs.writeFile(localPath, Buffer.from(buf));
          logoInfo.localPath = `/fonts/${siteSlug}/${fileName}`;
        }
      }
    } catch {
      // Logo download is best-effort
    }

    const title = await page.title();
    const metaDesc = await page
      .$eval('meta[name="description"]', (el) =>
        el.getAttribute("content")
      )
      .catch(() => "");

    const favicon = await page
      .$eval('link[rel*="icon"]', (el) => el.getAttribute("href"))
      .catch(() => "/favicon.ico");

    // Match downloaded font files to @font-face families
    for (const dl of downloadedFonts) {
      for (const face of extraction.fontFaces) {
        if (face.src && face.src.includes(path.basename(dl.url).split("?")[0])) {
          dl.family = face.family;
          break;
        }
      }
    }

    return {
      ...extraction,
      downloadedFonts,
      componentStates,
      meta: {
        url,
        title,
        description: metaDesc || "",
        favicon: favicon ? new URL(favicon, url).href : "",
        screenshot: `data:image/png;base64,${screenshot}`,
      },
    };
  } finally {
    await page.close().catch(() => {});
    if (shouldCloseBrowser) await browser.close().catch(() => {});
  }
}


// ── Types ──

export interface RawExtraction {
  pageBackground: string | null;
  colors: Array<{ hex: string; count: number }>;
  fonts: Array<{ name: string; weights: number[]; count: number }>;
  fontSizes: Array<{ size: string; count: number }>;
  shadows: Array<{ value: string; count: number }>;
  radii: Array<{ value: string; count: number }>;
  spacings: Array<{ value: string; count: number }>;
  cssVars: Record<string, string>;
  componentStyles: Array<{
    type: string;
    tag: string;
    styles: Record<string, string>;
  }>;
  headingStyles: Array<{
    tag: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    fontFamily: string;
    color: string;
  }>;
  bodyStyle: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    fontFamily: string;
    color: string;
  };
  fontLinks: Array<{ href: string; type: string }>;
  fontFaces: Array<{
    family: string;
    weight: string;
    style: string;
    src: string;
    display: string;
  }>;
  downloadedFonts: Array<{
    family: string;
    url: string;
    localPath: string;
    format: string;
  }>;
  // ── Extended signals — optional so partial/legacy extractions still type-check.
  gradients?: Array<{
    value: string;
    type: "linear" | "radial" | "conic";
    sampleTag: string;
    occurrences: number;
  }>;
  transitions?: Array<{
    durationMs: number;
    easing: string;
    occurrences: number;
  }>;
  logo?: {
    url: string;
    kind: "svg" | "img";
    inlineSvg?: string;
    alt?: string;
    colors: string[];
    localPath?: string;
  } | null;
  designSignals?: {
    usesBackdropBlur: boolean;
    usesClipPath: boolean;
    usesCssFilters: boolean;
    usesBgPatterns: boolean;
    usesBlendModes: boolean;
    uses3dTransforms: boolean;
    usesMasks: boolean;
    notes: string[];
  };
  microcopy?: {
    heroHeadline: string;
    heroSubheadline: string;
    ctaLabels: string[];
    navLabels: string[];
    sectionTitles: string[];
    voiceTags: string[];
  };
  heroComposition?: {
    pattern: "split-left" | "split-right" | "centered" | "full-bleed" | "minimal" | "unknown";
    hasMedia: boolean;
    backgroundKind: "solid" | "gradient" | "image" | "video";
    heightVh: number;
  };
  selection?: {
    selectionBg: string;
    selectionColor: string;
    hasCustomScrollbar: boolean;
    primaryCursor: string;
    caretColor: string;
  };
  /** Hover states captured via page.hover() — only present if the extractor succeeded. */
  componentStates?: Array<{
    type: string;
    hover?: Record<string, string>;
    focus?: Record<string, string>;
  }>;
  meta: {
    url: string;
    title: string;
    description: string;
    favicon: string;
    screenshot: string;
  };
}

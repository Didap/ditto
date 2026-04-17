import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser } from "puppeteer";
import fs from "fs/promises";
import path from "path";

// Apply stealth plugin to avoid bot detection (AWS WAF, Cloudflare, etc.)
puppeteerExtra.use(StealthPlugin());

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

export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  browserInstance = (await puppeteerExtra.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  })) as unknown as Browser;
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function extractFromPage(url: string): Promise<RawExtraction> {
  const browser = await getBrowser();
  const page = await browser.newPage();

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
      meta: {
        url,
        title,
        description: metaDesc || "",
        favicon: favicon ? new URL(favicon, url).href : "",
        screenshot: `data:image/png;base64,${screenshot}`,
      },
    };
  } finally {
    await page.close();
  }
}

// ── In-page extraction function (runs in browser context) ──

function extractDesignData() {
  const colors = new Map<string, number>();
  const fonts = new Map<string, { weights: Set<number>; count: number }>();
  const fontSizes = new Map<string, number>();
  const shadows = new Map<string, number>();
  const radii = new Map<string, number>();
  const spacings = new Map<string, number>();
  const cssVars: Record<string, string> = {};
  const componentStyles: Array<{
    type: string;
    tag: string;
    styles: Record<string, string>;
  }> = [];

  // Extract CSS custom properties from :root
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (
          rule instanceof CSSStyleRule &&
          (rule.selectorText === ":root" ||
            rule.selectorText === ":root, :host" ||
            rule.selectorText?.includes(":root"))
        ) {
          for (let i = 0; i < rule.style.length; i++) {
            const prop = rule.style[i];
            if (prop.startsWith("--")) {
              cssVars[prop] = rule.style.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch {
      // CORS stylesheets — skip
    }
  }

  // Helper: normalize color to hex
  function toHex(color: string): string | null {
    if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return null;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return null;
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

  // Collect from ALL visible elements — no cap, thoroughness over speed
  const elements = document.querySelectorAll("body *");

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as HTMLElement;
    if (!el.offsetParent && el.tagName !== "BODY") continue; // Skip hidden

    const cs = getComputedStyle(el);

    // Colors
    for (const prop of [
      "color",
      "backgroundColor",
      "borderColor",
      "borderTopColor",
      "outlineColor",
    ]) {
      const hex = toHex(cs.getPropertyValue(prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)));
      if (hex) {
        colors.set(hex, (colors.get(hex) || 0) + 1);
      }
    }

    // Typography
    const ff = cs.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
    if (ff) {
      const entry = fonts.get(ff) || { weights: new Set<number>(), count: 0 };
      entry.weights.add(parseInt(cs.fontWeight) || 400);
      entry.count++;
      fonts.set(ff, entry);
    }

    const fs = cs.fontSize;
    if (fs) fontSizes.set(fs, (fontSizes.get(fs) || 0) + 1);

    // Shadows
    const bs = cs.boxShadow;
    if (bs && bs !== "none") {
      shadows.set(bs, (shadows.get(bs) || 0) + 1);
    }

    // Radii
    const br = cs.borderRadius;
    if (br && br !== "0px") {
      radii.set(br, (radii.get(br) || 0) + 1);
    }

    // Spacing (margin + padding)
    for (const prop of ["marginTop", "marginBottom", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "gap"]) {
      const val = cs.getPropertyValue(prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
      if (val && val !== "0px" && val !== "normal" && val !== "auto") {
        spacings.set(val, (spacings.get(val) || 0) + 1);
      }
    }

    // Component detection — capture more variants
    const tag = el.tagName.toLowerCase();
    if (
      (tag === "button" || (tag === "a" && el.getAttribute("role") === "button") ||
       (tag === "a" && cs.display.includes("inline") && cs.backgroundColor !== "rgba(0, 0, 0, 0)")) &&
      componentStyles.filter((c) => c.type === "button").length < 15
    ) {
      componentStyles.push({
        type: "button",
        tag,
        styles: {
          backgroundColor: cs.backgroundColor,
          color: cs.color,
          padding: cs.padding,
          borderRadius: cs.borderRadius,
          border: cs.border,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontFamily: cs.fontFamily.split(",")[0].trim().replace(/['"]/g, ""),
          boxShadow: cs.boxShadow,
        },
      });
    }

    if (tag === "input" || tag === "textarea" || tag === "select") {
      if (componentStyles.filter((c) => c.type === "input").length < 10) {
        componentStyles.push({
          type: "input",
          tag,
          styles: {
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            padding: cs.padding,
            borderRadius: cs.borderRadius,
            border: cs.border,
            fontSize: cs.fontSize,
            fontFamily: cs.fontFamily.split(",")[0].trim().replace(/['"]/g, ""),
          },
        });
      }
    }

    // Card detection (divs with border/shadow + padding)
    if (
      tag === "div" &&
      cs.boxShadow !== "none" &&
      cs.borderRadius !== "0px" &&
      componentStyles.filter((c) => c.type === "card").length < 8
    ) {
      componentStyles.push({
        type: "card",
        tag,
        styles: {
          backgroundColor: cs.backgroundColor,
          borderRadius: cs.borderRadius,
          border: cs.border,
          boxShadow: cs.boxShadow,
          padding: cs.padding,
        },
      });
    }

    // Link styles
    if (
      tag === "a" &&
      cs.color !== cs.getPropertyValue("color") &&
      componentStyles.filter((c) => c.type === "link").length < 5
    ) {
      componentStyles.push({
        type: "link",
        tag,
        styles: {
          color: cs.color,
          textDecoration: cs.textDecoration,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontFamily: cs.fontFamily.split(",")[0].trim().replace(/['"]/g, ""),
        },
      });
    }
  }

  // ── Extract loaded fonts from document.fonts API ──
  // This catches ALL fonts the browser loaded, even if not in our element sample
  try {
    const loadedFonts = document.fonts;
    loadedFonts.forEach((fontFace: FontFace) => {
      const family = fontFace.family.replace(/['"]/g, "").trim();
      if (family && !family.startsWith("-") && family !== "Material" && family.length > 1) {
        const weight = parseInt(fontFace.weight) || 400;
        const entry = fonts.get(family) || { weights: new Set<number>(), count: 0 };
        entry.weights.add(weight);
        // Give loaded fonts a minimum count so they show up
        entry.count = Math.max(entry.count, 3);
        fonts.set(family, entry);
      }
    });
  } catch {
    // Fallback — document.fonts may not be iterable in some contexts
  }

  // Collect heading styles specifically — check ALL headings, not just first
  const headingStyles: Array<{
    tag: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    fontFamily: string;
    color: string;
  }> = [];

  for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    // Check ALL elements of this tag, pick the most representative one
    const els = document.querySelectorAll(tag);
    if (els.length > 0) {
      // Collect font families across all instances
      const familyCounts = new Map<string, { el: Element; count: number }>();
      els.forEach((el) => {
        if (!(el as HTMLElement).offsetParent && el.tagName !== "BODY") return;
        const cs = getComputedStyle(el);
        const ff = cs.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
        const existing = familyCounts.get(ff);
        if (existing) {
          existing.count++;
        } else {
          familyCounts.set(ff, { el, count: 1 });
        }
      });

      // Pick the most common font family for this heading level
      let best: { el: Element; count: number } | null = null;
      for (const entry of familyCounts.values()) {
        if (!best || entry.count > best.count) best = entry;
      }

      if (best) {
        const cs = getComputedStyle(best.el);
        headingStyles.push({
          tag,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
          fontFamily: cs.fontFamily.split(",")[0].trim().replace(/['"]/g, ""),
          color: cs.color,
        });
      }
    }
  }

  // Body text style
  const bodyEl = document.querySelector("p") || document.body;
  const bodyCs = getComputedStyle(bodyEl);
  const bodyStyle = {
    fontSize: bodyCs.fontSize,
    fontWeight: bodyCs.fontWeight,
    lineHeight: bodyCs.lineHeight,
    letterSpacing: bodyCs.letterSpacing,
    fontFamily: bodyCs.fontFamily.split(",")[0].trim().replace(/['"]/g, ""),
    color: bodyCs.color,
  };

  // ── Extract font sources ──

  // 1. <link> tags pointing to font CDNs
  const fontLinks: Array<{ href: string; type: string }> = [];
  document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"], link[rel="preconnect"]').forEach((el) => {
    const href = el.getAttribute("href") || "";
    if (
      href.includes("fonts.googleapis.com") ||
      href.includes("fonts.gstatic.com") ||
      href.includes("use.typekit.net") ||
      href.includes("fast.fonts.net") ||
      href.includes("rsms.me/inter") ||
      href.includes("cdn.fonts") ||
      href.includes("font")
    ) {
      let type = "unknown";
      if (href.includes("googleapis") || href.includes("gstatic")) type = "google-fonts";
      else if (href.includes("typekit")) type = "adobe-fonts";
      else if (href.includes("rsms.me")) type = "cdn";
      else type = "cdn";
      fontLinks.push({ href, type });
    }
  });

  // 2. @import in stylesheets (e.g. @import url('https://fonts.googleapis.com/...'))
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSImportRule) {
          const href = rule.href || "";
          if (href.includes("fonts.googleapis.com") || href.includes("typekit") || href.includes("font")) {
            let type = "unknown";
            if (href.includes("googleapis")) type = "google-fonts";
            else if (href.includes("typekit")) type = "adobe-fonts";
            else type = "cdn";
            fontLinks.push({ href, type });
          }
        }
      }
    } catch {
      // CORS
    }
  }

  // 3. @font-face rules
  const fontFaces: Array<{
    family: string;
    weight: string;
    style: string;
    src: string;
    display: string;
  }> = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSFontFaceRule) {
          fontFaces.push({
            family: rule.style.getPropertyValue("font-family").replace(/['"]/g, "").trim(),
            weight: rule.style.getPropertyValue("font-weight") || "400",
            style: rule.style.getPropertyValue("font-style") || "normal",
            src: rule.style.getPropertyValue("src") || "",
            display: rule.style.getPropertyValue("font-display") || "swap",
          });
        }
      }
    } catch {
      // CORS
    }
  }

  // ── Explicitly extract page background ──
  // This is critical: don't rely on frequency, check the actual page background
  let pageBackground: string | null = null;
  for (const el of [document.documentElement, document.body]) {
    const bg = getComputedStyle(el).backgroundColor;
    const hex = toHex(bg);
    if (hex) {
      pageBackground = hex;
      break;
    }
  }
  // If no explicit background found, check the first full-width section
  if (!pageBackground) {
    const main = document.querySelector("main, [role='main'], .hero, header, section");
    if (main) {
      const hex = toHex(getComputedStyle(main).backgroundColor);
      if (hex) pageBackground = hex;
    }
  }

  // Convert Maps to arrays for serialization
  return {
    pageBackground,
    colors: Array.from(colors.entries()).map(([hex, count]) => ({ hex, count })),
    fonts: Array.from(fonts.entries()).map(([name, data]) => ({
      name,
      weights: Array.from(data.weights),
      count: data.count,
    })),
    fontSizes: Array.from(fontSizes.entries()).map(([size, count]) => ({ size, count })),
    shadows: Array.from(shadows.entries()).map(([value, count]) => ({ value, count })),
    radii: Array.from(radii.entries()).map(([value, count]) => ({ value, count })),
    spacings: Array.from(spacings.entries()).map(([value, count]) => ({ value, count })),
    cssVars,
    componentStyles,
    headingStyles,
    bodyStyle,
    fontLinks,
    fontFaces,
  };
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
  meta: {
    url: string;
    title: string;
    description: string;
    favicon: string;
    screenshot: string;
  };
}

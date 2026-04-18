/**
 * In-page extraction function — runs in browser context.
 * Must be self-contained (no closure captures) because it's serialized via
 * `.toString()` for two consumers:
 *   1. Puppeteer's `page.evaluate(extractDesignData)` (server-side extractor)
 *   2. The bookmarklet served at /api/bookmarklet/script (runs in user's tab)
 *
 * Do NOT add top-level imports or external references — they won't resolve
 * when the function is stringified and run in a foreign context.
 */
export function extractDesignData() {
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
    /** Viewport-relative bounding rect at screenshot time. Only present when
        the element is within the viewport (for pixel sampling). */
    rect?: { x: number; y: number; w: number; h: number };
  }> = [];

  /** Returns the rect if the element is visible in the viewport, else null. */
  function visibleRect(el: HTMLElement): { x: number; y: number; w: number; h: number } | null {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return null;
    if (r.top < 0 || r.left < 0) return null;
    if (r.top > window.innerHeight || r.left > window.innerWidth) return null;
    if (r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1) return null;
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  }

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

  const elements = document.querySelectorAll("body *");

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as HTMLElement;
    if (!el.offsetParent && el.tagName !== "BODY") continue;

    const cs = getComputedStyle(el);

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

    const ff = cs.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
    if (ff) {
      const entry = fonts.get(ff) || { weights: new Set<number>(), count: 0 };
      entry.weights.add(parseInt(cs.fontWeight) || 400);
      entry.count++;
      fonts.set(ff, entry);
    }

    const fs = cs.fontSize;
    if (fs) fontSizes.set(fs, (fontSizes.get(fs) || 0) + 1);

    const bs = cs.boxShadow;
    if (bs && bs !== "none") {
      shadows.set(bs, (shadows.get(bs) || 0) + 1);
    }

    const br = cs.borderRadius;
    if (br && br !== "0px") {
      radii.set(br, (radii.get(br) || 0) + 1);
    }

    for (const prop of ["marginTop", "marginBottom", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "gap"]) {
      const val = cs.getPropertyValue(prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
      if (val && val !== "0px" && val !== "normal" && val !== "auto") {
        spacings.set(val, (spacings.get(val) || 0) + 1);
      }
    }

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
        rect: visibleRect(el) || undefined,
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
          rect: visibleRect(el) || undefined,
        });
      }
    }

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
        rect: visibleRect(el) || undefined,
      });
    }

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
        rect: visibleRect(el) || undefined,
      });
    }
  }

  try {
    const loadedFonts = document.fonts;
    loadedFonts.forEach((fontFace: FontFace) => {
      const family = fontFace.family.replace(/['"]/g, "").trim();
      if (family && !family.startsWith("-") && family !== "Material" && family.length > 1) {
        const weight = parseInt(fontFace.weight) || 400;
        const entry = fonts.get(family) || { weights: new Set<number>(), count: 0 };
        entry.weights.add(weight);
        entry.count = Math.max(entry.count, 3);
        fonts.set(family, entry);
      }
    });
  } catch {
    // document.fonts may not be iterable in some contexts
  }

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
    const els = document.querySelectorAll(tag);
    if (els.length > 0) {
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

  // ── Gradients — linear/radial/conic on backgrounds and borders ──
  const gradientMap = new Map<string, { type: "linear" | "radial" | "conic"; tag: string; count: number }>();

  function extractGradientsFromValue(val: string, tag: string) {
    const re = /(linear|radial|conic)-gradient\([^)]*\)(?:\s*,\s*(?:linear|radial|conic)-gradient\([^)]*\))*/gi;
    const matches = val.match(re);
    if (!matches) return;
    for (const m of matches) {
      const kind = /^linear/i.test(m) ? "linear" : /^radial/i.test(m) ? "radial" : "conic";
      const key = m.trim();
      const entry = gradientMap.get(key);
      if (entry) entry.count++;
      else gradientMap.set(key, { type: kind, tag, count: 1 });
    }
  }

  // Pass through body elements to pick up gradients on background-image
  for (let i = 0; i < Math.min(elements.length, 2000); i++) {
    const el = elements[i] as HTMLElement;
    if (!el.offsetParent && el.tagName !== "BODY") continue;
    const cs = getComputedStyle(el);
    for (const prop of ["backgroundImage", "background", "borderImage"]) {
      const v = cs.getPropertyValue(prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
      if (v && v !== "none" && /gradient\(/i.test(v)) {
        extractGradientsFromValue(v, el.tagName.toLowerCase());
      }
    }
  }

  // ── Transitions — collect common duration+easing pairs ──
  const transitionMap = new Map<string, number>();
  for (let i = 0; i < Math.min(elements.length, 2000); i++) {
    const el = elements[i] as HTMLElement;
    if (!el.offsetParent && el.tagName !== "BODY") continue;
    const cs = getComputedStyle(el);
    const dur = cs.transitionDuration; // "0s" or "0.2s" or "0.2s, 0.3s"
    if (!dur || dur === "0s") continue;
    const durParts = dur.split(",").map((s) => s.trim());
    const easeParts = cs.transitionTimingFunction.split(",").map((s) => s.trim());
    for (let k = 0; k < durParts.length; k++) {
      const ms = parseDurationMs(durParts[k]);
      if (ms <= 0 || ms > 2000) continue;
      const easing = easeParts[k] || easeParts[0] || "ease";
      const key = `${ms}|${easing}`;
      transitionMap.set(key, (transitionMap.get(key) || 0) + 1);
    }
  }

  function parseDurationMs(s: string): number {
    if (s.endsWith("ms")) return parseFloat(s);
    if (s.endsWith("s")) return parseFloat(s) * 1000;
    return 0;
  }

  // ── Logo detection — find most likely logo element ──
  let logo: {
    url: string;
    kind: "svg" | "img";
    inlineSvg?: string;
    alt?: string;
    colors: string[];
    localPath?: string;
  } | null = null;

  function findLogo() {
    const base = location.origin;
    const abs = (u: string | null) => {
      if (!u) return "";
      try { return new URL(u, base).href; } catch { return u; }
    };

    // Prefer: header/nav logo img/svg referenced from the site root anchor
    const candidates: Element[] = [
      ...Array.from(document.querySelectorAll('header a[href="/"] img, header a[href="/"] svg')),
      ...Array.from(document.querySelectorAll('nav a[href="/"] img, nav a[href="/"] svg')),
      ...Array.from(document.querySelectorAll('header img[alt*="logo" i], header svg[aria-label*="logo" i]')),
      ...Array.from(document.querySelectorAll('[class*="logo" i] img, [class*="logo" i] svg')),
      ...Array.from(document.querySelectorAll('header img, nav img')).slice(0, 3),
    ];

    for (const c of candidates) {
      if (c.tagName === "SVG" || c.tagName === "svg".toUpperCase()) {
        const svgEl = c as SVGElement;
        const colors = new Set<string>();
        svgEl.querySelectorAll("*").forEach((n) => {
          const fill = (n.getAttribute("fill") || "").trim();
          const stroke = (n.getAttribute("stroke") || "").trim();
          if (fill && fill !== "none" && fill !== "currentColor") colors.add(fill);
          if (stroke && stroke !== "none" && stroke !== "currentColor") colors.add(stroke);
        });
        // Serialize the svg to a data url (inlineSvg)
        const outer = svgEl.outerHTML;
        return {
          url: `data:image/svg+xml;utf8,${encodeURIComponent(outer)}`,
          kind: "svg" as const,
          inlineSvg: outer,
          alt: svgEl.getAttribute("aria-label") || "",
          colors: Array.from(colors).slice(0, 8),
        };
      }
      if (c.tagName === "IMG" || c.tagName === "img".toUpperCase()) {
        const img = c as HTMLImageElement;
        const src = img.currentSrc || img.src;
        if (!src) continue;
        return {
          url: abs(src),
          kind: "img" as const,
          alt: img.alt || "",
          colors: [],
        };
      }
    }
    return null;
  }
  try { logo = findLogo(); } catch { logo = null; }

  // ── Design signals — detect use of modern CSS features ──
  let usesBackdropBlur = false;
  let usesClipPath = false;
  let usesCssFilters = false;
  let usesBgPatterns = false;
  let usesBlendModes = false;
  let uses3dTransforms = false;
  let usesMasks = false;
  const signalNotes: string[] = [];

  for (let i = 0; i < Math.min(elements.length, 2000); i++) {
    const el = elements[i] as HTMLElement;
    if (!el.offsetParent && el.tagName !== "BODY") continue;
    const cs = getComputedStyle(el);
    if (!usesBackdropBlur && /blur\(/i.test(cs.backdropFilter || "")) {
      usesBackdropBlur = true;
      signalNotes.push(`backdrop-blur on <${el.tagName.toLowerCase()}>`);
    }
    if (!usesClipPath) {
      const cp = cs.clipPath || "";
      if (cp && cp !== "none" && !/^inset\(0px\)$/i.test(cp)) {
        usesClipPath = true;
        signalNotes.push(`clip-path on <${el.tagName.toLowerCase()}>`);
      }
    }
    if (!usesCssFilters) {
      const f = cs.filter || "";
      if (f && f !== "none") {
        usesCssFilters = true;
        signalNotes.push(`filter on <${el.tagName.toLowerCase()}>`);
      }
    }
    if (!usesBgPatterns) {
      const bg = cs.backgroundImage || "";
      if (/url\(/i.test(bg) && !/gradient\(/i.test(bg)) {
        usesBgPatterns = true;
        signalNotes.push(`bg pattern on <${el.tagName.toLowerCase()}>`);
      }
    }
    if (!usesBlendModes) {
      const bm = cs.mixBlendMode || "";
      if (bm && bm !== "normal") {
        usesBlendModes = true;
        signalNotes.push(`mix-blend-mode: ${bm}`);
      }
    }
    if (!uses3dTransforms) {
      const t = cs.transform || "";
      if (/perspective\(|rotateX\(|rotateY\(|matrix3d\(/i.test(t)) {
        uses3dTransforms = true;
        signalNotes.push(`3D transform on <${el.tagName.toLowerCase()}>`);
      }
    }
    if (!usesMasks) {
      const m = cs.mask || cs.getPropertyValue("-webkit-mask") || "";
      if (m && m !== "none" && m !== "") {
        usesMasks = true;
        signalNotes.push(`mask on <${el.tagName.toLowerCase()}>`);
      }
    }
  }

  // ── Microcopy — hero, CTAs, nav, section titles ──
  function cleanText(s: string | null | undefined): string {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  const heroHeadlineEl = document.querySelector("h1");
  const heroHeadline = cleanText(heroHeadlineEl?.textContent);
  let heroSub = "";
  if (heroHeadlineEl) {
    // Find the next paragraph-like element after the hero headline
    let sib = heroHeadlineEl.nextElementSibling;
    let tries = 0;
    while (sib && tries < 6) {
      const text = cleanText(sib.textContent);
      if (text.length > 20 && text.length < 400 && !/h[1-6]/i.test(sib.tagName)) {
        heroSub = text;
        break;
      }
      sib = sib.nextElementSibling;
      tries++;
    }
  }

  const ctaSet = new Set<string>();
  document.querySelectorAll('button, a[role="button"], a[class*="btn" i], a[class*="cta" i]').forEach((el) => {
    const text = cleanText((el as HTMLElement).textContent);
    if (text && text.length >= 2 && text.length <= 40) ctaSet.add(text);
  });

  const navSet = new Set<string>();
  document.querySelectorAll("header nav a, header > nav a, nav[aria-label*='main' i] a").forEach((el) => {
    const text = cleanText((el as HTMLElement).textContent);
    if (text && text.length >= 2 && text.length <= 30) navSet.add(text);
  });

  const sectionTitles: string[] = [];
  document.querySelectorAll("h2").forEach((el) => {
    const text = cleanText((el as HTMLElement).textContent);
    if (text && text.length >= 3 && text.length <= 100) sectionTitles.push(text);
  });

  // Voice heuristics
  const allMicro = [heroHeadline, heroSub, ...Array.from(ctaSet), ...sectionTitles].join(" ");
  const voiceTags: string[] = [];
  if (/\b(you|your|yours)\b/i.test(allMicro)) voiceTags.push("direct");
  if (/\b(api|sdk|platform|webhook|deploy|workflow|integration)\b/i.test(allMicro)) voiceTags.push("technical");
  if (/[!?]/.test(heroHeadline)) voiceTags.push("energetic");
  if (/\b\d+[%x+]|\b\d{2,}\b/.test(heroHeadline + " " + heroSub)) voiceTags.push("numeric");
  if (/\b(hey|hi|let's|lets|come on|meet)\b/i.test(allMicro)) voiceTags.push("casual");
  if (heroHeadline.split(" ").length <= 4 && heroHeadline.length > 0) voiceTags.push("punchy");

  // ── Hero composition ──
  type HeroPattern = "split-left" | "split-right" | "centered" | "full-bleed" | "minimal" | "unknown";
  let heroPattern: HeroPattern = "unknown";
  let heroHasMedia = false;
  let heroBgKind: "solid" | "gradient" | "image" | "video" = "solid";
  let heroHeightVh = 0;

  (function analyzeHero() {
    // Hero is usually the first full-width section after the header
    const candidates = Array.from(document.querySelectorAll("main > section, main > div, header + section, [class*='hero' i]")).slice(0, 6);
    let hero: HTMLElement | null = null;
    for (const c of candidates) {
      const r = c.getBoundingClientRect();
      if (r.height > window.innerHeight * 0.35 && r.width > window.innerWidth * 0.7) {
        hero = c as HTMLElement;
        break;
      }
    }
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    heroHeightVh = Math.round((rect.height / window.innerHeight) * 100) / 100;

    // Find direct children taking meaningful space
    const cs = getComputedStyle(hero);
    const bg = cs.backgroundImage || "";
    if (hero.querySelector("video")) heroBgKind = "video";
    else if (/url\(/i.test(bg)) heroBgKind = "image";
    else if (/gradient\(/i.test(bg)) heroBgKind = "gradient";
    else heroBgKind = "solid";

    const hasImg = !!hero.querySelector("img, svg:not([aria-hidden='true']), video, canvas");
    heroHasMedia = hasImg;

    // Layout: check first-level grid/flex structure
    const children = Array.from(hero.children).filter((c) => {
      const r = (c as HTMLElement).getBoundingClientRect();
      return r.width > 100 && r.height > 100;
    });

    if (cs.display.includes("grid") || cs.display.includes("flex")) {
      if (children.length >= 2 && hasImg) {
        // Find which side the media is on
        const mediaChild = children.find((c) =>
          (c as HTMLElement).querySelector("img, svg:not([aria-hidden='true']), video, canvas")
        );
        if (mediaChild) {
          const mRect = (mediaChild as HTMLElement).getBoundingClientRect();
          const heroMid = rect.left + rect.width / 2;
          heroPattern = mRect.left + mRect.width / 2 > heroMid ? "split-right" : "split-left";
        } else {
          heroPattern = "centered";
        }
      } else if (children.length === 1) {
        heroPattern = "centered";
      }
    }

    if (heroPattern === "unknown") {
      const textAlign = cs.textAlign;
      if (textAlign === "center") heroPattern = "centered";
      else if (rect.width >= window.innerWidth - 2) heroPattern = "full-bleed";
      else heroPattern = "minimal";
    }
  })();

  // ── Selection / cursor / scrollbar ──
  let selectionBg = "";
  let selectionColor = "";
  let caretColor = "";
  let hasCustomScrollbar = false;
  let primaryCursor = "pointer";

  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule) {
          const sel = rule.selectorText || "";
          if (/::selection|::-moz-selection/i.test(sel)) {
            const bg = rule.style.getPropertyValue("background-color") || rule.style.getPropertyValue("background");
            const col = rule.style.getPropertyValue("color");
            if (bg) selectionBg = selectionBg || bg.trim();
            if (col) selectionColor = selectionColor || col.trim();
          }
          if (/::-webkit-scrollbar/i.test(sel)) hasCustomScrollbar = true;
        }
      }
    } catch { /* CORS */ }
  }

  const btn = document.querySelector("button, a[role='button']");
  if (btn) {
    const c = getComputedStyle(btn).cursor;
    if (c && c !== "auto") primaryCursor = c;
  }
  const inputForCaret = document.querySelector("input, textarea");
  if (inputForCaret) {
    const cc = getComputedStyle(inputForCaret).caretColor;
    if (cc && cc !== "auto") caretColor = cc;
  }

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

  let pageBackground: string | null = null;
  for (const el of [document.documentElement, document.body]) {
    const bg = getComputedStyle(el).backgroundColor;
    const hex = toHex(bg);
    if (hex) {
      pageBackground = hex;
      break;
    }
  }
  if (!pageBackground) {
    const main = document.querySelector("main, [role='main'], .hero, header, section");
    if (main) {
      const hex = toHex(getComputedStyle(main).backgroundColor);
      if (hex) pageBackground = hex;
    }
  }

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
    gradients: Array.from(gradientMap.entries()).map(([value, meta]) => ({
      value,
      type: meta.type,
      sampleTag: meta.tag,
      occurrences: meta.count,
    })),
    transitions: Array.from(transitionMap.entries()).map(([key, count]) => {
      const [ms, easing] = key.split("|");
      return { durationMs: parseFloat(ms), easing, occurrences: count };
    }),
    logo,
    designSignals: {
      usesBackdropBlur,
      usesClipPath,
      usesCssFilters,
      usesBgPatterns,
      usesBlendModes,
      uses3dTransforms,
      usesMasks,
      notes: signalNotes.slice(0, 20),
    },
    microcopy: {
      heroHeadline,
      heroSubheadline: heroSub,
      ctaLabels: Array.from(ctaSet).slice(0, 15),
      navLabels: Array.from(navSet).slice(0, 15),
      sectionTitles: sectionTitles.slice(0, 10),
      voiceTags,
    },
    heroComposition: {
      pattern: heroPattern,
      hasMedia: heroHasMedia,
      backgroundKind: heroBgKind,
      heightVh: heroHeightVh,
    },
    selection: {
      selectionBg,
      selectionColor,
      hasCustomScrollbar,
      primaryCursor,
      caretColor,
    },
  };
}

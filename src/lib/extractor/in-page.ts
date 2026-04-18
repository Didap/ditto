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
  };
}

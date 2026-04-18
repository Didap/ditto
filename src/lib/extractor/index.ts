import { extractFromPage, type RawExtraction } from "./browser";
import type {
  DesignTokens,
  ResolvedDesign,
  ColorToken,
  TypographyToken,
  TypeScale,
  SpacingToken,
  ShadowToken,
  RadiusToken,
  ComponentToken,
  ColorRole,
} from "../types";
import { scoreDesignQuality, type DesignQualityScore } from "../quality-scorer";

// ── Main extraction pipeline ──

export async function extractDesign(url: string): Promise<{
  tokens: DesignTokens;
  resolved: ResolvedDesign;
  quality: DesignQualityScore;
}> {
  const raw = await extractFromPage(url);
  return finalizeExtraction(raw);
}

/**
 * Runs the processing pipeline on a `RawExtraction` obtained from any source
 * (Puppeteer server-side, or the user's browser via the bookmarklet fallback).
 */
export function finalizeExtraction(raw: RawExtraction): {
  tokens: DesignTokens;
  resolved: ResolvedDesign;
  quality: DesignQualityScore;
} {
  const colors = processColors(raw.colors, raw.pageBackground);
  const typography = processTypography(raw.fonts);
  const typeScale = processTypeScale(raw.headingStyles, raw.bodyStyle, raw.fontSizes);
  const spacing = processSpacing(raw.spacings);
  const shadows = processShadows(raw.shadows);
  const radii = processRadii(raw.radii);
  const components = processComponents(raw.componentStyles);

  const tokens: DesignTokens = {
    colors,
    typography,
    typeScale,
    spacing,
    shadows,
    radii,
    components,
    fontSources: raw.fontLinks.map((l) => ({
      href: l.href,
      type: l.type as "google-fonts" | "adobe-fonts" | "cdn" | "self-hosted" | "unknown",
    })),
    fontFaces: raw.fontFaces,
    downloadedFonts: raw.downloadedFonts,
    cssVariables: raw.cssVars,
    meta: {
      ...raw.meta,
      extractedAt: new Date().toISOString(),
    },
  };

  const resolved = resolveDesign(tokens, raw);
  const quality = scoreDesignQuality(tokens, resolved);

  return { tokens, resolved, quality };
}

// ── Color Processing ──

function processColors(
  rawColors: Array<{ hex: string; count: number }>,
  pageBackground?: string | null
): ColorToken[] {
  // Sort by frequency
  const sorted = rawColors.sort((a, b) => b.count - a.count);

  // Deduplicate very similar colors
  const unique: ColorToken[] = [];
  for (const { hex, count } of sorted) {
    const isDuplicate = unique.some(
      (existing) => colorDistance(existing.hex, hex) < 15
    );
    if (!isDuplicate) {
      unique.push({
        hex,
        rgb: hexToRgb(hex),
        occurrences: count,
        name: generateColorName(hex),
      });
    }
  }

  // Assign roles based on heuristics
  assignColorRoles(unique, pageBackground);

  return unique.slice(0, 30);
}

function assignColorRoles(colors: ColorToken[], pageBackground?: string | null): void {
  if (colors.length === 0) return;

  // PRIORITY 1: Use the explicitly detected page background from body/html
  if (pageBackground) {
    const match = colors.find((c) => colorDistance(c.hex, pageBackground) < 20);
    if (match) {
      match.role = "background";
    } else {
      // Add it if not in the palette
      colors.unshift({
        hex: pageBackground,
        rgb: hexToRgb(pageBackground),
        occurrences: 999,
        name: generateColorName(pageBackground),
        role: "background",
      });
    }
  }

  // FALLBACK: Find background from frequency, but prefer LIGHT colors
  // (most sites have light backgrounds; dark ones are rarer)
  if (!colors.some((c) => c.role === "background")) {
    // Try light first
    const lightBg = colors.find((c) => !c.role && getLuminance(c.hex) > 0.85);
    if (lightBg) {
      lightBg.role = "background";
    } else {
      // Then try dark (for dark-themed sites)
      const darkBg = colors.find((c) => !c.role && getLuminance(c.hex) < 0.08);
      if (darkBg) darkBg.role = "background";
    }
  }

  // Find text primary: most common color with high contrast to background
  const bgColor = colors.find((c) => c.role === "background");
  const bgLum = bgColor ? getLuminance(bgColor.hex) : 1;
  const isLightBg = bgLum > 0.5;

  const textCandidates = colors.filter(
    (c) =>
      !c.role &&
      (isLightBg ? getLuminance(c.hex) < 0.3 : getLuminance(c.hex) > 0.7)
  );
  if (textCandidates.length > 0) {
    textCandidates[0].role = "text-primary";
    if (textCandidates.length > 1) textCandidates[1].role = "text-secondary";
    if (textCandidates.length > 2) textCandidates[2].role = "text-muted";
  }

  // Find primary: most saturated non-background, non-text color
  const chromatic = colors
    .filter((c) => !c.role && getSaturation(c.hex) > 30)
    .sort((a, b) => getSaturation(b.hex) - getSaturation(a.hex));

  if (chromatic.length > 0) {
    chromatic[0].role = "primary";
    if (chromatic.length > 1) chromatic[1].role = "secondary";
    if (chromatic.length > 2) chromatic[2].role = "accent";
  }

  // Find border: low-saturation, mid-luminance
  const borderCandidates = colors.filter(
    (c) =>
      !c.role &&
      getSaturation(c.hex) < 20 &&
      getLuminance(c.hex) > 0.3 &&
      getLuminance(c.hex) < 0.9
  );
  if (borderCandidates.length > 0) {
    borderCandidates[0].role = "border";
  }

  // Find surface: slight offset from background
  const surfaceCandidates = colors.filter(
    (c) =>
      !c.role &&
      getSaturation(c.hex) < 15 &&
      Math.abs(getLuminance(c.hex) - bgLum) < 0.15 &&
      Math.abs(getLuminance(c.hex) - bgLum) > 0.02
  );
  if (surfaceCandidates.length > 0) {
    surfaceCandidates[0].role = "surface";
  }

  // Semantic colors by hue
  const unassigned = colors.filter((c) => !c.role && getSaturation(c.hex) > 20);
  for (const c of unassigned) {
    const hue = getHue(c.hex);
    if (hue >= 80 && hue <= 160 && !colors.some((x) => x.role === "success")) {
      c.role = "success";
    } else if (
      hue >= 20 &&
      hue <= 60 &&
      !colors.some((x) => x.role === "warning")
    ) {
      c.role = "warning";
    } else if (
      (hue >= 340 || hue <= 20) &&
      !colors.some((x) => x.role === "error")
    ) {
      c.role = "error";
    } else if (
      hue >= 190 &&
      hue <= 250 &&
      !colors.some((x) => x.role === "info")
    ) {
      c.role = "info";
    }
  }

  // Mark remaining as neutral
  colors.filter((c) => !c.role).forEach((c) => (c.role = "neutral"));
}

// ── Typography Processing ──

function processTypography(
  rawFonts: Array<{ name: string; weights: number[]; count: number }>
): TypographyToken[] {
  const sorted = rawFonts.sort((a, b) => b.count - a.count);
  const result: TypographyToken[] = [];

  for (const font of sorted.slice(0, 5)) {
    const isMonospace =
      /mono|code|consolas|courier|menlo|source\s?code/i.test(font.name);
    const isDisplay = font.weights.some((w) => w >= 700);

    result.push({
      fontFamily: font.name,
      fallbacks: isMonospace
        ? ["SFMono-Regular", "Menlo", "monospace"]
        : ["system-ui", "-apple-system", "sans-serif"],
      weights: font.weights.sort((a, b) => a - b),
      role: isMonospace
        ? "mono"
        : result.length === 0
          ? "heading"
          : result.length === 1
            ? "body"
            : isDisplay
              ? "display"
              : "body",
    });
  }

  return result;
}

function processTypeScale(
  headings: RawExtraction["headingStyles"],
  body: RawExtraction["bodyStyle"],
  fontSizes: Array<{ size: string; count: number }>
): TypeScale[] {
  const scale: TypeScale[] = [];

  for (const h of headings) {
    scale.push({
      role: h.tag.toUpperCase(),
      fontFamily: h.fontFamily,
      size: h.fontSize,
      weight: parseInt(h.fontWeight) || 400,
      lineHeight: h.lineHeight,
      letterSpacing: h.letterSpacing,
    });
  }

  scale.push({
    role: "Body",
    fontFamily: body.fontFamily,
    size: body.fontSize,
    weight: parseInt(body.fontWeight) || 400,
    lineHeight: body.lineHeight,
    letterSpacing: body.letterSpacing,
  });

  // Add small sizes from common font-sizes
  const smallSizes = fontSizes
    .filter((f) => parseFloat(f.size) < parseFloat(body.fontSize))
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);

  for (const s of smallSizes) {
    scale.push({
      role: parseFloat(s.size) < 13 ? "Caption" : "Small",
      fontFamily: body.fontFamily,
      size: s.size,
      weight: parseInt(body.fontWeight) || 400,
      lineHeight: "1.4",
      letterSpacing: "normal",
    });
  }

  return scale;
}

// ── Spacing Processing ──

function processSpacing(
  rawSpacings: Array<{ value: string; count: number }>
): SpacingToken[] {
  const parsed = rawSpacings
    .map(({ value, count }) => ({
      value,
      px: parseFloat(value),
      occurrences: count,
    }))
    .filter((s) => !isNaN(s.px) && s.px > 0 && s.px <= 200)
    .sort((a, b) => a.px - b.px);

  // Deduplicate close values
  const unique: SpacingToken[] = [];
  for (const s of parsed) {
    if (!unique.some((u) => Math.abs(u.px - s.px) < 2)) {
      unique.push(s);
    }
  }

  return unique.slice(0, 12);
}

// ── Shadow Processing ──

function processShadows(
  rawShadows: Array<{ value: string; count: number }>
): ShadowToken[] {
  const sorted = rawShadows.sort((a, b) => b.count - a.count);
  const levels: Array<"sm" | "md" | "lg" | "xl"> = ["sm", "md", "lg", "xl"];

  return sorted.slice(0, 4).map((s, i) => ({
    value: s.value,
    level: levels[i] || "md",
    occurrences: s.count,
  }));
}

// ── Radius Processing ──

function processRadii(
  rawRadii: Array<{ value: string; count: number }>
): RadiusToken[] {
  const parsed = rawRadii
    .map(({ value, count }) => ({
      value,
      px: parseFloat(value),
      occurrences: count,
    }))
    .filter((r) => !isNaN(r.px) && r.px > 0)
    .sort((a, b) => a.px - b.px);

  // Deduplicate
  const unique: RadiusToken[] = [];
  for (const r of parsed) {
    if (!unique.some((u) => Math.abs(u.px - r.px) < 1)) {
      unique.push(r);
    }
  }

  return unique.slice(0, 6);
}

// ── Component Processing ──

function processComponents(
  rawComponents: Array<{
    type: string;
    tag: string;
    styles: Record<string, string>;
  }>
): ComponentToken[] {
  const grouped = new Map<string, typeof rawComponents>();

  for (const comp of rawComponents) {
    const list = grouped.get(comp.type) || [];
    list.push(comp);
    grouped.set(comp.type, list);
  }

  const result: ComponentToken[] = [];

  for (const [type, items] of grouped) {
    if (items.length === 0) continue;

    const primary = items[0];
    result.push({
      type: type as ComponentToken["type"],
      styles: primary.styles,
      variants: items.slice(1).map((item, i) => ({
        name: `variant-${i + 1}`,
        styles: item.styles,
      })),
    });
  }

  return result;
}

// ── Resolve to Preview-ready tokens ──

function resolveDesign(
  tokens: DesignTokens,
  raw: RawExtraction
): ResolvedDesign {
  const findColor = (role: ColorRole, fallback: string): string =>
    tokens.colors.find((c) => c.role === role)?.hex || fallback;

  const headingFont =
    tokens.typography.find((t) => t.role === "heading")?.fontFamily ||
    raw.bodyStyle.fontFamily;
  const bodyFont =
    tokens.typography.find((t) => t.role === "body")?.fontFamily ||
    raw.bodyStyle.fontFamily;
  const monoFont =
    tokens.typography.find((t) => t.role === "mono")?.fontFamily ||
    "ui-monospace";

  const sp = tokens.spacing.map((s) => s.px);

  // Build spacing scale from extracted values
  const pickSpacing = (target: number): string => {
    if (sp.length === 0) return `${target}px`;
    const closest = sp.reduce((a, b) =>
      Math.abs(b - target) < Math.abs(a - target) ? b : a
    );
    return `${closest}px`;
  };

  const rd = tokens.radii.map((r) => r.px);
  const pickRadius = (target: number): string => {
    if (rd.length === 0) return `${target}px`;
    const closest = rd.reduce((a, b) =>
      Math.abs(b - target) < Math.abs(a - target) ? b : a
    );
    return `${closest}px`;
  };

  return {
    colorPrimary: findColor("primary", "#6366f1"),
    colorSecondary: findColor("secondary", "#8b5cf6"),
    colorAccent: findColor("accent", "#ec4899"),
    colorBackground: findColor("background", "#ffffff"),
    colorSurface: findColor("surface", "#f8fafc"),
    colorTextPrimary: findColor("text-primary", "#0f172a"),
    colorTextSecondary: findColor("text-secondary", "#475569"),
    colorTextMuted: findColor("text-muted", "#94a3b8"),
    colorBorder: findColor("border", "#e2e8f0"),
    colorSuccess: findColor("success", "#22c55e"),
    colorWarning: findColor("warning", "#f59e0b"),
    colorError: findColor("error", "#ef4444"),

    fontHeading: headingFont,
    fontBody: bodyFont,
    fontMono: monoFont,
    fontWeightHeading:
      tokens.typography.find((t) => t.role === "heading")?.weights[
        tokens.typography.find((t) => t.role === "heading")!.weights.length - 1
      ] || 700,
    fontWeightBody:
      tokens.typography.find((t) => t.role === "body")?.weights[0] || 400,

    textXs: "0.75rem",
    textSm: "0.875rem",
    textBase: raw.bodyStyle.fontSize || "1rem",
    textLg: "1.125rem",
    textXl: "1.25rem",
    text2xl: raw.headingStyles[2]?.fontSize || "1.5rem",
    text3xl: raw.headingStyles[1]?.fontSize || "1.875rem",
    text4xl: raw.headingStyles[0]?.fontSize || "2.25rem",

    spacingXs: pickSpacing(4),
    spacingSm: pickSpacing(8),
    spacingMd: pickSpacing(16),
    spacingLg: pickSpacing(24),
    spacingXl: pickSpacing(32),
    spacing2xl: pickSpacing(48),

    radiusSm: pickRadius(4),
    radiusMd: pickRadius(8),
    radiusLg: pickRadius(12),
    radiusFull: "9999px",

    shadowSm:
      tokens.shadows[0]?.value || "0 1px 2px 0 rgba(0,0,0,0.05)",
    shadowMd:
      tokens.shadows[1]?.value ||
      "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
    shadowLg:
      tokens.shadows[2]?.value ||
      "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",

    lineHeightTight: "1.15",
    lineHeightNormal: "1.5",
    lineHeightRelaxed: "1.75",
  };
}

// ── Color utility functions ──

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getSaturation(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return ((max - min) / max) * 100;
}

function getHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return Math.round(h * 360);
}

function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function generateColorName(hex: string): string {
  const l = getLuminance(hex);
  const s = getSaturation(hex);
  const h = getHue(hex);

  if (s < 10) {
    if (l > 0.95) return "White";
    if (l > 0.8) return "Light Gray";
    if (l > 0.5) return "Gray";
    if (l > 0.2) return "Dark Gray";
    if (l > 0.05) return "Charcoal";
    return "Black";
  }

  const hueNames: Array<[number, string]> = [
    [15, "Red"],
    [35, "Orange"],
    [55, "Yellow"],
    [80, "Lime"],
    [160, "Green"],
    [190, "Teal"],
    [220, "Cyan"],
    [250, "Blue"],
    [280, "Indigo"],
    [310, "Purple"],
    [340, "Pink"],
    [360, "Red"],
  ];

  let hueName = "Red";
  for (const [threshold, name] of hueNames) {
    if (h <= threshold) {
      hueName = name;
      break;
    }
  }

  if (l > 0.7) return `Light ${hueName}`;
  if (l < 0.2) return `Dark ${hueName}`;
  return hueName;
}

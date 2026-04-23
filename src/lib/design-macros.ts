import type { DesignTokens, ResolvedDesign, ColorToken } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

/**
 * Design Macros — preset transformations the user can apply after extraction
 * to shift the overall "sentiment" of the extracted design toward a target.
 *
 * Each macro is a pure function `(tokens, resolved) → { tokens, resolved }`.
 * Applied by the caller; the original extraction is preserved unless the user
 * explicitly saves the macro'd variant.
 *
 * All transformations are deterministic — no AI inference, same input → same
 * output. The logic replicates what a designer would do by hand: shift
 * specific CSS variables proportionally based on the macro's intent.
 */

export interface DesignMacro {
  id: string;
  /** i18n key for the short label shown on the chip. */
  labelKey: TranslationKey;
  /** i18n key for the tooltip description. */
  descriptionKey: TranslationKey;
  /** Icon hint (Lucide icon name) for UI. */
  icon: string;
  apply(input: { tokens: DesignTokens; resolved: ResolvedDesign }): {
    tokens: DesignTokens;
    resolved: ResolvedDesign;
  };
}

export const DESIGN_MACROS: DesignMacro[] = [
  {
    id: "softer",
    labelKey: "macroSofterLabel",
    descriptionKey: "macroSofterDesc",
    icon: "circle",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      r.radiusSm = bumpPx(r.radiusSm, +4, 2, 24);
      r.radiusMd = bumpPx(r.radiusMd, +6, 4, 32);
      r.radiusLg = bumpPx(r.radiusLg, +8, 6, 48);
      r.shadowSm = softenShadow(r.shadowSm);
      r.shadowMd = softenShadow(r.shadowMd);
      r.shadowLg = softenShadow(r.shadowLg);
      return { tokens, resolved: r };
    },
  },
  {
    id: "sharper",
    labelKey: "macroSharperLabel",
    descriptionKey: "macroSharperDesc",
    icon: "square",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      r.radiusSm = bumpPx(r.radiusSm, -3, 0, 24);
      r.radiusMd = bumpPx(r.radiusMd, -6, 0, 24);
      r.radiusLg = bumpPx(r.radiusLg, -10, 0, 24);
      return { tokens, resolved: r };
    },
  },
  {
    id: "airy",
    labelKey: "macroAiryLabel",
    descriptionKey: "macroAiryDesc",
    icon: "wind",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      r.spacingXs = scalePx(r.spacingXs, 1.25);
      r.spacingSm = scalePx(r.spacingSm, 1.3);
      r.spacingMd = scalePx(r.spacingMd, 1.3);
      r.spacingLg = scalePx(r.spacingLg, 1.35);
      r.spacingXl = scalePx(r.spacingXl, 1.4);
      r.spacing2xl = scalePx(r.spacing2xl, 1.4);
      r.lineHeightNormal = "1.65";
      r.lineHeightRelaxed = "1.85";
      return { tokens, resolved: r };
    },
  },
  {
    id: "dense",
    labelKey: "macroDenseLabel",
    descriptionKey: "macroDenseDesc",
    icon: "layout-grid",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      r.spacingXs = scalePx(r.spacingXs, 0.7);
      r.spacingSm = scalePx(r.spacingSm, 0.75);
      r.spacingMd = scalePx(r.spacingMd, 0.75);
      r.spacingLg = scalePx(r.spacingLg, 0.8);
      r.spacingXl = scalePx(r.spacingXl, 0.8);
      r.spacing2xl = scalePx(r.spacing2xl, 0.8);
      r.lineHeightNormal = "1.4";
      r.lineHeightRelaxed = "1.55";
      return { tokens, resolved: r };
    },
  },
  {
    id: "punchier",
    labelKey: "macroPunchierLabel",
    descriptionKey: "macroPunchierDesc",
    icon: "zap",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      r.colorPrimary = saturateHex(r.colorPrimary, +25);
      r.colorSecondary = saturateHex(r.colorSecondary, +15);
      r.colorAccent = saturateHex(r.colorAccent, +20);
      r.fontWeightHeading = Math.max(700, Math.min(900, r.fontWeightHeading + 100));
      const t = { ...tokens, colors: tokens.colors.map((c) => mutateColorSat(c, +20)) };
      return { tokens: t, resolved: r };
    },
  },
  {
    id: "calmer",
    labelKey: "macroCalmerLabel",
    descriptionKey: "macroCalmerDesc",
    icon: "moon",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      r.colorPrimary = saturateHex(r.colorPrimary, -20);
      r.colorSecondary = saturateHex(r.colorSecondary, -15);
      r.colorAccent = saturateHex(r.colorAccent, -15);
      r.fontWeightHeading = Math.max(300, Math.min(700, r.fontWeightHeading - 100));
      const t = { ...tokens, colors: tokens.colors.map((c) => mutateColorSat(c, -18)) };
      return { tokens: t, resolved: r };
    },
  },
  {
    id: "warmer",
    labelKey: "macroWarmerLabel",
    descriptionKey: "macroWarmerDesc",
    icon: "sun",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      r.colorPrimary = shiftHue(r.colorPrimary, -25);
      r.colorSecondary = shiftHue(r.colorSecondary, -25);
      r.colorAccent = shiftHue(r.colorAccent, -20);
      r.colorSurface = shiftHue(r.colorSurface, -10);
      const t = { ...tokens, colors: tokens.colors.map((c) => mutateColorHue(c, -18)) };
      return { tokens: t, resolved: r };
    },
  },
  {
    id: "cooler",
    labelKey: "macroCoolerLabel",
    descriptionKey: "macroCoolerDesc",
    icon: "snowflake",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      r.colorPrimary = shiftHue(r.colorPrimary, +25);
      r.colorSecondary = shiftHue(r.colorSecondary, +25);
      r.colorAccent = shiftHue(r.colorAccent, +20);
      r.colorSurface = shiftHue(r.colorSurface, +10);
      const t = { ...tokens, colors: tokens.colors.map((c) => mutateColorHue(c, +18)) };
      return { tokens: t, resolved: r };
    },
  },
  {
    id: "mono",
    labelKey: "macroMonoLabel",
    descriptionKey: "macroMonoDesc",
    icon: "contrast",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      r.colorSecondary = desaturateHex(r.colorSecondary, 70);
      r.colorAccent = r.colorPrimary; // collapse accent into primary
      const t = {
        ...tokens,
        colors: tokens.colors.map((c) =>
          c.role === "primary" ? c : { ...c, hex: desaturateHex(c.hex, 70), rgb: hexToRgbString(desaturateHex(c.hex, 70)) }
        ),
      };
      return { tokens: t, resolved: r };
    },
  },
  {
    id: "inverted",
    labelKey: "macroInvertedLabel",
    descriptionKey: "macroInvertedDesc",
    icon: "repeat",
    apply: ({ tokens, resolved }) => {
      const r = { ...resolved };
      const bg = r.colorBackground;
      const txt = r.colorTextPrimary;
      r.colorBackground = txt;
      r.colorTextPrimary = bg;
      // Also shift surface and muted text towards the new theme.
      const newIsDark = getLuminance(txt) < 0.4;
      r.colorSurface = newIsDark ? adjustLuminance(txt, +0.08) : adjustLuminance(bg, -0.05);
      r.colorTextSecondary = newIsDark ? "#b0b6c4" : "#475569";
      r.colorTextMuted = newIsDark ? "#7a8194" : "#94a3b8";
      return { tokens, resolved: r };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Color math helpers
// ─────────────────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  if (h.length < 6) return [128, 128, 128];
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

function hexToRgbString(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const conv = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [conv(h + 1 / 3) * 255, conv(h) * 255, conv(h - 1 / 3) * 255];
}

function saturateHex(hex: string, deltaPct: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const s2 = Math.max(0, Math.min(100, s + deltaPct));
  const [r2, g2, b2] = hslToRgb(h, s2, l);
  return rgbToHex(r2, g2, b2);
}

function desaturateHex(hex: string, pct: number): string {
  return saturateHex(hex, -pct);
}

function shiftHue(hex: string, deg: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  let h2 = (h + deg) % 360;
  if (h2 < 0) h2 += 360;
  const [r2, g2, b2] = hslToRgb(h2, s, l);
  return rgbToHex(r2, g2, b2);
}

function mutateColorSat(c: ColorToken, deltaPct: number): ColorToken {
  const hex = saturateHex(c.hex, deltaPct);
  return { ...c, hex, rgb: hexToRgbString(hex) };
}

function mutateColorHue(c: ColorToken, deg: number): ColorToken {
  const hex = shiftHue(c.hex, deg);
  return { ...c, hex, rgb: hexToRgbString(hex) };
}

function bumpPx(value: string, deltaPx: number, min: number, max: number): string {
  const n = parseFloat(value);
  if (isNaN(n)) return value;
  const clamped = Math.max(min, Math.min(max, n + deltaPx));
  return `${clamped}px`;
}

function scalePx(value: string, factor: number): string {
  const n = parseFloat(value);
  if (isNaN(n)) return value;
  return `${Math.round(n * factor)}px`;
}

function softenShadow(value: string): string {
  // Multiply blur and spread radii by 1.4 to soften the shadow.
  return value.replace(/(\d+(?:\.\d+)?)px/g, (m, num) => {
    const n = parseFloat(num);
    if (n === 0) return m;
    return `${Math.round(n * 1.4)}px`;
  });
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const toLin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function adjustLuminance(hex: string, delta: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const l2 = Math.max(0, Math.min(100, l + delta * 100));
  const [r2, g2, b2] = hslToRgb(h, s, l2);
  return rgbToHex(r2, g2, b2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply API — external entry point
// ─────────────────────────────────────────────────────────────────────────────

export function applyMacros(
  tokens: DesignTokens,
  resolved: ResolvedDesign,
  macroIds: string[]
): { tokens: DesignTokens; resolved: ResolvedDesign; applied: string[] } {
  let state = { tokens, resolved };
  const applied: string[] = [];
  for (const id of macroIds) {
    const macro = DESIGN_MACROS.find((m) => m.id === id);
    if (!macro) continue;
    state = macro.apply(state);
    applied.push(id);
  }
  return { ...state, applied };
}

export function getMacro(id: string): DesignMacro | undefined {
  return DESIGN_MACROS.find((m) => m.id === id);
}

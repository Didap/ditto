/**
 * Design Quality Improver
 *
 * Reads the issues from the quality scorer and applies concrete fixes
 * to tokens + resolved design. Pure deterministic transforms — no AI.
 *
 * Cost: 200 credits per 10 points of improvement.
 */

import type { DesignTokens, ResolvedDesign, ColorRole } from "./types";
import { scoreDesignQuality, type DesignQualityScore } from "./quality-scorer";

export const BOOST_COST_PER_10_POINTS = 200;

export interface BoostResult {
  tokens: DesignTokens;
  resolved: ResolvedDesign;
  before: DesignQualityScore;
  after: DesignQualityScore;
  pointsGained: number;
  creditsCharged: number;
  fixesApplied: string[];
}

// ── Color utilities ──

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
      : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Get the dominant hue from the primary color for tinting */
function getBrandHue(resolved: ResolvedDesign): number {
  const [h] = hexToHsl(resolved.colorPrimary);
  return h;
}

// ── Fix functions ──

function fixPureBlackWhite(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  const brandHue = getBrandHue(resolved);
  for (const c of tokens.colors) {
    const h = c.hex.toLowerCase().replace("#", "");
    if (h === "000000" || h === "000") {
      c.hex = hslToHex(brandHue, 0.1, 0.07);
      c.rgb = hexToRgb(c.hex).join(", ");
    } else if (h === "ffffff" || h === "fff") {
      c.hex = hslToHex(brandHue, 0.05, 0.98);
      c.rgb = hexToRgb(c.hex).join(", ");
    }
  }
  // Update resolved
  if (resolved.colorBackground.replace("#", "").toLowerCase() === "ffffff") {
    resolved.colorBackground = hslToHex(brandHue, 0.05, 0.98);
  }
  if (resolved.colorTextPrimary.replace("#", "").toLowerCase() === "000000") {
    resolved.colorTextPrimary = hslToHex(brandHue, 0.1, 0.07);
  }
  fixes.push("Tinted pure black/white toward brand hue");
}

function fixUntintedGrays(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  const brandHue = getBrandHue(resolved);
  for (const c of tokens.colors) {
    const [r, g, b] = hexToRgb(c.hex);
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    const avg = (r + g + b) / 3;
    if (spread <= 5 && avg > 20 && avg < 235) {
      const [, , l] = hexToHsl(c.hex);
      c.hex = hslToHex(brandHue, 0.06, l);
      c.rgb = hexToRgb(c.hex).join(", ");
    }
  }
  fixes.push("Added brand tint to neutral grays");
}

function fixMissingColorRoles(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  const roles = new Set(tokens.colors.map((c) => c.role).filter(Boolean));
  const brandHue = getBrandHue(resolved);

  const defaults: Record<string, string> = {
    primary: resolved.colorPrimary,
    background: resolved.colorBackground,
    "text-primary": resolved.colorTextPrimary,
  };

  for (const [role, fallback] of Object.entries(defaults)) {
    if (!roles.has(role as ColorRole)) {
      tokens.colors.push({
        hex: fallback,
        rgb: hexToRgb(fallback).join(", "),
        role: role as ColorRole,
        occurrences: 1,
      });
      fixes.push(`Added missing "${role}" color role`);
    }
  }

  // Semantic colors
  const semanticDefaults: Record<string, string> = {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    info: hslToHex(brandHue, 0.6, 0.55),
  };
  for (const [role, hex] of Object.entries(semanticDefaults)) {
    if (!roles.has(role as ColorRole)) {
      tokens.colors.push({
        hex,
        rgb: hexToRgb(hex).join(", "),
        role: role as ColorRole,
        occurrences: 1,
      });
    }
  }
  if (!roles.has("success" as ColorRole) || !roles.has("error" as ColorRole)) {
    fixes.push("Added missing semantic colors (success/error/warning/info)");
  }

  // Update resolved with semantic colors
  resolved.colorSuccess = tokens.colors.find((c) => c.role === "success")?.hex || resolved.colorSuccess;
  resolved.colorWarning = tokens.colors.find((c) => c.role === "warning")?.hex || resolved.colorWarning;
  resolved.colorError = tokens.colors.find((c) => c.role === "error")?.hex || resolved.colorError;
}

function fixTooFewColors(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  if (tokens.colors.length >= 4) return;
  const [h, s, l] = hexToHsl(resolved.colorPrimary);
  // Generate complementary colors
  const newColors: Array<{ hex: string; role: ColorRole }> = [
    { hex: hslToHex((h + 30) % 360, s, l), role: "secondary" },
    { hex: hslToHex((h + 180) % 360, s * 0.8, l), role: "accent" },
    { hex: hslToHex(h, s * 0.1, 0.96), role: "surface" },
  ];
  for (const nc of newColors) {
    if (!tokens.colors.find((c) => c.role === nc.role)) {
      tokens.colors.push({
        hex: nc.hex,
        rgb: hexToRgb(nc.hex).join(", "),
        role: nc.role,
        occurrences: 1,
      });
    }
  }
  resolved.colorSecondary = tokens.colors.find((c) => c.role === "secondary")?.hex || resolved.colorSecondary;
  resolved.colorAccent = tokens.colors.find((c) => c.role === "accent")?.hex || resolved.colorAccent;
  resolved.colorSurface = tokens.colors.find((c) => c.role === "surface")?.hex || resolved.colorSurface;
  fixes.push("Generated complementary colors to fill sparse palette");
}

function fixLowContrast(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  const bg = resolved.colorBackground;
  const bgLum = getLuminance(bg);
  const isDark = bgLum < 0.5;

  // Fix text colors to meet WCAG AA
  const adjustForContrast = (textHex: string, minRatio: number): string => {
    let [h, s, l] = hexToHsl(textHex);
    for (let i = 0; i < 30; i++) {
      if (contrastRatio(hslToHex(h, s, l), bg) >= minRatio) break;
      l += isDark ? 0.02 : -0.02;
      l = Math.max(0, Math.min(1, l));
    }
    return hslToHex(h, s, l);
  };

  const newPrimary = adjustForContrast(resolved.colorTextPrimary, 4.5);
  if (newPrimary !== resolved.colorTextPrimary) {
    resolved.colorTextPrimary = newPrimary;
    const tc = tokens.colors.find((c) => c.role === "text-primary");
    if (tc) { tc.hex = newPrimary; tc.rgb = hexToRgb(newPrimary).join(", "); }
  }

  const newSecondary = adjustForContrast(resolved.colorTextSecondary, 4.5);
  if (newSecondary !== resolved.colorTextSecondary) {
    resolved.colorTextSecondary = newSecondary;
    const tc = tokens.colors.find((c) => c.role === "text-secondary");
    if (tc) { tc.hex = newSecondary; tc.rgb = hexToRgb(newSecondary).join(", "); }
  }

  const newMuted = adjustForContrast(resolved.colorTextMuted, 3.0);
  if (newMuted !== resolved.colorTextMuted) {
    resolved.colorTextMuted = newMuted;
    const tc = tokens.colors.find((c) => c.role === "text-muted");
    if (tc) { tc.hex = newMuted; tc.rgb = hexToRgb(newMuted).join(", "); }
  }

  fixes.push("Adjusted text colors for WCAG AA contrast");
}

function fixHeadingWeight(resolved: ResolvedDesign, fixes: string[]) {
  if (resolved.fontWeightHeading < 600) {
    resolved.fontWeightHeading = 700;
    fixes.push("Increased heading weight to 700 for stronger hierarchy");
  }
}

function fixSpacingScale(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  if (tokens.spacing.length >= 6) return;
  // Build a proper 4-8-12-16-24-32-48-64 scale
  const scale = [4, 8, 12, 16, 24, 32, 48, 64];
  const existing = new Set(tokens.spacing.map((s) => s.px));
  for (const px of scale) {
    if (!existing.has(px)) {
      tokens.spacing.push({ value: `${px}px`, px, occurrences: 1 });
    }
  }
  tokens.spacing.sort((a, b) => a.px - b.px);
  resolved.spacingXs = "4px";
  resolved.spacingSm = "8px";
  resolved.spacingMd = "16px";
  resolved.spacingLg = "24px";
  resolved.spacingXl = "32px";
  resolved.spacing2xl = "48px";
  fixes.push("Built consistent 8-point spacing scale");
}

function fixShadows(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  if (tokens.shadows.length > 0) return;
  tokens.shadows = [
    { value: "0 1px 2px 0 rgba(0,0,0,0.05)", level: "sm", occurrences: 1 },
    { value: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)", level: "md", occurrences: 1 },
    { value: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)", level: "lg", occurrences: 1 },
  ];
  resolved.shadowSm = tokens.shadows[0].value;
  resolved.shadowMd = tokens.shadows[1].value;
  resolved.shadowLg = tokens.shadows[2].value;
  fixes.push("Added 3-level shadow system (sm/md/lg)");
}

function fixRadii(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  if (tokens.radii.length >= 2) return;
  const defaults = [
    { value: "4px", px: 4, occurrences: 1 },
    { value: "8px", px: 8, occurrences: 1 },
    { value: "12px", px: 12, occurrences: 1 },
  ];
  const existing = new Set(tokens.radii.map((r) => r.px));
  for (const d of defaults) {
    if (!existing.has(d.px)) tokens.radii.push(d);
  }
  tokens.radii.sort((a, b) => a.px - b.px);
  resolved.radiusSm = "4px";
  resolved.radiusMd = "8px";
  resolved.radiusLg = "12px";
  fixes.push("Added border-radius scale (sm/md/lg)");
}

function fixTypeScale(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  if (tokens.typeScale.length >= 3) {
    // Check if scale is too flat — if so, spread it out
    const sizes = tokens.typeScale
      .map((t) => parseFloat(t.size))
      .filter((s) => s > 0)
      .sort((a, b) => a - b);
    if (sizes.length >= 3) {
      const ratios = [];
      for (let i = 1; i < sizes.length; i++) {
        ratios.push(sizes[i] / sizes[i - 1]);
      }
      const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      if (avg < 1.25) {
        // Rebuild with 1.25 ratio (Major Third)
        const base = parseFloat(resolved.textBase) || 1;
        const unit = resolved.textBase.includes("rem") ? "rem" : "px";
        const ratio = 1.25;
        resolved.textSm = `${(base / ratio).toFixed(3)}${unit}`;
        resolved.textLg = `${(base * ratio).toFixed(3)}${unit}`;
        resolved.textXl = `${(base * ratio ** 2).toFixed(3)}${unit}`;
        resolved.text2xl = `${(base * ratio ** 3).toFixed(3)}${unit}`;
        resolved.text3xl = `${(base * ratio ** 4).toFixed(3)}${unit}`;
        resolved.text4xl = `${(base * ratio ** 5).toFixed(3)}${unit}`;
        fixes.push("Spread type scale to 1.25x (Major Third) ratio");
      }
    }
  } else {
    // Build a scale from scratch
    const base = parseFloat(resolved.textBase) || 1;
    const unit = resolved.textBase.includes("rem") ? "rem" : "px";
    const family = resolved.fontBody;
    const ratio = 1.25;
    const sizes = [
      { role: "xs", size: base / ratio / ratio },
      { role: "sm", size: base / ratio },
      { role: "base", size: base },
      { role: "lg", size: base * ratio },
      { role: "xl", size: base * ratio ** 2 },
      { role: "2xl", size: base * ratio ** 3 },
      { role: "3xl", size: base * ratio ** 4 },
    ];
    for (const s of sizes) {
      tokens.typeScale.push({
        role: s.role,
        fontFamily: family,
        size: `${s.size.toFixed(3)}${unit}`,
        weight: 400,
        lineHeight: "1.5",
        letterSpacing: "0",
      });
    }
    fixes.push("Generated type scale with 1.25x (Major Third) ratio");
  }
}

function fixComponents(tokens: DesignTokens, resolved: ResolvedDesign, fixes: string[]) {
  const types = new Set(tokens.components.map((c) => c.type));
  if (types.size >= 2) return;

  if (!types.has("button")) {
    tokens.components.push({
      type: "button",
      styles: {
        padding: `${resolved.spacingSm} ${resolved.spacingMd}`,
        borderRadius: resolved.radiusMd,
        fontWeight: "600",
        fontSize: resolved.textSm,
      },
      variants: [
        { name: "primary", styles: { backgroundColor: resolved.colorPrimary, color: "#fff" } },
        { name: "secondary", styles: { backgroundColor: resolved.colorSurface, color: resolved.colorTextPrimary, border: `1px solid ${resolved.colorBorder}` } },
      ],
    });
  }
  if (!types.has("card")) {
    tokens.components.push({
      type: "card",
      styles: {
        padding: resolved.spacingLg,
        borderRadius: resolved.radiusLg,
        backgroundColor: resolved.colorSurface,
        border: `1px solid ${resolved.colorBorder}`,
        boxShadow: resolved.shadowSm,
      },
    });
  }
  if (!types.has("input")) {
    tokens.components.push({
      type: "input",
      styles: {
        padding: `${resolved.spacingSm} ${resolved.spacingMd}`,
        borderRadius: resolved.radiusMd,
        border: `1px solid ${resolved.colorBorder}`,
        fontSize: resolved.textSm,
      },
    });
  }
  fixes.push("Added missing component tokens (button/card/input)");
}

// ── Main boost function ──

export function boostDesignQuality(
  tokens: DesignTokens,
  resolved: ResolvedDesign
): BoostResult {
  // Deep clone to avoid mutating originals
  const t: DesignTokens = JSON.parse(JSON.stringify(tokens));
  const r: ResolvedDesign = JSON.parse(JSON.stringify(resolved));

  const before = scoreDesignQuality(tokens, resolved);
  const fixes: string[] = [];

  // Apply all available fixes based on current issues
  const issueCodes = new Set(before.issues.map((i) => i.code));

  if (issueCodes.has("pure-black-white")) fixPureBlackWhite(t, r, fixes);
  if (issueCodes.has("untinted-gray")) fixUntintedGrays(t, r, fixes);
  if (issueCodes.has("missing-role") || issueCodes.has("missing-semantic")) fixMissingColorRoles(t, r, fixes);
  if (issueCodes.has("too-few-colors") || issueCodes.has("sparse-palette")) fixTooFewColors(t, r, fixes);
  if (issueCodes.has("low-contrast")) fixLowContrast(t, r, fixes);
  if (issueCodes.has("light-heading-weight")) fixHeadingWeight(r, fixes);
  if (issueCodes.has("few-spacing-values") || issueCodes.has("inconsistent-scale")) fixSpacingScale(t, r, fixes);
  if (issueCodes.has("no-shadows")) fixShadows(t, r, fixes);
  if (issueCodes.has("few-radii")) fixRadii(t, r, fixes);
  if (issueCodes.has("flat-type-scale") || issueCodes.has("tight-type-scale") || issueCodes.has("few-type-sizes")) fixTypeScale(t, r, fixes);
  if (issueCodes.has("few-components")) fixComponents(t, r, fixes);

  const after = scoreDesignQuality(t, r);
  const pointsGained = Math.max(0, after.overall - before.overall);
  const creditsCharged = Math.ceil(pointsGained / 10) * BOOST_COST_PER_10_POINTS;

  return { tokens: t, resolved: r, before, after, pointsGained, creditsCharged, fixesApplied: fixes };
}

/** Preview boost cost without applying */
export function estimateBoostCost(
  tokens: DesignTokens,
  resolved: ResolvedDesign
): { currentScore: number; estimatedScore: number; estimatedCost: number } {
  const result = boostDesignQuality(tokens, resolved);
  return {
    currentScore: result.before.overall,
    estimatedScore: result.after.overall,
    estimatedCost: result.creditsCharged,
  };
}

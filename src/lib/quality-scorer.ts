/**
 * Design Quality Scorer
 *
 * Scores extracted design tokens against anti-patterns inspired by
 * Impeccable (pbakaus/impeccable). Pure token analysis — no code scanning.
 *
 * 5 dimensions, each 0-100, averaged into an overall score.
 */

import type { DesignTokens, ResolvedDesign } from "./types";

// ── Types ──

export interface DesignQualityScore {
  overall: number; // 0-100
  color: number;
  typography: number;
  spacing: number;
  contrast: number;
  completeness: number;
  issues: DesignQualityIssue[];
}

export interface DesignQualityIssue {
  severity: "error" | "warning" | "info";
  category: "color" | "typography" | "spacing" | "contrast" | "completeness";
  code: string;
  message: string;
}

// ── Reflex fonts — AI-defaults to flag ──

const REFLEX_FONTS = [
  "inter",
  "roboto",
  "open sans",
  "dm sans",
  "playfair display",
  "fraunces",
  "poppins",
  "montserrat",
  "lato",
  "nunito",
  "raleway",
  "source sans",
  "work sans",
];

// ── Color utilities ──

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? [
          parseInt(h[0] + h[0], 16),
          parseInt(h[1] + h[1], 16),
          parseInt(h[2] + h[2], 16),
        ]
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  return n as [number, number, number];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getSaturation(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function isPureBlackOrWhite(hex: string): boolean {
  const h = hex.toLowerCase().replace("#", "");
  return h === "000000" || h === "000" || h === "ffffff" || h === "fff";
}

function isUntintedGray(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  // Gray = all channels within 5 of each other, not at extremes
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const avg = (r + g + b) / 3;
  return spread <= 5 && avg > 20 && avg < 235;
}

// ── Main scorer ──

export function scoreDesignQuality(
  tokens: DesignTokens,
  resolved: ResolvedDesign
): DesignQualityScore {
  const issues: DesignQualityIssue[] = [];

  const color = scoreColor(tokens, resolved, issues);
  const typography = scoreTypography(tokens, resolved, issues);
  const spacing = scoreSpacing(tokens, issues);
  const contrast = scoreContrast(resolved, issues);
  const completeness = scoreCompleteness(tokens, issues);

  const overall = Math.round(
    (color + typography + spacing + contrast + completeness) / 5
  );

  return { overall, color, typography, spacing, contrast, completeness, issues };
}

// ── 1. Color Score ──

function scoreColor(
  tokens: DesignTokens,
  _resolved: ResolvedDesign,
  issues: DesignQualityIssue[]
): number {
  let score = 100;

  // Pure black or white
  const pureColors = tokens.colors.filter((c) => isPureBlackOrWhite(c.hex));
  if (pureColors.length > 0) {
    score -= 10;
    issues.push({
      severity: "warning",
      category: "color",
      code: "pure-black-white",
      message: `${pureColors.length} pure black/white color(s) found — tint slightly toward brand hue`,
    });
  }

  // Untinted grays
  const untinted = tokens.colors.filter((c) => isUntintedGray(c.hex));
  if (untinted.length > 2) {
    score -= 10;
    issues.push({
      severity: "warning",
      category: "color",
      code: "untinted-gray",
      message: `${untinted.length} untinted grays — add slight chroma toward brand hue`,
    });
  }

  // Missing semantic roles
  const roles = new Set(
    tokens.colors.map((c) => c.role as string | undefined).filter((r): r is string => !!r)
  );
  const requiredRoles: string[] = ["primary", "background", "text-primary"];
  const semanticRoles: string[] = ["success", "error", "warning", "info"];

  for (const role of requiredRoles) {
    if (!roles.has(role as typeof role)) {
      score -= 10;
      issues.push({
        severity: "error",
        category: "color",
        code: "missing-role",
        message: `Missing "${role}" color role`,
      });
    }
  }

  const foundSemantic = semanticRoles.filter((r) => roles.has(r)).length;
  if (foundSemantic < 3) {
    score -= 5 * (3 - foundSemantic);
    issues.push({
      severity: "warning",
      category: "color",
      code: "missing-semantic",
      message: `Only ${foundSemantic}/4 semantic colors (success/error/warning/info)`,
    });
  }

  // Too few colors
  if (tokens.colors.length < 4) {
    score -= 15;
    issues.push({
      severity: "error",
      category: "color",
      code: "too-few-colors",
      message: `Only ${tokens.colors.length} colors extracted — palette too limited`,
    });
  }

  // Color variety — check saturation spread
  const saturations = tokens.colors.map((c) => getSaturation(c.hex));
  const avgSat = saturations.reduce((a, b) => a + b, 0) / saturations.length;
  if (avgSat < 0.05) {
    score -= 10;
    issues.push({
      severity: "warning",
      category: "color",
      code: "low-saturation",
      message: "Palette is almost entirely desaturated — lacks vibrancy",
    });
  }

  return Math.max(0, score);
}

// ── 2. Typography Score ──

function scoreTypography(
  tokens: DesignTokens,
  resolved: ResolvedDesign,
  issues: DesignQualityIssue[]
): number {
  let score = 100;

  // Reflex font check
  const fonts = tokens.typography.map((t) => t.fontFamily.toLowerCase());
  const reflexFound = fonts.filter((f) =>
    REFLEX_FONTS.some((r) => f.includes(r))
  );
  if (reflexFound.length > 0) {
    score -= 15;
    issues.push({
      severity: "warning",
      category: "typography",
      code: "reflex-font",
      message: `AI-default font detected: ${reflexFound.join(", ")} — consider a more distinctive choice`,
    });
  }

  // Too many font families
  if (tokens.typography.length > 3) {
    score -= 10;
    issues.push({
      severity: "warning",
      category: "typography",
      code: "too-many-fonts",
      message: `${tokens.typography.length} font families — keep to 2-3 max`,
    });
  }

  // No distinct heading/body
  const hasHeading = tokens.typography.some(
    (t) => t.role === "heading" || t.role === "display"
  );
  const hasBody = tokens.typography.some((t) => t.role === "body");
  if (!hasHeading || !hasBody) {
    score -= 10;
    issues.push({
      severity: "warning",
      category: "typography",
      code: "missing-role",
      message: "Missing distinct heading or body font role",
    });
  }

  // Type scale ratio check
  if (tokens.typeScale.length >= 3) {
    const sizes = tokens.typeScale
      .map((t) => parseFloat(t.size))
      .filter((s) => s > 0)
      .sort((a, b) => a - b);

    if (sizes.length >= 3) {
      const ratios: number[] = [];
      for (let i = 1; i < sizes.length; i++) {
        ratios.push(sizes[i] / sizes[i - 1]);
      }
      const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;

      if (avgRatio < 1.15) {
        score -= 15;
        issues.push({
          severity: "warning",
          category: "typography",
          code: "flat-type-scale",
          message: `Type scale ratio is ${avgRatio.toFixed(2)}x — sizes too close together (aim for 1.25+)`,
        });
      } else if (avgRatio < 1.25) {
        score -= 5;
        issues.push({
          severity: "info",
          category: "typography",
          code: "tight-type-scale",
          message: `Type scale ratio is ${avgRatio.toFixed(2)}x — acceptable but could be more distinct`,
        });
      }
    }
  } else {
    score -= 10;
    issues.push({
      severity: "warning",
      category: "typography",
      code: "few-type-sizes",
      message: "Fewer than 3 type scale entries extracted",
    });
  }

  // Heading weight check
  if (resolved.fontWeightHeading < 600) {
    score -= 5;
    issues.push({
      severity: "info",
      category: "typography",
      code: "light-heading-weight",
      message: `Heading weight is ${resolved.fontWeightHeading} — consider 600+ for clearer hierarchy`,
    });
  }

  return Math.max(0, score);
}

// ── 3. Spacing Score ──

function scoreSpacing(
  tokens: DesignTokens,
  issues: DesignQualityIssue[]
): number {
  let score = 100;

  const spacingValues = tokens.spacing.map((s) => s.px).sort((a, b) => a - b);

  // Too few spacing values
  if (spacingValues.length < 4) {
    score -= 20;
    issues.push({
      severity: "warning",
      category: "spacing",
      code: "few-spacing-values",
      message: `Only ${spacingValues.length} spacing values — need 6-9 for a proper scale`,
    });
  }

  // Check if values form a consistent scale (each ~1.5-2x the previous)
  if (spacingValues.length >= 4) {
    const ratios: number[] = [];
    for (let i = 1; i < spacingValues.length; i++) {
      if (spacingValues[i - 1] > 0) {
        ratios.push(spacingValues[i] / spacingValues[i - 1]);
      }
    }

    const inconsistent = ratios.filter((r) => r < 1.2 || r > 3.0).length;
    if (inconsistent > ratios.length * 0.4) {
      score -= 15;
      issues.push({
        severity: "warning",
        category: "spacing",
        code: "inconsistent-scale",
        message: "Spacing values don't follow a consistent scale — looks arbitrary",
      });
    }
  }

  // Border radius consistency
  const radiiValues = tokens.radii.map((r) => r.px).sort((a, b) => a - b);
  if (radiiValues.length < 2) {
    score -= 5;
    issues.push({
      severity: "info",
      category: "spacing",
      code: "few-radii",
      message: "Fewer than 2 border-radius values — limited shape vocabulary",
    });
  }

  // Shadow levels
  if (tokens.shadows.length === 0) {
    score -= 10;
    issues.push({
      severity: "warning",
      category: "spacing",
      code: "no-shadows",
      message: "No shadows extracted — no depth system",
    });
  }

  return Math.max(0, score);
}

// ── 4. Contrast & Accessibility Score ──

function scoreContrast(
  resolved: ResolvedDesign,
  issues: DesignQualityIssue[]
): number {
  let score = 100;

  const pairs: Array<{ name: string; text: string; bg: string; min: number }> = [
    { name: "Primary text on background", text: resolved.colorTextPrimary, bg: resolved.colorBackground, min: 4.5 },
    { name: "Secondary text on background", text: resolved.colorTextSecondary, bg: resolved.colorBackground, min: 4.5 },
    { name: "Muted text on background", text: resolved.colorTextMuted, bg: resolved.colorBackground, min: 3.0 },
    { name: "Primary text on surface", text: resolved.colorTextPrimary, bg: resolved.colorSurface, min: 4.5 },
    { name: "Primary color on background", text: resolved.colorPrimary, bg: resolved.colorBackground, min: 3.0 },
  ];

  for (const pair of pairs) {
    try {
      const ratio = contrastRatio(pair.text, pair.bg);
      if (ratio < pair.min) {
        const severity = ratio < 3.0 ? "error" : "warning";
        score -= severity === "error" ? 20 : 10;
        issues.push({
          severity,
          category: "contrast",
          code: "low-contrast",
          message: `${pair.name}: ${ratio.toFixed(1)}:1 (need ${pair.min}:1)`,
        });
      }
    } catch {
      // Skip invalid hex values
    }
  }

  // WCAG AAA check (bonus)
  try {
    const primaryRatio = contrastRatio(
      resolved.colorTextPrimary,
      resolved.colorBackground
    );
    if (primaryRatio >= 7.0) {
      score = Math.min(100, score + 5);
    }
  } catch {
    // Skip
  }

  return Math.max(0, score);
}

// ── 5. System Completeness Score ──

function scoreCompleteness(
  tokens: DesignTokens,
  issues: DesignQualityIssue[]
): number {
  let score = 0;

  // Color tokens (0-20)
  const colorScore = Math.min(20, tokens.colors.length * 2);
  score += colorScore;
  if (tokens.colors.length < 5) {
    issues.push({
      severity: "warning",
      category: "completeness",
      code: "sparse-palette",
      message: `Only ${tokens.colors.length} colors — a mature design system has 8-15+`,
    });
  }

  // Typography tokens (0-20)
  const typoScore = Math.min(20, tokens.typography.length * 7 + tokens.typeScale.length * 2);
  score += typoScore;

  // Component detection (0-20)
  const componentTypes = new Set(tokens.components.map((c) => c.type));
  const compScore = Math.min(20, componentTypes.size * 5);
  score += compScore;
  if (componentTypes.size < 2) {
    issues.push({
      severity: "warning",
      category: "completeness",
      code: "few-components",
      message: `Only ${componentTypes.size} component type(s) detected — expected buttons, cards, inputs`,
    });
  }

  // CSS variables (0-20)
  const varCount = Object.keys(tokens.cssVariables).length;
  const varScore = Math.min(20, varCount);
  score += varScore;
  if (varCount === 0) {
    issues.push({
      severity: "info",
      category: "completeness",
      code: "no-css-vars",
      message: "No CSS custom properties found — site may not use a token system",
    });
  }

  // Spacing + shadows + radii (0-20)
  const depthScore = Math.min(
    20,
    tokens.spacing.length * 2 + tokens.shadows.length * 3 + tokens.radii.length * 2
  );
  score += depthScore;

  return Math.min(100, score);
}

// ── Label helper ──

export function qualityLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

export function qualityColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 75) return "#84cc16";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

/** User-friendly issue descriptions for non-technical users */
export function friendlyIssueMessage(issue: DesignQualityIssue): string {
  switch (issue.code) {
    case "pure-black-white":
      return "Some colors are pure black or white — adding a slight tint would make the design feel more polished.";
    case "untinted-gray":
      return "The grays look flat and generic — a touch of color would give them more personality.";
    case "missing-role":
      return "Some essential colors are missing (e.g. main brand color or text color). The design may look incomplete.";
    case "missing-semantic":
      return "Missing feedback colors (like green for success or red for errors) that help users understand what's happening.";
    case "too-few-colors":
      return "The color palette is too limited — there aren't enough colors to build a complete interface.";
    case "low-saturation":
      return "The palette is almost entirely gray — it lacks vibrancy and visual interest.";
    case "reflex-font":
      return "The fonts used are very common AI/template defaults — a more distinctive choice would stand out more.";
    case "too-many-fonts":
      return "Too many different fonts — using 2–3 max keeps the design clean and consistent.";
    case "missing-role":
      return "Missing a clear distinction between heading and body fonts, which weakens the visual hierarchy.";
    case "flat-type-scale":
      return "Text sizes are too similar to each other — headings don't stand out enough from body text.";
    case "tight-type-scale":
      return "Text sizes could be more spread out — the difference between headings and body text is subtle.";
    case "few-type-sizes":
      return "Very few text sizes were found — a proper scale needs at least small, medium, and large sizes.";
    case "light-heading-weight":
      return "Headings are too light — making them bolder would create a clearer visual hierarchy.";
    case "few-spacing-values":
      return "Not enough spacing options — layouts need a consistent set of small, medium, and large gaps.";
    case "inconsistent-scale":
      return "The spacing values feel random — a consistent rhythm would make layouts look more intentional.";
    case "few-radii":
      return "Not enough corner rounding options — this limits the shape variety in buttons, cards, etc.";
    case "no-shadows":
      return "No shadows were found — shadows add depth and help elements stand out from the background.";
    case "low-contrast":
      return issue.message.replace(/^.*?:/, "Some text is hard to read:") + " — this can cause accessibility issues.";
    case "sparse-palette":
      return "The color palette is small for a mature design system — more colors would cover more use cases.";
    case "few-components":
      return "Very few UI components were detected (like buttons or cards) — the design system may be incomplete.";
    case "no-css-vars":
      return "The site doesn't use design tokens — it may not have a structured design system behind it.";
    default:
      return issue.message;
  }
}

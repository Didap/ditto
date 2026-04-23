import type { ResolvedDesign, DesignTokens } from "./types";
import type { TranslationKey } from "@/lib/i18n";

// ── 10 Design Mood Dimensions ──
// Each is a spectrum from -1 to +1 that maps to concrete design decisions.
//
// Note: the string fields below (`label`, `poles`, `description`, `designImpact`)
// are used ONLY in the English-only DESIGN.md output produced by the hybrid
// generator. The UI never reads these strings — it looks up translated labels
// by `id` via keys like `inspireMoodDim_${id}` in the i18n dictionary.

export interface MoodDimension {
  id: string;
  label: string;
  description: string;
  poles: [string, string]; // [negative pole, positive pole]
  designImpact: {
    negative: string; // What -1 means for the design
    positive: string; // What +1 means for the design
  };
}

export const MOOD_DIMENSIONS: MoodDimension[] = [
  {
    id: "tone",
    label: "Tone",
    poles: ["Playful", "Serious"],
    description: "The overall attitude of the design",
    designImpact: {
      negative: "Vivid colors, large rounded corners, illustrations, rounded fonts",
      positive: "Muted colors, thin borders, photography, serif/classic fonts",
    },
  },
  {
    id: "formality",
    label: "Formality",
    poles: ["Casual", "Institutional"],
    description: "How formal the design feels",
    designImpact: {
      negative: "Relaxed spacing, sans-serif fonts, colloquial language",
      positive: "Strict grid, serif, tight hierarchy, corporate elements",
    },
  },
  {
    id: "energy",
    label: "Energy",
    poles: ["Calm", "Bold"],
    description: "The perceived visual intensity",
    designImpact: {
      negative: "Generous whitespace, soft transitions, low contrast",
      positive: "Huge headlines, high contrast, animations, prominent CTAs",
    },
  },
  {
    id: "temperature",
    label: "Temperature",
    poles: ["Warm", "Cool"],
    description: "The dominant chromatic feeling",
    designImpact: {
      negative: "Orange/red/yellow, beige tones, warm shadows",
      positive: "Blue/purple/green, cool grays, blue-tinted shadows",
    },
  },
  {
    id: "density",
    label: "Density",
    poles: ["Airy", "Dense"],
    description: "How much content fits per viewport",
    designImpact: {
      negative: "Full-screen sections, few elements, lots of air",
      positive: "Compact grids, tables, sidebars, info-dense",
    },
  },
  {
    id: "shape",
    label: "Shape",
    poles: ["Soft", "Angular"],
    description: "The geometry of the components",
    designImpact: {
      negative: "High border-radius (12-24px), pill buttons, blob shapes",
      positive: "Low border-radius (0-4px), sharp lines, crisp edges",
    },
  },
  {
    id: "depth",
    label: "Depth",
    poles: ["Flat", "Three-dimensional"],
    description: "How much the design uses layers and elevation",
    designImpact: {
      negative: "No shadows, thin borders, flat design",
      positive: "Multi-layer shadows, glassmorphism, gradients, elevation",
    },
  },
  {
    id: "palette",
    label: "Palette",
    poles: ["Monochrome", "Vibrant"],
    description: "The chromatic richness",
    designImpact: {
      negative: "1-2 colors, grayscale, single accent",
      positive: "Multi-color, gradients, diversified accents",
    },
  },
  {
    id: "typography",
    label: "Typography",
    poles: ["Expressive", "Minimal"],
    description: "How much typography takes the lead",
    designImpact: {
      negative: "Display fonts, extreme weights, large sizing, decorative",
      positive: "System fonts, normal weights, contained sizing, functional",
    },
  },
  {
    id: "motion",
    label: "Motion",
    poles: ["Static", "Cinematic"],
    description: "Presence of animation and transitions",
    designImpact: {
      negative: "No animations, instant transitions",
      positive: "Scroll animations, hover effects, microinteractions, parallax",
    },
  },
];

// ── 5 Questions that cover all 10 dimensions ──

export interface MoodQuestion {
  id: string;
  question: string;
  subtitle: string;
  dimensions: string[]; // Which dimensions this question maps to
  options: Array<{
    label: string;
    icon: string; // Lucide icon name
    description: string;
    scores: Record<string, number>; // dimension_id -> score (-1 to 1)
  }>;
}

// Note: the string fields below (`question`, `subtitle`, `options[].label`,
// `options[].description`) are kept as English defaults for any non-UI caller.
// The UI looks up translated copy by question `id` and option `icon` via i18n
// keys (`inspireMoodQuestion_${id}`, `inspireMoodOptionLabel_${icon}`, etc.).

export const MOOD_QUESTIONS: MoodQuestion[] = [
  {
    id: "q1",
    question: "What personality does this inspiration have?",
    subtitle: "Think of how it would speak if it were a person",
    dimensions: ["tone", "formality"],
    options: [
      {
        label: "Friendly",
        icon: "smile",
        description: "Relaxed, approachable, playful",
        scores: { tone: -0.8, formality: -0.7 },
      },
      {
        label: "Professional",
        icon: "briefcase",
        description: "Competent, reliable, modern",
        scores: { tone: 0.2, formality: 0.3 },
      },
      {
        label: "Authoritative",
        icon: "landmark",
        description: "Serious, institutional, weighty",
        scores: { tone: 0.9, formality: 0.9 },
      },
    ],
  },
  {
    id: "q2",
    question: "What energy does it give off?",
    subtitle: "The first impression when you land on the page",
    dimensions: ["energy", "motion"],
    options: [
      {
        label: "Zen",
        icon: "wind",
        description: "Calm, space, breathing room",
        scores: { energy: -0.8, motion: -0.6 },
      },
      {
        label: "Dynamic",
        icon: "zap",
        description: "Lively, modern, fluid",
        scores: { energy: 0.4, motion: 0.5 },
      },
      {
        label: "Explosive",
        icon: "rocket",
        description: "Bold, impactful, cinematic",
        scores: { energy: 0.9, motion: 0.9 },
      },
    ],
  },
  {
    id: "q3",
    question: "How do the colors feel?",
    subtitle: "The overall chromatic sensation",
    dimensions: ["temperature", "palette"],
    options: [
      {
        label: "Warm and rich",
        icon: "sun",
        description: "Warm tones, multi-color, expressive",
        scores: { temperature: -0.8, palette: 0.7 },
      },
      {
        label: "Neutral and clean",
        icon: "cloud",
        description: "Few colors, grays, a single accent",
        scores: { temperature: 0.0, palette: -0.6 },
      },
      {
        label: "Cool and sophisticated",
        icon: "snowflake",
        description: "Blue, purple, cool tones, elegant",
        scores: { temperature: 0.8, palette: 0.2 },
      },
    ],
  },
  {
    id: "q4",
    question: "How are shapes and depth?",
    subtitle: "The geometry and elevation of the components",
    dimensions: ["shape", "depth"],
    options: [
      {
        label: "Soft and flat",
        icon: "circle",
        description: "Rounded corners, no shadows, minimal",
        scores: { shape: -0.8, depth: -0.7 },
      },
      {
        label: "Balanced",
        icon: "square",
        description: "Moderate borders, subtle shadows",
        scores: { shape: 0.0, depth: 0.3 },
      },
      {
        label: "Sharp and deep",
        icon: "diamond",
        description: "Crisp angles, strong shadows, layers",
        scores: { shape: 0.8, depth: 0.8 },
      },
    ],
  },
  {
    id: "q5",
    question: "How would you describe text and space?",
    subtitle: "The relationship between content and visual breathing room",
    dimensions: ["density", "typography"],
    options: [
      {
        label: "Airy and expressive",
        icon: "palette",
        description: "Plenty of space, large headlines, decorative fonts",
        scores: { density: -0.8, typography: -0.7 },
      },
      {
        label: "Balanced",
        icon: "ruler",
        description: "Good balance, functional typography",
        scores: { density: 0.0, typography: 0.0 },
      },
      {
        label: "Compact and minimal",
        icon: "layout-grid",
        description: "Info-dense, small fonts, efficient",
        scores: { density: 0.8, typography: 0.8 },
      },
    ],
  },
];

// ── Mood Profile ──

export interface MoodProfile {
  scores: Record<string, number>; // dimension_id -> weighted average score
}

export function createEmptyProfile(): MoodProfile {
  return {
    scores: Object.fromEntries(MOOD_DIMENSIONS.map((d) => [d.id, 0])),
  };
}

// Aggregate mood profiles from multiple inspirations with their answers
export function aggregateProfiles(
  profiles: Array<{ profile: MoodProfile; weight: number }>
): MoodProfile {
  const result = createEmptyProfile();
  const totalWeight = profiles.reduce((sum, p) => sum + p.weight, 0);

  if (totalWeight === 0) return result;

  for (const dim of MOOD_DIMENSIONS) {
    let weightedSum = 0;
    for (const { profile, weight } of profiles) {
      weightedSum += (profile.scores[dim.id] || 0) * weight;
    }
    result.scores[dim.id] = weightedSum / totalWeight;
  }

  return result;
}

// ── Map mood scores to concrete design decisions ──

export interface MoodDesignMap {
  borderRadius: { sm: number; md: number; lg: number };
  fontWeightHeading: number;
  fontWeightBody: number;
  shadowIntensity: number; // 0 = none, 1 = heavy
  spacingMultiplier: number; // 0.7 = compact, 1.3 = airy
  colorSaturationBoost: number; // -30 to +30
  colorTemperatureShift: number; // degrees to shift hue
  contrastLevel: number; // 0.8 = low, 1.2 = high
}

export function moodToDesignMap(profile: MoodProfile): MoodDesignMap {
  const s = profile.scores;

  // Shape dimension → border radius
  const shapeScore = s.shape || 0; // -1 = soft, +1 = angular
  const radiusMd = Math.round(12 - shapeScore * 8); // 4px (angular) to 20px (soft)

  return {
    borderRadius: {
      sm: Math.max(2, Math.round(radiusMd * 0.5)),
      md: Math.max(2, radiusMd),
      lg: Math.max(4, Math.round(radiusMd * 1.5)),
    },
    fontWeightHeading: (s.energy || 0) > 0.3 ? 800 : (s.energy || 0) < -0.3 ? 300 : 600,
    fontWeightBody: 400,
    shadowIntensity: Math.max(0, Math.min(1, 0.5 + (s.depth || 0) * 0.5)),
    spacingMultiplier: 1 + (s.density || 0) * -0.25, // airy = more space
    colorSaturationBoost: (s.palette || 0) * 25,
    colorTemperatureShift: (s.temperature || 0) * 20,
    contrastLevel: 1 + (s.energy || 0) * 0.15,
  };
}

// ── Auto-detect mood from extracted design tokens ──

/**
 * Structured reason so the UI can translate at render time. `key` is an i18n
 * key (e.g. `moodReasonQ1Playful`); `detail` is an untranslated trailing
 * parenthetical like `(14px, 62% sat)` that carries raw numeric evidence.
 */
export interface AutoDetectedReason {
  key: TranslationKey;
  detail?: string;
}

export interface AutoDetectedAnswer {
  questionId: string;
  /** English fallback — the UI reads `inspireMoodQuestion_${questionId}` instead. */
  questionLabel: string;
  /** English fallback — the UI reads `inspireMoodOptionLabel_${chosenIcon}` instead. */
  chosenOption: string;
  chosenIcon: string;
  /** English fallback — the UI reads `inspireMoodOptionDesc_${chosenIcon}` instead. */
  chosenDescription: string;
  confidence: "high" | "medium" | "low";
  reason: AutoDetectedReason;
}

export interface AutoDetectResult {
  profile: MoodProfile;
  answers: AutoDetectedAnswer[];
}

export function autoDetectMood(
  resolved: ResolvedDesign,
  tokens: DesignTokens
): AutoDetectResult {
  const answers: AutoDetectedAnswer[] = [];
  const profile = createEmptyProfile();

  // ── Q1: Personality (tone + formality) ──
  {
    const q = MOOD_QUESTIONS[0];
    const avgRadius = parseFloat(resolved.radiusMd) || 8;
    const hasSerif = /serif/i.test(resolved.fontHeading) && !/sans-serif/i.test(resolved.fontHeading);
    const primarySat = getHslSaturation(resolved.colorPrimary);

    let pick = 1; // default: Professional
    let confidence: "high" | "medium" | "low" = "medium";
    let reason: AutoDetectedReason;

    if (avgRadius >= 14 && primarySat > 50) {
      pick = 0; // Friendly
      reason = { key: "moodReasonQ1Playful", detail: `(${avgRadius}px, ${Math.round(primarySat)}%)` };
      confidence = "high";
    } else if (hasSerif || (avgRadius <= 6 && primarySat < 40)) {
      pick = 2; // Authoritative
      reason = hasSerif
        ? { key: "moodReasonQ1Serif", detail: `(${resolved.fontHeading})` }
        : { key: "moodReasonQ1Authority", detail: `(${avgRadius}px, ${Math.round(primarySat)}%)` };
      confidence = hasSerif ? "high" : "medium";
    } else {
      reason = { key: "moodReasonQ1Balanced", detail: `(${avgRadius}px, ${Math.round(primarySat)}%)` };
    }

    const opt = q.options[pick];
    Object.assign(profile.scores, opt.scores);
    answers.push({
      questionId: q.id,
      questionLabel: q.question,
      chosenOption: opt.label,
      chosenIcon: opt.icon,
      chosenDescription: opt.description,
      confidence,
      reason,
    });
  }

  // ── Q2: Energy (energy + motion) ──
  {
    const q = MOOD_QUESTIONS[1];
    const contrast = getContrastRatio(resolved.colorTextPrimary, resolved.colorBackground);
    const headingWeight = resolved.fontWeightHeading;
    const primarySat = getHslSaturation(resolved.colorPrimary);

    let pick = 1; // default: Dynamic
    let confidence: "high" | "medium" | "low" = "medium";
    let reason: AutoDetectedReason;

    if (contrast < 8 && headingWeight <= 400 && primarySat < 40) {
      pick = 0; // Zen
      reason = { key: "moodReasonQ2Zen", detail: `(${contrast.toFixed(1)}, ${headingWeight})` };
      confidence = "high";
    } else if (contrast >= 14 && headingWeight >= 700 && primarySat > 60) {
      pick = 2; // Explosive
      reason = { key: "moodReasonQ2Explosive", detail: `(${contrast.toFixed(1)}, ${headingWeight})` };
      confidence = "high";
    } else {
      reason = { key: "moodReasonQ2Intermediate", detail: `(${contrast.toFixed(1)}, ${headingWeight})` };
    }

    const opt = q.options[pick];
    Object.assign(profile.scores, opt.scores);
    answers.push({
      questionId: q.id,
      questionLabel: q.question,
      chosenOption: opt.label,
      chosenIcon: opt.icon,
      chosenDescription: opt.description,
      confidence,
      reason,
    });
  }

  // ── Q3: Colors (temperature + palette) ──
  {
    const q = MOOD_QUESTIONS[2];
    const primaryHue = getHue(resolved.colorPrimary);
    const uniqueHues = countUniqueHues(tokens.colors.slice(0, 20).map((c) => c.hex));
    const isWarm = isWarmHue(primaryHue);

    let pick = 1; // default: Neutral
    let confidence: "high" | "medium" | "low" = "medium";
    let reason: AutoDetectedReason;

    if (isWarm && uniqueHues >= 4) {
      pick = 0; // Warm and rich
      reason = { key: "moodReasonQ3Warm", detail: `(${Math.round(primaryHue)}°, ${uniqueHues})` };
      confidence = "high";
    } else if (!isWarm && getHslSaturation(resolved.colorPrimary) > 30) {
      pick = 2; // Cool and sophisticated
      reason = { key: "moodReasonQ3Cool", detail: `(${Math.round(primaryHue)}°)` };
      confidence = primaryHue >= 180 && primaryHue <= 300 ? "high" : "medium";
    } else {
      reason = { key: "moodReasonQ3Neutral", detail: `(${uniqueHues})` };
      confidence = uniqueHues <= 2 ? "high" : "medium";
    }

    const opt = q.options[pick];
    Object.assign(profile.scores, opt.scores);
    answers.push({
      questionId: q.id,
      questionLabel: q.question,
      chosenOption: opt.label,
      chosenIcon: opt.icon,
      chosenDescription: opt.description,
      confidence,
      reason,
    });
  }

  // ── Q4: Shapes and depth (shape + depth) ──
  {
    const q = MOOD_QUESTIONS[3];
    const avgRadius = parseFloat(resolved.radiusMd) || 8;
    const hasShadows = resolved.shadowMd !== "none" && resolved.shadowMd !== "";
    const shadowCount = tokens.shadows.length;

    let pick = 1; // default: Balanced
    let confidence: "high" | "medium" | "low" = "medium";
    let reason: AutoDetectedReason;

    if (avgRadius >= 14 && (!hasShadows || shadowCount <= 1)) {
      pick = 0; // Soft and flat
      reason = { key: "moodReasonQ4Soft", detail: `(${avgRadius}px, ${shadowCount})` };
      confidence = "high";
    } else if (avgRadius <= 6 && hasShadows && shadowCount >= 3) {
      pick = 2; // Sharp and deep
      reason = { key: "moodReasonQ4Sharp", detail: `(${avgRadius}px, ${shadowCount})` };
      confidence = "high";
    } else {
      reason = { key: "moodReasonQ4Balanced", detail: `(${avgRadius}px, ${shadowCount})` };
    }

    const opt = q.options[pick];
    Object.assign(profile.scores, opt.scores);
    answers.push({
      questionId: q.id,
      questionLabel: q.question,
      chosenOption: opt.label,
      chosenIcon: opt.icon,
      chosenDescription: opt.description,
      confidence,
      reason,
    });
  }

  // ── Q5: Text and space (density + typography) ──
  {
    const q = MOOD_QUESTIONS[4];
    const spacingMd = parseFloat(resolved.spacingMd) || 16;
    const headingWeight = resolved.fontWeightHeading;
    const hasDisplay = tokens.typography.some((t) => t.role === "display");

    let pick = 1; // default: Balanced
    let confidence: "high" | "medium" | "low" = "medium";
    let reason: AutoDetectedReason;

    if (spacingMd >= 20 && (headingWeight >= 700 || hasDisplay)) {
      pick = 0; // Airy and expressive
      reason = { key: "moodReasonQ5Airy", detail: `(${spacingMd}px, ${headingWeight}${hasDisplay ? ", display" : ""})` };
      confidence = "high";
    } else if (spacingMd <= 12 && headingWeight <= 500) {
      pick = 2; // Compact and minimal
      reason = { key: "moodReasonQ5Compact", detail: `(${spacingMd}px, ${headingWeight})` };
      confidence = "high";
    } else {
      reason = { key: "moodReasonQ5Balanced", detail: `(${spacingMd}px, ${headingWeight})` };
    }

    const opt = q.options[pick];
    Object.assign(profile.scores, opt.scores);
    answers.push({
      questionId: q.id,
      questionLabel: q.question,
      chosenOption: opt.label,
      chosenIcon: opt.icon,
      chosenDescription: opt.description,
      confidence,
      reason,
    });
  }

  return { profile, answers };
}

// ── Color analysis helpers ──

function hexToRgbArray(hex: string): [number, number, number] {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  if (h.length < 6) return [128, 128, 128];
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
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

function getHslSaturation(hex: string): number {
  const [r, g, b] = hexToRgbArray(hex);
  const [, s] = rgbToHsl(r, g, b);
  return s;
}

function getHue(hex: string): number {
  const [r, g, b] = hexToRgbArray(hex);
  const [h] = rgbToHsl(r, g, b);
  return h;
}

function isWarmHue(hue: number): boolean {
  // Warm: red (0-60) and orange/yellow (300-360)
  return hue <= 60 || hue >= 300;
}

function countUniqueHues(hexColors: string[]): number {
  const buckets = new Set<number>();
  for (const hex of hexColors) {
    const [r, g, b] = hexToRgbArray(hex);
    const [h, s] = rgbToHsl(r, g, b);
    if (s < 10) continue; // skip grays
    buckets.add(Math.floor(h / 30)); // 12 hue buckets
  }
  return buckets.size;
}

function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgbArray(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(fg: string, bg: string): number {
  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

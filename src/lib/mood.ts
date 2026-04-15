import type { ResolvedDesign, DesignTokens } from "./types";

// ── 10 Design Mood Dimensions ──
// Each is a spectrum from -1 to +1 that maps to concrete design decisions

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
    label: "Tono",
    poles: ["Giocoso", "Serio"],
    description: "L'attitudine generale del design",
    designImpact: {
      negative: "Colori vivaci, bordi arrotondati grandi, illustrazioni, font rounded",
      positive: "Colori sobri, bordi sottili, fotografia, font serif/classici",
    },
  },
  {
    id: "formality",
    label: "Formalità",
    poles: ["Casual", "Istituzionale"],
    description: "Quanto il design appare formale",
    designImpact: {
      negative: "Spaziatura rilassata, font sans-serif, linguaggio colloquiale",
      positive: "Grid rigorosa, serif, gerarchia stretta, elementi corporate",
    },
  },
  {
    id: "energy",
    label: "Energia",
    poles: ["Calmo", "Audace"],
    description: "L'intensità visiva percepita",
    designImpact: {
      negative: "Whitespace generoso, transizioni morbide, contrasto basso",
      positive: "Titoli enormi, contrasto forte, animazioni, CTA prominenti",
    },
  },
  {
    id: "temperature",
    label: "Temperatura",
    poles: ["Caldo", "Freddo"],
    description: "La sensazione cromatica dominante",
    designImpact: {
      negative: "Arancio/rosso/giallo, toni beige, ombre calde",
      positive: "Blu/viola/verde, grigi freddi, ombre blue-tinted",
    },
  },
  {
    id: "density",
    label: "Densità",
    poles: ["Arioso", "Denso"],
    description: "Quanto contenuto c'è per viewport",
    designImpact: {
      negative: "Sezioni a schermo intero, pochi elementi, molta aria",
      positive: "Grid compatte, tabelle, sidebar, info-dense",
    },
  },
  {
    id: "shape",
    label: "Forma",
    poles: ["Morbido", "Angolare"],
    description: "La geometria dei componenti",
    designImpact: {
      negative: "Border-radius alti (12-24px), pill buttons, blob shapes",
      positive: "Border-radius bassi (0-4px), linee nette, spigoli vivi",
    },
  },
  {
    id: "depth",
    label: "Profondità",
    poles: ["Piatto", "Tridimensionale"],
    description: "Quanto il design usa livelli ed elevazione",
    designImpact: {
      negative: "No ombre, bordi sottili, flat design",
      positive: "Ombre multi-layer, glassmorphism, gradienti, elevazione",
    },
  },
  {
    id: "palette",
    label: "Palette",
    poles: ["Monocromo", "Vivace"],
    description: "La ricchezza cromatica",
    designImpact: {
      negative: "1-2 colori, scala di grigi, accento singolo",
      positive: "Multi-colore, gradienti, accenti diversificati",
    },
  },
  {
    id: "typography",
    label: "Tipografia",
    poles: ["Espressiva", "Minimale"],
    description: "Quanto la tipografia è protagonista",
    designImpact: {
      negative: "Font display, pesi estremi, sizing grande, decorativa",
      positive: "System font, pesi normali, sizing contenuto, funzionale",
    },
  },
  {
    id: "motion",
    label: "Movimento",
    poles: ["Statico", "Cinematico"],
    description: "Presenza di animazione e transizioni",
    designImpact: {
      negative: "No animazioni, transizioni istantanee",
      positive: "Scroll animations, hover effects, microinterazioni, parallax",
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

export const MOOD_QUESTIONS: MoodQuestion[] = [
  {
    id: "q1",
    question: "Che personalità ha questa ispirazione?",
    subtitle: "Pensa a come parlerebbe se fosse una persona",
    dimensions: ["tone", "formality"],
    options: [
      {
        label: "Amichevole",
        icon: "smile",
        description: "Rilassata, accessibile, giocosa",
        scores: { tone: -0.8, formality: -0.7 },
      },
      {
        label: "Professionale",
        icon: "briefcase",
        description: "Competente, affidabile, moderna",
        scores: { tone: 0.2, formality: 0.3 },
      },
      {
        label: "Autorevole",
        icon: "landmark",
        description: "Seria, istituzionale, di peso",
        scores: { tone: 0.9, formality: 0.9 },
      },
    ],
  },
  {
    id: "q2",
    question: "Che energia trasmette?",
    subtitle: "La prima impressione quando atterri sulla pagina",
    dimensions: ["energy", "motion"],
    options: [
      {
        label: "Zen",
        icon: "wind",
        description: "Calma, spazio, respiro",
        scores: { energy: -0.8, motion: -0.6 },
      },
      {
        label: "Dinamica",
        icon: "zap",
        description: "Vivace, moderna, fluida",
        scores: { energy: 0.4, motion: 0.5 },
      },
      {
        label: "Esplosiva",
        icon: "rocket",
        description: "Audace, impattante, cinematica",
        scores: { energy: 0.9, motion: 0.9 },
      },
    ],
  },
  {
    id: "q3",
    question: "Come percepisci i colori?",
    subtitle: "La sensazione cromatica generale",
    dimensions: ["temperature", "palette"],
    options: [
      {
        label: "Caldi e ricchi",
        icon: "sun",
        description: "Toni caldi, multi-colore, espressivi",
        scores: { temperature: -0.8, palette: 0.7 },
      },
      {
        label: "Neutri e puliti",
        icon: "cloud",
        description: "Pochi colori, grigi, un accento",
        scores: { temperature: 0.0, palette: -0.6 },
      },
      {
        label: "Freddi e sofisticati",
        icon: "snowflake",
        description: "Blu, viola, toni freddi, eleganti",
        scores: { temperature: 0.8, palette: 0.2 },
      },
    ],
  },
  {
    id: "q4",
    question: "Come sono le forme e la profondità?",
    subtitle: "La geometria e l'elevazione dei componenti",
    dimensions: ["shape", "depth"],
    options: [
      {
        label: "Morbide e piatte",
        icon: "circle",
        description: "Bordi arrotondati, niente ombre, minimal",
        scores: { shape: -0.8, depth: -0.7 },
      },
      {
        label: "Bilanciate",
        icon: "square",
        description: "Bordi moderati, ombre sottili",
        scores: { shape: 0.0, depth: 0.3 },
      },
      {
        label: "Nette e profonde",
        icon: "diamond",
        description: "Angoli vivi, ombre forti, layers",
        scores: { shape: 0.8, depth: 0.8 },
      },
    ],
  },
  {
    id: "q5",
    question: "Come descrivi testo e spazio?",
    subtitle: "Il rapporto tra contenuto e respiro visivo",
    dimensions: ["density", "typography"],
    options: [
      {
        label: "Arioso e espressivo",
        icon: "palette",
        description: "Tanto spazio, titoli grandi, font decorate",
        scores: { density: -0.8, typography: -0.7 },
      },
      {
        label: "Bilanciato",
        icon: "ruler",
        description: "Buon equilibrio, tipografia funzionale",
        scores: { density: 0.0, typography: 0.0 },
      },
      {
        label: "Compatto e minimale",
        icon: "layout-grid",
        description: "Info-dense, font piccoli, efficiente",
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

export interface AutoDetectedAnswer {
  questionId: string;
  questionLabel: string;
  chosenOption: string;
  chosenIcon: string;
  chosenDescription: string;
  confidence: "high" | "medium" | "low";
  reason: string;
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

  // ── Q1: Personalità (tone + formality) ──
  {
    const q = MOOD_QUESTIONS[0];
    const avgRadius = parseFloat(resolved.radiusMd) || 8;
    const hasSerif = /serif/i.test(resolved.fontHeading) && !/sans-serif/i.test(resolved.fontHeading);
    const primarySat = getHslSaturation(resolved.colorPrimary);

    let pick = 1; // default: Professionale
    let confidence: "high" | "medium" | "low" = "medium";
    let reason = "";

    if (avgRadius >= 14 && primarySat > 50) {
      pick = 0; // Amichevole
      reason = `Border-radius alto (${avgRadius}px) e colori saturi suggeriscono tono giocoso`;
      confidence = "high";
    } else if (hasSerif || (avgRadius <= 6 && primarySat < 40)) {
      pick = 2; // Autorevole
      reason = hasSerif
        ? `Font serif (${resolved.fontHeading}) suggerisce tono istituzionale`
        : `Bordi netti (${avgRadius}px) e colori sobri suggeriscono autorevolezza`;
      confidence = hasSerif ? "high" : "medium";
    } else {
      reason = `Valori bilanciati (radius ${avgRadius}px, saturazione ${Math.round(primarySat)}%)`;
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

  // ── Q2: Energia (energy + motion) ──
  {
    const q = MOOD_QUESTIONS[1];
    const contrast = getContrastRatio(resolved.colorTextPrimary, resolved.colorBackground);
    const headingWeight = resolved.fontWeightHeading;
    const primarySat = getHslSaturation(resolved.colorPrimary);

    let pick = 1; // default: Dinamica
    let confidence: "high" | "medium" | "low" = "medium";
    let reason = "";

    if (contrast < 8 && headingWeight <= 400 && primarySat < 40) {
      pick = 0; // Zen
      reason = `Contrasto moderato (${contrast.toFixed(1)}), pesi leggeri (${headingWeight}), saturazione bassa`;
      confidence = "high";
    } else if (contrast >= 14 && headingWeight >= 700 && primarySat > 60) {
      pick = 2; // Esplosiva
      reason = `Contrasto alto (${contrast.toFixed(1)}), heading bold (${headingWeight}), colori saturi`;
      confidence = "high";
    } else {
      reason = `Valori intermedi (contrasto ${contrast.toFixed(1)}, peso ${headingWeight})`;
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

  // ── Q3: Colori (temperature + palette) ──
  {
    const q = MOOD_QUESTIONS[2];
    const primaryHue = getHue(resolved.colorPrimary);
    const uniqueHues = countUniqueHues(tokens.colors.slice(0, 20).map((c) => c.hex));
    const isWarm = isWarmHue(primaryHue);

    let pick = 1; // default: Neutri e puliti
    let confidence: "high" | "medium" | "low" = "medium";
    let reason = "";

    if (isWarm && uniqueHues >= 4) {
      pick = 0; // Caldi e ricchi
      reason = `Hue primario caldo (${Math.round(primaryHue)}°) con ${uniqueHues} hue distinti`;
      confidence = "high";
    } else if (!isWarm && getHslSaturation(resolved.colorPrimary) > 30) {
      pick = 2; // Freddi e sofisticati
      reason = `Hue primario freddo (${Math.round(primaryHue)}°), palette sofisticata`;
      confidence = primaryHue >= 180 && primaryHue <= 300 ? "high" : "medium";
    } else {
      reason = `Palette neutra con ${uniqueHues} hue distinti`;
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

  // ── Q4: Forme e profondità (shape + depth) ──
  {
    const q = MOOD_QUESTIONS[3];
    const avgRadius = parseFloat(resolved.radiusMd) || 8;
    const hasShadows = resolved.shadowMd !== "none" && resolved.shadowMd !== "";
    const shadowCount = tokens.shadows.length;

    let pick = 1; // default: Bilanciate
    let confidence: "high" | "medium" | "low" = "medium";
    let reason = "";

    if (avgRadius >= 14 && (!hasShadows || shadowCount <= 1)) {
      pick = 0; // Morbide e piatte
      reason = `Bordi morbidi (${avgRadius}px) e poche ombre (${shadowCount})`;
      confidence = "high";
    } else if (avgRadius <= 6 && hasShadows && shadowCount >= 3) {
      pick = 2; // Nette e profonde
      reason = `Bordi netti (${avgRadius}px) con ${shadowCount} livelli di ombra`;
      confidence = "high";
    } else {
      reason = `Radius ${avgRadius}px, ${shadowCount} ombre — valori bilanciati`;
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

  // ── Q5: Testo e spazio (density + typography) ──
  {
    const q = MOOD_QUESTIONS[4];
    const spacingMd = parseFloat(resolved.spacingMd) || 16;
    const headingWeight = resolved.fontWeightHeading;
    const hasDisplay = tokens.typography.some((t) => t.role === "display");

    let pick = 1; // default: Bilanciato
    let confidence: "high" | "medium" | "low" = "medium";
    let reason = "";

    if (spacingMd >= 20 && (headingWeight >= 700 || hasDisplay)) {
      pick = 0; // Arioso e espressivo
      reason = `Spacing ampio (${spacingMd}px), heading bold (${headingWeight})${hasDisplay ? ", font display presente" : ""}`;
      confidence = "high";
    } else if (spacingMd <= 12 && headingWeight <= 500) {
      pick = 2; // Compatto e minimale
      reason = `Spacing compatto (${spacingMd}px), heading leggero (${headingWeight})`;
      confidence = "high";
    } else {
      reason = `Spacing ${spacingMd}px, peso ${headingWeight} — bilanciato`;
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

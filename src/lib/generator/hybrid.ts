import type { DesignTokens, ResolvedDesign } from "../types";
import type { MoodProfile } from "../mood";
import { moodToDesignMap, MOOD_DIMENSIONS } from "../mood";

interface InspirationInput {
  name: string;
  url: string;
  tokens: DesignTokens;
  resolved: ResolvedDesign;
  moodProfile: MoodProfile;
  weight: number; // 0-1, how much this inspiration influences the output
}

// ── Blend multiple designs into a hybrid ──

export function generateHybridDesign(
  inspirations: InspirationInput[],
  targetProfile: MoodProfile
): { resolved: ResolvedDesign; designMd: string } {
  const designMap = moodToDesignMap(targetProfile);
  const totalWeight = inspirations.reduce((s, i) => s + i.weight, 0);

  // Blend colors by weighted average
  const resolved: ResolvedDesign = {
    colorPrimary: blendColors(inspirations.map((i) => ({ color: i.resolved.colorPrimary, weight: i.weight })), totalWeight),
    colorSecondary: blendColors(inspirations.map((i) => ({ color: i.resolved.colorSecondary, weight: i.weight })), totalWeight),
    colorAccent: blendColors(inspirations.map((i) => ({ color: i.resolved.colorAccent, weight: i.weight })), totalWeight),
    colorBackground: pickByWeight(inspirations.map((i) => ({ value: i.resolved.colorBackground, weight: i.weight }))),
    colorSurface: pickByWeight(inspirations.map((i) => ({ value: i.resolved.colorSurface, weight: i.weight }))),
    colorTextPrimary: pickByWeight(inspirations.map((i) => ({ value: i.resolved.colorTextPrimary, weight: i.weight }))),
    colorTextSecondary: blendColors(inspirations.map((i) => ({ color: i.resolved.colorTextSecondary, weight: i.weight })), totalWeight),
    colorTextMuted: blendColors(inspirations.map((i) => ({ color: i.resolved.colorTextMuted, weight: i.weight })), totalWeight),
    colorBorder: blendColors(inspirations.map((i) => ({ color: i.resolved.colorBorder, weight: i.weight })), totalWeight),
    colorSuccess: pickByWeight(inspirations.map((i) => ({ value: i.resolved.colorSuccess, weight: i.weight }))),
    colorWarning: pickByWeight(inspirations.map((i) => ({ value: i.resolved.colorWarning, weight: i.weight }))),
    colorError: pickByWeight(inspirations.map((i) => ({ value: i.resolved.colorError, weight: i.weight }))),

    // Typography: pick from the highest-weighted inspiration
    fontHeading: pickByWeight(inspirations.map((i) => ({ value: i.resolved.fontHeading, weight: i.weight }))),
    fontBody: pickByWeight(inspirations.map((i) => ({ value: i.resolved.fontBody, weight: i.weight }))),
    fontMono: pickByWeight(inspirations.map((i) => ({ value: i.resolved.fontMono, weight: i.weight }))),
    fontWeightHeading: designMap.fontWeightHeading,
    fontWeightBody: designMap.fontWeightBody,

    // Sizes: average
    textXs: "0.75rem",
    textSm: "0.875rem",
    textBase: "1rem",
    textLg: "1.125rem",
    textXl: "1.25rem",
    text2xl: "1.5rem",
    text3xl: "1.875rem",
    text4xl: "2.25rem",

    // Spacing: adjusted by mood
    spacingXs: `${Math.round(4 * designMap.spacingMultiplier)}px`,
    spacingSm: `${Math.round(8 * designMap.spacingMultiplier)}px`,
    spacingMd: `${Math.round(16 * designMap.spacingMultiplier)}px`,
    spacingLg: `${Math.round(24 * designMap.spacingMultiplier)}px`,
    spacingXl: `${Math.round(32 * designMap.spacingMultiplier)}px`,
    spacing2xl: `${Math.round(48 * designMap.spacingMultiplier)}px`,

    // Radius: from mood
    radiusSm: `${designMap.borderRadius.sm}px`,
    radiusMd: `${designMap.borderRadius.md}px`,
    radiusLg: `${designMap.borderRadius.lg}px`,
    radiusFull: "9999px",

    // Shadows: from highest-weighted, intensity adjusted by mood
    shadowSm: scaleShadow(
      pickByWeight(inspirations.map((i) => ({ value: i.resolved.shadowSm, weight: i.weight }))),
      designMap.shadowIntensity
    ),
    shadowMd: scaleShadow(
      pickByWeight(inspirations.map((i) => ({ value: i.resolved.shadowMd, weight: i.weight }))),
      designMap.shadowIntensity
    ),
    shadowLg: scaleShadow(
      pickByWeight(inspirations.map((i) => ({ value: i.resolved.shadowLg, weight: i.weight }))),
      designMap.shadowIntensity
    ),

    lineHeightTight: "1.15",
    lineHeightNormal: "1.5",
    lineHeightRelaxed: "1.75",
  };

  const designMd = generateHybridMd(inspirations, resolved, targetProfile, designMap);

  return { resolved, designMd };
}

// ── Generate hybrid DESIGN.md ──

function generateHybridMd(
  inspirations: InspirationInput[],
  resolved: ResolvedDesign,
  profile: MoodProfile,
  designMap: ReturnType<typeof moodToDesignMap>
): string {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const onPrimary = getLuminance(resolved.colorPrimary) > 0.5 ? resolved.colorTextPrimary : "#ffffff";
  const isLight = getLuminance(resolved.colorBackground) > 0.5;

  // Build inspiration list with weights
  const inspNames = inspirations.map((i) => i.name).join(", ");
  const inspList = inspirations
    .map((i) => `- [${i.name}](${i.url}) — ${Math.round(i.weight * 100)}% influence`)
    .join("\n");

  // Mood summary — pick the most interesting traits
  const traits: string[] = [];
  for (const d of MOOD_DIMENSIONS) {
    const score = profile.scores[d.id] || 0;
    if (Math.abs(score) > 0.3) {
      const pole = score > 0 ? d.poles[1] : d.poles[0];
      traits.push(pole.toLowerCase());
    }
  }
  const moodSentence = traits.length > 0
    ? `The personality leans **${traits.slice(0, 3).join(", ")}** — ${traits.length > 3 ? `with hints of ${traits.slice(3).join(" and ")}` : "a distinctive combination"}.`
    : "The mood profile sits in balanced territory across all dimensions.";

  const moodTable = MOOD_DIMENSIONS
    .map((d) => {
      const score = profile.scores[d.id] || 0;
      const position = score < -0.3 ? d.poles[0] : score > 0.3 ? d.poles[1] : "Balanced";
      return `| ${d.label} | ${position} | ${score > 0 ? "+" : ""}${score.toFixed(1)} |`;
    })
    .join("\n");

  // Design decisions
  const decisions: string[] = [];
  if (designMap.shadowIntensity < 0.3) decisions.push("Flat design — minimal shadows keep it clean and modern");
  else if (designMap.shadowIntensity > 0.7) decisions.push("Rich depth — multi-layer shadows create a dimensional feel");
  else decisions.push("Subtle elevation — moderate shadows add gentle depth without heaviness");

  if (designMap.borderRadius.md > 14) decisions.push("Soft geometry — generous rounding feels approachable and friendly");
  else if (designMap.borderRadius.md < 6) decisions.push("Sharp edges — tight corners project precision and authority");
  else decisions.push("Balanced shapes — moderate rounding, versatile across contexts");

  if (designMap.spacingMultiplier > 1.1) decisions.push("Generous whitespace — elements breathe, nothing feels cramped");
  else if (designMap.spacingMultiplier < 0.9) decisions.push("Compact density — information-forward, efficient use of screen");
  else decisions.push("Standard rhythm — comfortable spacing that works for most layouts");

  if (designMap.fontWeightHeading >= 700) decisions.push("Bold headlines — strong visual hierarchy, headlines command attention");
  else if (designMap.fontWeightHeading <= 400) decisions.push("Light headlines — elegant and understated, authority without shouting");
  else decisions.push("Medium-weight headlines — clear hierarchy without dominating");

  return `# Your Design System

Blended from ${inspirations.length} sources — ${inspNames} — on ${date}.

This isn't a copy of any single site. Ditto analyzed each inspiration, mapped its visual personality, and merged them into something new based on your mood preferences.

## Sources

${inspList}

## Personality

${moodSentence}

| Dimension | Leaning | Score |
|-----------|---------|-------|
${moodTable}

## The Look & Feel

The palette is **${isLight ? "light" : "dark"}** — background at \`${resolved.colorBackground}\`, text in \`${resolved.colorTextPrimary}\`. The primary color \`${resolved.colorPrimary}\` drives all interactive elements.

Typography pairs **${resolved.fontHeading}** (headings, weight ${resolved.fontWeightHeading}) with **${resolved.fontBody}** (body, weight ${resolved.fontWeightBody})${resolved.fontHeading === resolved.fontBody ? " — same family, different weights for hierarchy" : " — the contrast between the two creates visual interest"}.

${decisions.map((d) => `- ${d}`).join("\n")}

## Color Palette

| Role | Value | When to use |
|------|-------|-------------|
| Primary | \`${resolved.colorPrimary}\` | CTAs, links, active states |
| Secondary | \`${resolved.colorSecondary}\` | Supporting accents |
| Accent | \`${resolved.colorAccent}\` | Decorative highlights, badges |
| Background | \`${resolved.colorBackground}\` | Page canvas |
| Surface | \`${resolved.colorSurface}\` | Cards, elevated panels |
| Text | \`${resolved.colorTextPrimary}\` | Headings, strong labels |
| Text secondary | \`${resolved.colorTextSecondary}\` | Body copy, descriptions |
| Muted | \`${resolved.colorTextMuted}\` | Placeholders, captions |
| Border | \`${resolved.colorBorder}\` | Dividers, container edges |
| Success | \`${resolved.colorSuccess}\` | Confirmations |
| Warning | \`${resolved.colorWarning}\` | Caution states |
| Error | \`${resolved.colorError}\` | Destructive actions |

## Typography

| Role | Font | Weight | Use |
|------|------|--------|-----|
| Display | ${resolved.fontHeading} | ${resolved.fontWeightHeading} | Hero headlines |
| Heading | ${resolved.fontHeading} | ${resolved.fontWeightHeading} | Section titles |
| Body | ${resolved.fontBody} | ${resolved.fontWeightBody} | Everything else |
| Mono | ${resolved.fontMono} | 400 | Code, technical content |

\`\`\`css
:root {
  --font-heading: '${resolved.fontHeading}', system-ui, sans-serif;
  --font-body: '${resolved.fontBody}', system-ui, sans-serif;
  --font-mono: '${resolved.fontMono}', ui-monospace, monospace;
}
\`\`\`

## Components

### Buttons

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | \`${resolved.colorPrimary}\` | \`${onPrimary}\` | none |
| Secondary | transparent | \`${resolved.colorPrimary}\` | 1px solid \`${resolved.colorBorder}\` |
| Ghost | transparent | \`${resolved.colorTextSecondary}\` | none |

All buttons: radius ${resolved.radiusMd}, padding ${resolved.spacingSm} ${resolved.spacingMd}.

### Cards

\`${resolved.colorSurface}\` background, 1px \`${resolved.colorBorder}\` border, ${resolved.radiusLg} radius, \`${resolved.shadowMd}\` shadow. Padding: ${resolved.spacingMd}–${resolved.spacingLg}.

### Inputs

\`${resolved.colorBackground}\` background, 1px \`${resolved.colorBorder}\` border, ${resolved.radiusMd} radius. Focus state switches border to \`${resolved.colorPrimary}\`.

## Layout

| Token | Value |
|-------|-------|
| Spacing XS | ${resolved.spacingXs} |
| Spacing SM | ${resolved.spacingSm} |
| Spacing MD | ${resolved.spacingMd} |
| Spacing LG | ${resolved.spacingLg} |
| Spacing XL | ${resolved.spacingXl} |
| Spacing 2XL | ${resolved.spacing2xl} |
| Radius SM | ${resolved.radiusSm} |
| Radius MD | ${resolved.radiusMd} |
| Radius LG | ${resolved.radiusLg} |
| Shadow SM | \`${resolved.shadowSm}\` |
| Shadow MD | \`${resolved.shadowMd}\` |
| Shadow LG | \`${resolved.shadowLg}\` |

## For AI Agents

Paste this CSS into your project — it's the complete token set:

\`\`\`css
:root {
  --color-primary: ${resolved.colorPrimary};
  --color-secondary: ${resolved.colorSecondary};
  --color-accent: ${resolved.colorAccent};
  --color-bg: ${resolved.colorBackground};
  --color-surface: ${resolved.colorSurface};
  --color-text: ${resolved.colorTextPrimary};
  --color-text-secondary: ${resolved.colorTextSecondary};
  --color-text-muted: ${resolved.colorTextMuted};
  --color-border: ${resolved.colorBorder};
  --color-success: ${resolved.colorSuccess};
  --color-warning: ${resolved.colorWarning};
  --color-error: ${resolved.colorError};
  --radius-sm: ${resolved.radiusSm};
  --radius-md: ${resolved.radiusMd};
  --radius-lg: ${resolved.radiusLg};
  --shadow-sm: ${resolved.shadowSm};
  --shadow-md: ${resolved.shadowMd};
  --shadow-lg: ${resolved.shadowLg};
}
\`\`\`

**Quick prompts:**

> "Hero section: \`${resolved.colorBackground}\` bg, headline ${resolved.text4xl} ${resolved.fontHeading} weight ${resolved.fontWeightHeading} in \`${resolved.colorTextPrimary}\`. Subtitle ${resolved.textLg} in \`${resolved.colorTextSecondary}\`. Primary CTA button."

> "Card: \`${resolved.colorSurface}\` bg, \`${resolved.colorBorder}\` border, ${resolved.radiusLg} radius. Title ${resolved.textXl} bold, body ${resolved.textBase}."

---

*Generated by [Ditto](https://github.com/ditto) — blended from ${inspirations.length} inspirations.*
`;
}

// ── Utilities ──

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1)}`;
}

function blendColors(inputs: Array<{ color: string; weight: number }>, totalWeight: number): string {
  if (inputs.length === 0 || totalWeight === 0) return "#6366f1";

  let r = 0, g = 0, b = 0;
  for (const { color, weight } of inputs) {
    const [cr, cg, cb] = hexToRgb(color);
    r += cr * weight;
    g += cg * weight;
    b += cb * weight;
  }

  return rgbToHex(r / totalWeight, g / totalWeight, b / totalWeight);
}

function pickByWeight<T>(inputs: Array<{ value: T; weight: number }>): T {
  if (inputs.length === 0) throw new Error("No inputs");
  return inputs.reduce((best, curr) => (curr.weight > best.weight ? curr : best)).value;
}

function scaleShadow(shadow: string, intensity: number): string {
  if (intensity <= 0) return "none";
  // Very basic: just return as-is for now. Could scale rgba alpha values.
  return shadow;
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

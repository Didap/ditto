/**
 * DESIGN.md generator — strict Google Labs spec variant (for Stitch).
 *
 * Source: https://github.com/google-labs-code/design.md
 *
 * Output:
 *   1. YAML frontmatter with the exact Google schema (no `_ditto.*` extensions)
 *   2. 8 canonical markdown sections in canonical order with minimal prose
 *
 * Importable into Stitch and any other tool that adopts the spec. If you want
 * the rich LLM coding variant (gradients, motion, voice, extensions), use
 * `generateDesignMdForLLM` instead.
 */

import type {
  DesignTokens,
  ResolvedDesign,
  HeaderVariant,
  SectionVariant,
} from "../types";
import { stringifyFrontmatter, type YamlObject } from "./yaml";

// ── Helpers ────────────────────────────────────────────────────────────

function parsePx(s: string | undefined, fallback = 0): number {
  if (!s) return fallback;
  const m = s.match(/^(-?\d+(?:\.\d+)?)(px)?$/);
  return m ? parseFloat(m[1]) : fallback;
}

function onPrimary(resolved: ResolvedDesign): string {
  // Pick a text color that contrasts with primary. Spec allows any hex.
  const hex = resolved.colorPrimary.replace("#", "");
  if (hex.length < 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  return lum > 0.5 ? resolved.colorTextPrimary : "#ffffff";
}

// ── Token → YAML schema ────────────────────────────────────────────────

function buildColorsBlock(resolved: ResolvedDesign): YamlObject {
  // Map Ditto's 12 roles to a flat colors block. Names are chosen to match
  // common design-system vocabulary, so Stitch's UI maps them cleanly.
  return {
    primary: resolved.colorPrimary,
    onPrimary: onPrimary(resolved),
    secondary: resolved.colorSecondary,
    accent: resolved.colorAccent,
    background: resolved.colorBackground,
    surface: resolved.colorSurface,
    text: resolved.colorTextPrimary,
    textSecondary: resolved.colorTextSecondary,
    textMuted: resolved.colorTextMuted,
    border: resolved.colorBorder,
    success: resolved.colorSuccess,
    warning: resolved.colorWarning,
    error: resolved.colorError,
  };
}

function buildTypographyBlock(resolved: ResolvedDesign): YamlObject {
  // Stitch reads typography as named styles. Each is an object with
  // fontFamily, fontSize, fontWeight, lineHeight, letterSpacing.
  return {
    heading: {
      fontFamily: resolved.fontHeading,
      fontSize: resolved.text4xl,
      fontWeight: resolved.fontWeightHeading,
      lineHeight: resolved.lineHeightTight,
      letterSpacing: "-0.02em",
    },
    title: {
      fontFamily: resolved.fontHeading,
      fontSize: resolved.text3xl,
      fontWeight: resolved.fontWeightHeading,
      lineHeight: resolved.lineHeightTight,
      letterSpacing: "-0.01em",
    },
    subtitle: {
      fontFamily: resolved.fontHeading,
      fontSize: resolved.textXl,
      fontWeight: 600,
      lineHeight: resolved.lineHeightNormal,
    },
    body: {
      fontFamily: resolved.fontBody,
      fontSize: resolved.textBase,
      fontWeight: resolved.fontWeightBody,
      lineHeight: resolved.lineHeightNormal,
    },
    caption: {
      fontFamily: resolved.fontBody,
      fontSize: resolved.textSm,
      fontWeight: resolved.fontWeightBody,
      lineHeight: resolved.lineHeightNormal,
      letterSpacing: "0.01em",
    },
    mono: {
      fontFamily: resolved.fontMono,
      fontSize: resolved.textSm,
      fontWeight: 500,
    },
  };
}

function buildRoundedBlock(resolved: ResolvedDesign): YamlObject {
  return {
    sm: resolved.radiusSm,
    md: resolved.radiusMd,
    lg: resolved.radiusLg,
    full: resolved.radiusFull,
  };
}

function buildSpacingBlock(resolved: ResolvedDesign): YamlObject {
  // Spec uses numbers (px assumed) for spacing.
  return {
    xs: parsePx(resolved.spacingXs, 4),
    sm: parsePx(resolved.spacingSm, 8),
    md: parsePx(resolved.spacingMd, 16),
    lg: parsePx(resolved.spacingLg, 24),
    xl: parsePx(resolved.spacingXl, 32),
    "2xl": parsePx(resolved.spacing2xl, 48),
  };
}

function buildComponentsBlock(): YamlObject {
  // Component tokens use {token.reference} syntax per Google spec.
  // Variants (hover/active/etc.) are separate component entries with
  // related naming.
  return {
    "button-primary": {
      backgroundColor: "{colors.primary}",
      textColor: "{colors.onPrimary}",
      typography: "{typography.body}",
      rounded: "{rounded.md}",
      padding: "{spacing.sm} {spacing.lg}",
    },
    "button-primary-hover": {
      backgroundColor: "{colors.accent}",
      textColor: "{colors.onPrimary}",
    },
    "button-secondary": {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.primary}",
      typography: "{typography.body}",
      rounded: "{rounded.md}",
      padding: "{spacing.sm} {spacing.lg}",
    },
    "button-secondary-hover": {
      backgroundColor: "{colors.border}",
    },
    "button-ghost": {
      backgroundColor: "transparent",
      textColor: "{colors.textSecondary}",
      typography: "{typography.body}",
      rounded: "{rounded.md}",
      padding: "{spacing.sm} {spacing.md}",
    },
    card: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.text}",
      rounded: "{rounded.lg}",
      padding: "{spacing.lg}",
    },
    input: {
      backgroundColor: "{colors.background}",
      textColor: "{colors.text}",
      rounded: "{rounded.md}",
      padding: "{spacing.sm} {spacing.md}",
    },
    "input-focus": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.text}",
    },
    badge: {
      backgroundColor: "{colors.primary}",
      textColor: "{colors.onPrimary}",
      typography: "{typography.caption}",
      rounded: "{rounded.sm}",
      padding: "{spacing.xs} {spacing.sm}",
    },
    nav: {
      backgroundColor: "{colors.background}",
      textColor: "{colors.text}",
      typography: "{typography.body}",
    },
    footer: {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.textMuted}",
      typography: "{typography.caption}",
    },
  };
}

/** Build the pure Google-spec YAML frontmatter (no `_ditto.*` extensions). */
export function buildStitchFrontmatter(
  name: string,
  tokens: DesignTokens,
  resolved: ResolvedDesign,
): string {
  const description =
    tokens.meta?.description ||
    `Design system extracted from ${tokens.meta?.url || "a source brand"} by Ditto.`;

  const obj: YamlObject = {
    version: "alpha",
    name,
    description,
    colors: buildColorsBlock(resolved),
    typography: buildTypographyBlock(resolved),
    rounded: buildRoundedBlock(resolved),
    spacing: buildSpacingBlock(resolved),
    components: buildComponentsBlock(),
  };
  return stringifyFrontmatter(obj);
}

// ── Markdown body (canonical sections) ─────────────────────────────────

const HEADER_VARIANT_COPY: Record<HeaderVariant, string> = {
  classic: "Timeless and refined",
  elegante: "Editorial and quiet",
  artistico: "Asymmetric and expressive",
  fresco: "Compact and playful",
};

function sectionOverview(name: string, resolved: ResolvedDesign): string {
  const variant: HeaderVariant = resolved.headerVariant || "classic";
  return `## Overview

${name} uses **${HEADER_VARIANT_COPY[variant]}** styling. The brand color is \`${resolved.colorPrimary}\` on a \`${resolved.colorBackground}\` canvas with text in \`${resolved.colorTextPrimary}\`.
`;
}

function sectionColors(resolved: ResolvedDesign): string {
  return `## Colors

- **Primary** (\`${resolved.colorPrimary}\`) — main brand color, CTAs, links, active states.
- **Secondary** (\`${resolved.colorSecondary}\`) — supporting accents.
- **Accent** (\`${resolved.colorAccent}\`) — decorative highlights, badges.
- **Background** (\`${resolved.colorBackground}\`) — page canvas.
- **Surface** (\`${resolved.colorSurface}\`) — cards, panels, elevated containers.
- **Text** (\`${resolved.colorTextPrimary}\`) — headings and important content.
- **Border** (\`${resolved.colorBorder}\`) — dividers and container edges.
`;
}

function sectionTypography(resolved: ResolvedDesign): string {
  return `## Typography

Headings use **${resolved.fontHeading}** at weight ${resolved.fontWeightHeading}. Body copy uses **${resolved.fontBody}** at weight ${resolved.fontWeightBody}. Monospace: ${resolved.fontMono}.
`;
}

function sectionLayout(resolved: ResolvedDesign): string {
  return `## Layout

Spacing scale: ${resolved.spacingXs} / ${resolved.spacingSm} / ${resolved.spacingMd} / ${resolved.spacingLg} / ${resolved.spacingXl} / ${resolved.spacing2xl}.

Max content width: 1200px. Section padding typically ${resolved.spacingXl}–${resolved.spacing2xl}.
`;
}

function sectionElevation(resolved: ResolvedDesign): string {
  return `## Elevation & Depth

- **Small** — \`${resolved.shadowSm}\` for hover hints and subtle lifts.
- **Medium** — \`${resolved.shadowMd}\` for cards and dropdowns.
- **Large** — \`${resolved.shadowLg}\` for modals and floating panels.
`;
}

function sectionShapes(resolved: ResolvedDesign): string {
  return `## Shapes

Corner radius scale: small ${resolved.radiusSm}, medium ${resolved.radiusMd}, large ${resolved.radiusLg}, full ${resolved.radiusFull}. Use medium for buttons and inputs, large for cards and elevated containers.
`;
}

function sectionComponents(): string {
  return `## Components

Every component's tokens are declared in the YAML frontmatter above as \`components.<name>\` entries with \`{token.reference}\` syntax. Hover and focus states live as separate entries (\`button-primary-hover\`, \`input-focus\`) so consumers can swap values without duplicating whole component definitions.

Available components: \`button-primary\`, \`button-secondary\`, \`button-ghost\`, \`card\`, \`input\`, \`badge\`, \`nav\`, \`footer\`.
`;
}

function sectionDosAndDonts(resolved: ResolvedDesign): string {
  return `## Do's and Don'ts

**Do**
- Use \`${resolved.colorPrimary}\` for every primary action.
- Headings in \`${resolved.colorTextPrimary}\`, body in \`${resolved.colorTextSecondary}\`, quiet copy in \`${resolved.colorTextMuted}\`.
- Keep radius consistent per surface tier (sm for chips, md for inputs/buttons, lg for cards).
- Respect the spacing scale — don't invent intermediate values.

**Don't**
- Introduce ad-hoc hex values outside the palette.
- Use pure black or pure white for text — the palette already provides tuned equivalents.
- Mix radius sizes on the same surface level.
- Drop below the body font weight for body copy — readability breaks.
`;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Generate a DESIGN.md file that is 100% compliant with Google's DESIGN.md
 * spec (alpha). Pass this to Stitch or any other conforming tool.
 */
export function generateDesignMdForStitch(
  name: string,
  tokens: DesignTokens,
  resolved: ResolvedDesign,
): string {
  const frontmatter = buildStitchFrontmatter(name, tokens, resolved);
  const title = `# ${name}\n`;
  const sections = [
    sectionOverview(name, resolved),
    sectionColors(resolved),
    sectionTypography(resolved),
    sectionLayout(resolved),
    sectionElevation(resolved),
    sectionShapes(resolved),
    sectionComponents(),
    sectionDosAndDonts(resolved),
  ].join("\n");
  return `${frontmatter}\n${title}\n${sections}`;
}

// Re-export section variant type so callers can branch if they want.
export type { SectionVariant };

import type { ResolvedDesign } from "../types";

// ── Tokens Studio for Figma format ──
// https://docs.tokens.studio/

export function generateFigmaTokensStudio(resolved: ResolvedDesign): string {
  const tokens = {
    global: {
      // Colors
      "color-primary": { value: resolved.colorPrimary, type: "color", description: "Primary brand / CTA color" },
      "color-secondary": { value: resolved.colorSecondary, type: "color", description: "Secondary accent" },
      "color-accent": { value: resolved.colorAccent, type: "color", description: "Accent / decorative" },
      "color-background": { value: resolved.colorBackground, type: "color", description: "Page background" },
      "color-surface": { value: resolved.colorSurface, type: "color", description: "Card / elevated surfaces" },
      "color-text": { value: resolved.colorTextPrimary, type: "color", description: "Primary text" },
      "color-text-secondary": { value: resolved.colorTextSecondary, type: "color", description: "Secondary text" },
      "color-text-muted": { value: resolved.colorTextMuted, type: "color", description: "Muted / placeholder text" },
      "color-border": { value: resolved.colorBorder, type: "color", description: "Borders / dividers" },
      "color-success": { value: resolved.colorSuccess, type: "color", description: "Success states" },
      "color-warning": { value: resolved.colorWarning, type: "color", description: "Warning states" },
      "color-error": { value: resolved.colorError, type: "color", description: "Error / destructive" },

      // Typography
      "font-heading": { value: resolved.fontHeading, type: "fontFamilies", description: "Heading font family" },
      "font-body": { value: resolved.fontBody, type: "fontFamilies", description: "Body font family" },
      "font-mono": { value: resolved.fontMono, type: "fontFamilies", description: "Monospace font family" },
      "font-weight-heading": { value: String(resolved.fontWeightHeading), type: "fontWeights" },
      "font-weight-body": { value: String(resolved.fontWeightBody), type: "fontWeights" },

      // Font sizes
      "text-xs": { value: resolved.textXs, type: "fontSizes" },
      "text-sm": { value: resolved.textSm, type: "fontSizes" },
      "text-base": { value: resolved.textBase, type: "fontSizes" },
      "text-lg": { value: resolved.textLg, type: "fontSizes" },
      "text-xl": { value: resolved.textXl, type: "fontSizes" },
      "text-2xl": { value: resolved.text2xl, type: "fontSizes" },
      "text-3xl": { value: resolved.text3xl, type: "fontSizes" },
      "text-4xl": { value: resolved.text4xl, type: "fontSizes" },

      // Line heights
      "line-height-tight": { value: resolved.lineHeightTight, type: "lineHeights" },
      "line-height-normal": { value: resolved.lineHeightNormal, type: "lineHeights" },
      "line-height-relaxed": { value: resolved.lineHeightRelaxed, type: "lineHeights" },

      // Spacing
      "space-xs": { value: resolved.spacingXs, type: "spacing" },
      "space-sm": { value: resolved.spacingSm, type: "spacing" },
      "space-md": { value: resolved.spacingMd, type: "spacing" },
      "space-lg": { value: resolved.spacingLg, type: "spacing" },
      "space-xl": { value: resolved.spacingXl, type: "spacing" },
      "space-2xl": { value: resolved.spacing2xl, type: "spacing" },

      // Border radius
      "radius-sm": { value: resolved.radiusSm, type: "borderRadius" },
      "radius-md": { value: resolved.radiusMd, type: "borderRadius" },
      "radius-lg": { value: resolved.radiusLg, type: "borderRadius" },
      "radius-full": { value: resolved.radiusFull, type: "borderRadius" },

      // Shadows
      "shadow-sm": { value: resolved.shadowSm, type: "boxShadow" },
      "shadow-md": { value: resolved.shadowMd, type: "boxShadow" },
      "shadow-lg": { value: resolved.shadowLg, type: "boxShadow" },

      // ── Composite tokens (Typography styles) ──
      "typography-display": {
        value: {
          fontFamily: `{font-heading}`,
          fontWeight: `{font-weight-heading}`,
          fontSize: `{text-4xl}`,
          lineHeight: `{line-height-tight}`,
        },
        type: "typography",
        description: "Hero / display headlines",
      },
      "typography-h1": {
        value: {
          fontFamily: `{font-heading}`,
          fontWeight: `{font-weight-heading}`,
          fontSize: `{text-3xl}`,
          lineHeight: `{line-height-tight}`,
        },
        type: "typography",
      },
      "typography-h2": {
        value: {
          fontFamily: `{font-heading}`,
          fontWeight: `{font-weight-heading}`,
          fontSize: `{text-2xl}`,
          lineHeight: `{line-height-tight}`,
        },
        type: "typography",
      },
      "typography-h3": {
        value: {
          fontFamily: `{font-heading}`,
          fontWeight: `{font-weight-heading}`,
          fontSize: `{text-xl}`,
          lineHeight: `{line-height-normal}`,
        },
        type: "typography",
      },
      "typography-body": {
        value: {
          fontFamily: `{font-body}`,
          fontWeight: `{font-weight-body}`,
          fontSize: `{text-base}`,
          lineHeight: `{line-height-normal}`,
        },
        type: "typography",
      },
      "typography-small": {
        value: {
          fontFamily: `{font-body}`,
          fontWeight: `{font-weight-body}`,
          fontSize: `{text-sm}`,
          lineHeight: `{line-height-normal}`,
        },
        type: "typography",
      },
      "typography-caption": {
        value: {
          fontFamily: `{font-body}`,
          fontWeight: `{font-weight-body}`,
          fontSize: `{text-xs}`,
          lineHeight: `{line-height-normal}`,
        },
        type: "typography",
      },
      "typography-code": {
        value: {
          fontFamily: `{font-mono}`,
          fontWeight: "400",
          fontSize: `{text-sm}`,
          lineHeight: `{line-height-relaxed}`,
        },
        type: "typography",
      },

      // ── Component tokens ──
      "button-primary-bg": { value: `{color-primary}`, type: "color" },
      "button-primary-text": { value: "#ffffff", type: "color" },
      "button-primary-radius": { value: `{radius-md}`, type: "borderRadius" },
      "button-secondary-bg": { value: "transparent", type: "color" },
      "button-secondary-text": { value: `{color-primary}`, type: "color" },
      "button-secondary-border": { value: `{color-border}`, type: "color" },
      "card-bg": { value: `{color-surface}`, type: "color" },
      "card-border": { value: `{color-border}`, type: "color" },
      "card-radius": { value: `{radius-lg}`, type: "borderRadius" },
      "card-shadow": { value: `{shadow-sm}`, type: "boxShadow" },
      "input-bg": { value: `{color-background}`, type: "color" },
      "input-border": { value: `{color-border}`, type: "color" },
      "input-radius": { value: `{radius-md}`, type: "borderRadius" },
      "input-focus-border": { value: `{color-primary}`, type: "color" },
      "badge-radius": { value: `{radius-sm}`, type: "borderRadius" },
    },
  };

  return JSON.stringify(tokens, null, 2);
}

// ── Native Figma Variables format ──

interface FigmaVariable {
  name: string;
  type: "COLOR" | "FLOAT" | "STRING";
  value: string | number;
  scopes?: string[];
}

export function generateFigmaVariables(resolved: ResolvedDesign): string {
  const variables: FigmaVariable[] = [
    // Colors
    { name: "colors/primary", type: "COLOR", value: resolved.colorPrimary, scopes: ["FILL_COLOR", "STROKE_COLOR"] },
    { name: "colors/secondary", type: "COLOR", value: resolved.colorSecondary, scopes: ["FILL_COLOR"] },
    { name: "colors/accent", type: "COLOR", value: resolved.colorAccent, scopes: ["FILL_COLOR"] },
    { name: "colors/background", type: "COLOR", value: resolved.colorBackground, scopes: ["FILL_COLOR"] },
    { name: "colors/surface", type: "COLOR", value: resolved.colorSurface, scopes: ["FILL_COLOR"] },
    { name: "colors/text", type: "COLOR", value: resolved.colorTextPrimary, scopes: ["FILL_COLOR"] },
    { name: "colors/text-secondary", type: "COLOR", value: resolved.colorTextSecondary, scopes: ["FILL_COLOR"] },
    { name: "colors/text-muted", type: "COLOR", value: resolved.colorTextMuted, scopes: ["FILL_COLOR"] },
    { name: "colors/border", type: "COLOR", value: resolved.colorBorder, scopes: ["STROKE_COLOR"] },
    { name: "colors/success", type: "COLOR", value: resolved.colorSuccess, scopes: ["FILL_COLOR"] },
    { name: "colors/warning", type: "COLOR", value: resolved.colorWarning, scopes: ["FILL_COLOR"] },
    { name: "colors/error", type: "COLOR", value: resolved.colorError, scopes: ["FILL_COLOR"] },

    // Spacing (as floats)
    { name: "spacing/xs", type: "FLOAT", value: parseFloat(resolved.spacingXs) },
    { name: "spacing/sm", type: "FLOAT", value: parseFloat(resolved.spacingSm) },
    { name: "spacing/md", type: "FLOAT", value: parseFloat(resolved.spacingMd) },
    { name: "spacing/lg", type: "FLOAT", value: parseFloat(resolved.spacingLg) },
    { name: "spacing/xl", type: "FLOAT", value: parseFloat(resolved.spacingXl) },
    { name: "spacing/2xl", type: "FLOAT", value: parseFloat(resolved.spacing2xl) },

    // Radius
    { name: "radius/sm", type: "FLOAT", value: parseFloat(resolved.radiusSm) },
    { name: "radius/md", type: "FLOAT", value: parseFloat(resolved.radiusMd) },
    { name: "radius/lg", type: "FLOAT", value: parseFloat(resolved.radiusLg) },

    // Typography (as strings for reference)
    { name: "font/heading", type: "STRING", value: resolved.fontHeading },
    { name: "font/body", type: "STRING", value: resolved.fontBody },
    { name: "font/mono", type: "STRING", value: resolved.fontMono },
  ];

  return JSON.stringify({ variables }, null, 2);
}

// ── Core Design Token Types ──

export interface ColorToken {
  hex: string;
  rgb: string;
  opacity?: number;
  name?: string;        // auto-generated descriptive name
  role?: ColorRole;
  occurrences: number;  // how many times found in CSS
}

export type ColorRole =
  | "primary"
  | "secondary"
  | "accent"
  | "background"
  | "surface"
  | "text-primary"
  | "text-secondary"
  | "text-muted"
  | "border"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

export interface FontSource {
  href: string;
  type: "google-fonts" | "adobe-fonts" | "cdn" | "self-hosted" | "unknown";
}

export interface FontFace {
  family: string;
  weight: string;
  style: string;
  src: string;
  display: string;
}

export interface TypographyToken {
  fontFamily: string;
  fallbacks: string[];
  weights: number[];
  role: "heading" | "body" | "mono" | "display";
}

export interface TypeScale {
  role: string;
  fontFamily: string;
  size: string;
  weight: number;
  lineHeight: string;
  letterSpacing: string;
  features?: string; // e.g., "ss01", "tnum"
}

export interface SpacingToken {
  value: string;
  px: number;
  occurrences: number;
}

export interface ShadowToken {
  value: string;
  level: "sm" | "md" | "lg" | "xl";
  occurrences: number;
}

export interface RadiusToken {
  value: string;
  px: number;
  occurrences: number;
}

export interface ComponentToken {
  type: "button" | "card" | "input" | "badge" | "nav" | "link";
  styles: Record<string, string>;
  variants?: Array<{
    name: string;
    styles: Record<string, string>;
  }>;
}

// ── Extracted Design System ──

export interface DesignTokens {
  colors: ColorToken[];
  typography: TypographyToken[];
  typeScale: TypeScale[];
  spacing: SpacingToken[];
  shadows: ShadowToken[];
  radii: RadiusToken[];
  components: ComponentToken[];
  fontSources: FontSource[];
  fontFaces: FontFace[];
  downloadedFonts: Array<{
    family: string;
    url: string;
    localPath: string;
    format: string;
  }>;
  cssVariables: Record<string, string>;
  meta: {
    url: string;
    title: string;
    description?: string;
    favicon?: string;
    screenshot?: string; // base64
    extractedAt: string;
  };
}

// ── Resolved Design (for preview rendering) ──

export interface ResolvedDesign {
  // Colors
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorSurface: string;
  colorTextPrimary: string;
  colorTextSecondary: string;
  colorTextMuted: string;
  colorBorder: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;

  // Typography
  fontHeading: string;
  fontBody: string;
  fontMono: string;
  fontWeightHeading: number;
  fontWeightBody: number;

  // Sizes
  textXs: string;
  textSm: string;
  textBase: string;
  textLg: string;
  textXl: string;
  text2xl: string;
  text3xl: string;
  text4xl: string;

  // Spacing
  spacingXs: string;
  spacingSm: string;
  spacingMd: string;
  spacingLg: string;
  spacingXl: string;
  spacing2xl: string;

  // Radii
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusFull: string;

  // Shadows
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;

  // Line heights
  lineHeightTight: string;
  lineHeightNormal: string;
  lineHeightRelaxed: string;
}

// ── Design Quality Score ──

export type { DesignQualityScore, DesignQualityIssue } from "./quality-scorer";

// ── Stored Design ──

export interface StoredDesign {
  id: string;
  slug: string;
  name: string;
  url: string;
  description: string;
  tokens: DesignTokens;
  resolved: ResolvedDesign;
  quality?: import("./quality-scorer").DesignQualityScore;
  designMd: string;
  createdAt: string;
  updatedAt: string;
  source: "extracted" | "imported" | "recycled";
  /** ISO date when soft-deleted, undefined if active */
  deletedAt?: string;
  /** Credits spent on this design (extraction + unlocks). Populated by API. */
  creditsSpent?: number;
  /** Which features are currently unlocked. Populated by API. */
  unlockedFeatures?: {
    devkit: boolean;
    complete: boolean;
  };
}

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
  /** Hover/focus/active styles, only present if we managed to capture them. */
  states?: {
    hover?: Record<string, string>;
    focus?: Record<string, string>;
    active?: Record<string, string>;
  };
  variants?: Array<{
    name: string;
    styles: Record<string, string>;
  }>;
}

// ── Extended design signals — heuristic alternatives to vision-model analysis

export interface GradientToken {
  /** Raw CSS value, e.g. "linear-gradient(135deg, #ff0 0%, #f0f 100%)" */
  value: string;
  type: "linear" | "radial" | "conic";
  /** Element tag where it was seen (hint for usage context). */
  sampleTag: string;
  occurrences: number;
}

export interface TransitionToken {
  /** Duration in ms. */
  durationMs: number;
  /** Easing function, e.g. "cubic-bezier(0.4, 0, 0.2, 1)" or "ease-out". */
  easing: string;
  occurrences: number;
}

export interface LogoInfo {
  /** URL of the logo asset (absolute). */
  url: string;
  /** "svg" | "img" — how it was rendered on the page. */
  kind: "svg" | "img";
  /** Local path after download (populated by browser.ts), else empty. */
  localPath?: string;
  /** Inline SVG source if kind==="svg" and we inlined it. */
  inlineSvg?: string;
  /** Alt text or title, if any. */
  alt?: string;
  /** Colors found inside the logo SVG (fill/stroke). */
  colors: string[];
}

export interface DesignSignals {
  /** Presence of `backdrop-filter: blur(...)` — glassmorphism. */
  usesBackdropBlur: boolean;
  /** Presence of `clip-path:` non-trivial (not inset/0). */
  usesClipPath: boolean;
  /** Presence of `filter:` (blur/saturate/hue-rotate) on visible elements. */
  usesCssFilters: boolean;
  /** Presence of `background-image: url(...)` patterns (SVG/repeating). */
  usesBgPatterns: boolean;
  /** Presence of `mix-blend-mode` non-normal. */
  usesBlendModes: boolean;
  /** Presence of `transform: perspective(...)` / 3D transforms. */
  uses3dTransforms: boolean;
  /** Presence of CSS masks. */
  usesMasks: boolean;
  /** List of raw signal strings for debugging/debug UIs. */
  notes: string[];
}

export interface Microcopy {
  /** First h1 text content, cleaned. */
  heroHeadline: string;
  /** First paragraph after the hero headline, cleaned. */
  heroSubheadline: string;
  /** Text of primary CTA button(s), deduped. */
  ctaLabels: string[];
  /** Navigation menu labels. */
  navLabels: string[];
  /** Sample of section titles (h2). */
  sectionTitles: string[];
  /** Inferred voice tags: "direct", "technical", "casual", "numeric", "energetic". */
  voiceTags: string[];
}

export interface HeroComposition {
  /** Pattern name: "split-left", "split-right", "centered", "full-bleed", "minimal", "unknown" */
  pattern:
    | "split-left"
    | "split-right"
    | "centered"
    | "full-bleed"
    | "minimal"
    | "unknown";
  /** Whether the hero has a visible media element (img/video) beside text. */
  hasMedia: boolean;
  /** Detected hero background kind: "solid" | "gradient" | "image" | "video" */
  backgroundKind: "solid" | "gradient" | "image" | "video";
  /** Hero height in viewport units (e.g. 0.9 = 90vh). */
  heightVh: number;
}

export interface SelectionStyle {
  /** CSS variable or color used for ::selection background. Empty if default. */
  selectionBg: string;
  selectionColor: string;
  /** Any custom scrollbar styling detected. */
  hasCustomScrollbar: boolean;
  /** Non-default cursor on clickable elements, e.g. "pointer" (default) or custom. */
  primaryCursor: string;
  /** Custom caret-color if set. */
  caretColor: string;
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
  // ── Extended signals — optional for backward compat with stored designs ──
  gradients?: GradientToken[];
  transitions?: TransitionToken[];
  logo?: LogoInfo | null;
  designSignals?: DesignSignals;
  microcopy?: Microcopy;
  heroComposition?: HeroComposition;
  selection?: SelectionStyle;
  meta: {
    url: string;
    title: string;
    description?: string;
    favicon?: string;
    screenshot?: string; // base64
    extractedAt: string;
  };
}

// ── Branding (user-overridable) ──

export type HeaderVariant = "classic" | "elegante" | "artistico" | "fresco";

export const HEADER_VARIANTS: HeaderVariant[] = [
  "classic",
  "elegante",
  "artistico",
  "fresco",
];

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

  // Branding (user-overridable via Brand tab)
  /** Uploaded logo URL (Cloudinary). Optional — fallback is the Ditto placeholder. */
  logoUrl?: string;
  /** Display name shown next to the logo. Defaults to the design name. */
  brandName?: string;
  /** Which header layout to render in previews and exports. */
  headerVariant?: HeaderVariant;
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
    wordpress: boolean;
    plugin: boolean;
    elementor: boolean;
  };
}

/**
 * Slim variant used on the dashboard grid. Strips the heavy `tokens`,
 * `designMd` and `description` fields — only `resolved` is needed to render
 * the mini-mockup on each card. Saves tens of MB on payloads for users with
 * many designs.
 */
export type DashboardDesignCard = Omit<
  StoredDesign,
  "tokens" | "designMd" | "description"
>;

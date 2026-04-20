/**
 * WordPress block theme generator.
 *
 * Produces a complete FSE (Full Site Editing) theme zipped from Ditto's
 * extracted design tokens. Output is consumed by the client and bundled
 * into a .zip via JSZip — see design-client.tsx.
 *
 * This is the only generator that runs `fetch()` (to bundle self-hosted
 * fonts from /public/fonts/) — its API is async.
 */

import type { ResolvedDesign, DesignTokens } from "../types";

export interface WPThemeFile {
  path: string;
  content: string | Uint8Array;
}

export interface GenerateWordPressThemeOptions {
  designName: string;
  designSlug: string;
  designUrl?: string;
  resolved: ResolvedDesign;
  tokens: DesignTokens;
  authorName?: string;
  authorUri?: string;
  /** Base64 PNG (without data URL prefix) from tokens.meta.screenshot */
  screenshotBase64?: string;
}

interface FontFaceEntry {
  filename: string;
  format: string;
  weight: string;
  style: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function onPrimaryColor(primary: string, fallbackDark: string): string {
  const hex = (primary || "#000000").replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return lum > 0.5 ? fallbackDark : "#ffffff";
}

function slugDashed(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugUnderscore(s: string): string {
  return s.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
}

/** Truncate a slug to fit WordPress text-domain conventions. */
function textDomainFor(slug: string): string {
  const candidate = `${slug}-block-theme`;
  if (candidate.length <= 30) return candidate;
  return `${slug.slice(0, 22)}-block-theme`;
}

function phpEscape(s: string): string {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function htmlEscape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function base64ToBytes(b64: string): Uint8Array {
  const stripped = b64.replace(/^data:image\/[a-z]+;base64,/, "");
  if (typeof atob !== "undefined") {
    const binary = atob(stripped);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return Uint8Array.from(Buffer.from(stripped, "base64"));
}

function normalizeFontFormat(format: string): string {
  const f = (format || "").toLowerCase();
  if (f === "woff2") return "woff2";
  if (f === "woff") return "woff";
  if (f === "otf") return "opentype";
  if (f === "ttf") return "truetype";
  if (f === "eot") return "embedded-opentype";
  return f || "woff2";
}

/** Best-effort weight extraction from filenames like "0-Family-300.woff2". */
function parseWeightFromFilename(filename: string): string {
  const m = filename.match(/-(\d{3})\.(?:woff2?|otf|ttf|eot)$/i);
  return m ? m[1] : "400";
}

/** Best-effort italic detection. */
function parseStyleFromFilename(filename: string): string {
  return /italic/i.test(filename) ? "italic" : "normal";
}

async function fetchFontBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// Synthesize a minimal 1200×900 PNG when no screenshot is available.
// We use a tiny single-color PNG — WP only needs *something* parseable.
function synthesizeFallbackScreenshot(color: string): Uint8Array {
  // 1×1 PNG of the given solid color. WP scales it as a fallback.
  // Build manually to avoid pulling in pngjs in browser bundle.
  const hex = (color || "#cccccc").replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) || 204;
  const g = parseInt(hex.slice(2, 4), 16) || 204;
  const b = parseInt(hex.slice(4, 6), 16) || 204;
  // Hand-rolled 1×1 PNG with the color (8-bit RGB). Smallest possible.
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const ihdr = [
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
  ];
  // Compute idat — uncompressed zlib block of [0, R, G, B] (filter byte + pixel)
  const raw = new Uint8Array([0x00, r, g, b]);
  const adler = adler32(raw);
  const zlib = new Uint8Array([
    0x78, 0x01,
    0x01, 0x04, 0x00, 0xfb, 0xff,
    raw[0], raw[1], raw[2], raw[3],
    (adler >>> 24) & 0xff, (adler >>> 16) & 0xff, (adler >>> 8) & 0xff, adler & 0xff,
  ]);
  const idatLen = zlib.length;
  const idatChunk = new Uint8Array(8 + idatLen + 4);
  idatChunk[0] = (idatLen >>> 24) & 0xff;
  idatChunk[1] = (idatLen >>> 16) & 0xff;
  idatChunk[2] = (idatLen >>> 8) & 0xff;
  idatChunk[3] = idatLen & 0xff;
  idatChunk[4] = 0x49; idatChunk[5] = 0x44; idatChunk[6] = 0x41; idatChunk[7] = 0x54;
  idatChunk.set(zlib, 8);
  const crcInput = new Uint8Array(4 + zlib.length);
  crcInput[0] = 0x49; crcInput[1] = 0x44; crcInput[2] = 0x41; crcInput[3] = 0x54;
  crcInput.set(zlib, 4);
  const crc = crc32(crcInput);
  idatChunk[8 + idatLen] = (crc >>> 24) & 0xff;
  idatChunk[8 + idatLen + 1] = (crc >>> 16) & 0xff;
  idatChunk[8 + idatLen + 2] = (crc >>> 8) & 0xff;
  idatChunk[8 + idatLen + 3] = crc & 0xff;
  const iend = [
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82,
  ];
  const out = new Uint8Array(sig.length + ihdr.length + idatChunk.length + iend.length);
  let off = 0;
  out.set(sig, off); off += sig.length;
  out.set(ihdr, off); off += ihdr.length;
  out.set(idatChunk, off); off += idatChunk.length;
  out.set(iend, off);
  return out;
}

function adler32(data: Uint8Array): number {
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── theme.json ────────────────────────────────────────────────────────

function buildThemeJson(
  opts: GenerateWordPressThemeOptions,
  fontFaceMap: Map<string, FontFaceEntry[]>
): string {
  const { resolved, tokens } = opts;
  const onPrimary = onPrimaryColor(resolved.colorPrimary, resolved.colorTextPrimary);

  const palette = [
    { slug: "primary", name: "Primary", color: resolved.colorPrimary },
    { slug: "secondary", name: "Secondary", color: resolved.colorSecondary },
    { slug: "accent", name: "Accent", color: resolved.colorAccent },
    { slug: "background", name: "Background", color: resolved.colorBackground },
    { slug: "surface", name: "Surface", color: resolved.colorSurface },
    { slug: "foreground", name: "Text", color: resolved.colorTextPrimary },
    { slug: "text-secondary", name: "Text Secondary", color: resolved.colorTextSecondary },
    { slug: "text-muted", name: "Text Muted", color: resolved.colorTextMuted },
    { slug: "border", name: "Border", color: resolved.colorBorder },
    { slug: "success", name: "Success", color: resolved.colorSuccess },
    { slug: "warning", name: "Warning", color: resolved.colorWarning },
    { slug: "error", name: "Error", color: resolved.colorError },
  ];

  const gradients = (tokens.gradients ?? []).slice(0, 8).map((g, i) => ({
    slug: `gradient-${i + 1}`,
    name: `Gradient ${i + 1}`,
    gradient: g.value,
  }));

  const buildFontFamily = (slug: string, family: string) => {
    const faces = fontFaceMap.get(family);
    const entry: Record<string, unknown> = {
      slug,
      name: family,
      fontFamily: `"${family}", system-ui, sans-serif`,
    };
    if (faces && faces.length > 0) {
      entry.fontFace = faces.map((f) => ({
        fontFamily: family,
        fontWeight: f.weight,
        fontStyle: f.style,
        fontDisplay: "swap",
        src: [`file:./assets/fonts/${f.filename}`],
        ...(f.format && { format: f.format }),
      }));
    }
    return entry;
  };

  const monoEntry = buildFontFamily("mono", resolved.fontMono);
  (monoEntry as { fontFamily: string }).fontFamily = `"${resolved.fontMono}", ui-monospace, SFMono-Regular, Menlo, monospace`;

  const themeJson = {
    $schema: "https://schemas.wp.org/trunk/theme.json",
    version: 3,
    settings: {
      appearanceTools: true,
      useRootPaddingAwareAlignments: true,
      layout: { contentSize: "720px", wideSize: "1200px" },
      color: {
        background: true,
        custom: true,
        customDuotone: false,
        defaultPalette: false,
        defaultGradients: false,
        palette,
        ...(gradients.length > 0 && { gradients }),
      },
      typography: {
        fluid: true,
        customFontSize: true,
        lineHeight: true,
        letterSpacing: true,
        fontWeight: true,
        fontFamilies: [
          buildFontFamily("heading", resolved.fontHeading),
          buildFontFamily("body", resolved.fontBody),
          monoEntry,
        ],
        fontSizes: [
          { slug: "xs", name: "Extra Small", size: resolved.textXs },
          { slug: "sm", name: "Small", size: resolved.textSm },
          { slug: "base", name: "Base", size: resolved.textBase },
          { slug: "lg", name: "Large", size: resolved.textLg },
          { slug: "xl", name: "Extra Large", size: resolved.textXl },
          { slug: "2xl", name: "2X Large", size: resolved.text2xl },
          { slug: "3xl", name: "3X Large", size: resolved.text3xl },
          { slug: "4xl", name: "4X Large", size: resolved.text4xl },
        ],
      },
      spacing: {
        padding: true,
        margin: true,
        blockGap: true,
        units: ["px", "rem", "em", "%", "vh", "vw"],
        spacingScale: { steps: 0 },
        spacingSizes: [
          { slug: "20", name: "XS", size: resolved.spacingXs },
          { slug: "30", name: "S", size: resolved.spacingSm },
          { slug: "40", name: "M", size: resolved.spacingMd },
          { slug: "50", name: "L", size: resolved.spacingLg },
          { slug: "60", name: "XL", size: resolved.spacingXl },
          { slug: "70", name: "2XL", size: resolved.spacing2xl },
        ],
      },
      border: { color: true, radius: true, style: true, width: true },
      shadow: {
        presets: [
          { slug: "sm", name: "Small", shadow: resolved.shadowSm },
          { slug: "md", name: "Medium", shadow: resolved.shadowMd },
          { slug: "lg", name: "Large", shadow: resolved.shadowLg },
        ],
      },
      custom: {
        radius: {
          sm: resolved.radiusSm,
          md: resolved.radiusMd,
          lg: resolved.radiusLg,
          full: resolved.radiusFull,
        },
        "line-height": {
          tight: resolved.lineHeightTight,
          normal: resolved.lineHeightNormal,
          relaxed: resolved.lineHeightRelaxed,
        },
        "font-weight": {
          heading: String(resolved.fontWeightHeading),
          body: String(resolved.fontWeightBody),
        },
        "on-primary": onPrimary,
      },
    },
    styles: {
      color: {
        background: "var(--wp--preset--color--background)",
        text: "var(--wp--preset--color--foreground)",
      },
      typography: {
        fontFamily: "var(--wp--preset--font-family--body)",
        fontSize: "var(--wp--preset--font-size--base)",
        lineHeight: "var(--wp--custom--line-height--normal)",
        fontWeight: "var(--wp--custom--font-weight--body)",
      },
      spacing: {
        padding: {
          top: "var(--wp--preset--spacing--40)",
          right: "var(--wp--preset--spacing--40)",
          bottom: "var(--wp--preset--spacing--40)",
          left: "var(--wp--preset--spacing--40)",
        },
        blockGap: "var(--wp--preset--spacing--40)",
      },
      elements: {
        h1: {
          typography: {
            fontFamily: "var(--wp--preset--font-family--heading)",
            fontSize: "var(--wp--preset--font-size--4xl)",
            fontWeight: "var(--wp--custom--font-weight--heading)",
            lineHeight: "var(--wp--custom--line-height--tight)",
          },
        },
        h2: {
          typography: {
            fontFamily: "var(--wp--preset--font-family--heading)",
            fontSize: "var(--wp--preset--font-size--3xl)",
            fontWeight: "var(--wp--custom--font-weight--heading)",
            lineHeight: "var(--wp--custom--line-height--tight)",
          },
        },
        h3: {
          typography: {
            fontFamily: "var(--wp--preset--font-family--heading)",
            fontSize: "var(--wp--preset--font-size--2xl)",
            fontWeight: "var(--wp--custom--font-weight--heading)",
            lineHeight: "var(--wp--custom--line-height--tight)",
          },
        },
        h4: {
          typography: {
            fontFamily: "var(--wp--preset--font-family--heading)",
            fontSize: "var(--wp--preset--font-size--xl)",
            fontWeight: "var(--wp--custom--font-weight--heading)",
          },
        },
        h5: {
          typography: {
            fontFamily: "var(--wp--preset--font-family--heading)",
            fontSize: "var(--wp--preset--font-size--lg)",
            fontWeight: "var(--wp--custom--font-weight--heading)",
          },
        },
        h6: {
          typography: {
            fontFamily: "var(--wp--preset--font-family--heading)",
            fontSize: "var(--wp--preset--font-size--base)",
            fontWeight: "var(--wp--custom--font-weight--heading)",
          },
        },
        link: {
          color: { text: "var(--wp--preset--color--primary)" },
          ":hover": { color: { text: "var(--wp--preset--color--accent)" } },
        },
        button: {
          color: {
            background: "var(--wp--preset--color--primary)",
            text: onPrimary,
          },
          border: { radius: "var(--wp--custom--radius--md)" },
          spacing: {
            padding: { top: "0.625rem", right: "1.25rem", bottom: "0.625rem", left: "1.25rem" },
          },
          typography: { fontWeight: "500" },
          ":hover": { color: { background: "var(--wp--preset--color--accent)" } },
        },
      },
      blocks: {
        "core/separator": {
          color: { background: "var(--wp--preset--color--border)" },
        },
        "core/quote": {
          border: {
            left: { color: "var(--wp--preset--color--primary)", width: "4px", style: "solid" },
          },
          spacing: { padding: { left: "var(--wp--preset--spacing--40)" } },
        },
        "core/code": {
          typography: { fontFamily: "var(--wp--preset--font-family--mono)" },
          color: { background: "var(--wp--preset--color--surface)" },
          border: { radius: "var(--wp--custom--radius--sm)" },
          spacing: {
            padding: {
              top: "var(--wp--preset--spacing--30)",
              right: "var(--wp--preset--spacing--40)",
              bottom: "var(--wp--preset--spacing--30)",
              left: "var(--wp--preset--spacing--40)",
            },
          },
        },
        "core/group": {
          spacing: { blockGap: "var(--wp--preset--spacing--40)" },
        },
      },
    },
  };

  return JSON.stringify(themeJson, null, 2);
}

// ── style.css ─────────────────────────────────────────────────────────

function buildStyleCss(opts: GenerateWordPressThemeOptions): string {
  const { designName, designSlug, designUrl, authorName, authorUri } = opts;
  const textDomain = textDomainFor(designSlug);
  return `/*
Theme Name:        ${designName}
Theme URI:         ${authorUri ?? "https://ditto.design"}/themes/${designSlug}
Author:            ${authorName ?? "Ditto"}
Author URI:        ${authorUri ?? "https://ditto.design"}
Description:       Block theme generated from ${designUrl ?? "a Ditto design"} by Ditto. Tokens, typography, palette, spacing and shadows extracted from the source design system.
Version:           1.0.0
Requires at least: 6.4
Tested up to:      6.6
Requires PHP:      7.4
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html
Text Domain:       ${textDomain}
Tags:              full-site-editing, block-theme, ditto, custom-colors, custom-menu, editor-style, threaded-comments
*/

/*
 * Block themes get nearly all styling from theme.json.
 * Only put here things that cannot be expressed there.
 */
::selection {
  background: var(--wp--preset--color--primary);
  color: var(--wp--custom--on-primary);
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Focus ring on interactive elements */
:where(a, button, input, select, textarea):focus-visible {
  outline: 2px solid var(--wp--preset--color--primary);
  outline-offset: 2px;
  border-radius: var(--wp--custom--radius--sm);
}
`;
}

// ── functions.php ─────────────────────────────────────────────────────

function buildFunctionsPhp(opts: GenerateWordPressThemeOptions): string {
  const { designName, designSlug } = opts;
  const textDomain = textDomainFor(designSlug);
  const fnPrefix = `ditto_${slugUnderscore(designSlug)}`;
  return `<?php
/**
 * ${designName} — Block Theme by Ditto
 *
 * @package ${textDomain}
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! function_exists( '${fnPrefix}_setup' ) ) :
    function ${fnPrefix}_setup() {
        add_theme_support( 'wp-block-styles' );
        add_theme_support( 'editor-styles' );
        add_theme_support( 'responsive-embeds' );
        add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
        add_theme_support( 'post-thumbnails' );
        add_theme_support( 'title-tag' );
        load_theme_textdomain( '${textDomain}', get_template_directory() . '/languages' );
    }
endif;
add_action( 'after_setup_theme', '${fnPrefix}_setup' );

function ${fnPrefix}_register_pattern_category() {
    if ( function_exists( 'register_block_pattern_category' ) ) {
        register_block_pattern_category(
            '${slugDashed(designSlug)}',
            array( 'label' => __( '${phpEscape(designName)}', '${textDomain}' ) )
        );
    }
}
add_action( 'init', '${fnPrefix}_register_pattern_category' );
`;
}

// ── readme.txt ────────────────────────────────────────────────────────

function buildReadmeTxt(opts: GenerateWordPressThemeOptions, hasFonts: boolean, hasLogo: boolean): string {
  const { designName, designUrl } = opts;
  const lines: string[] = [];
  lines.push(`=== ${designName} ===`);
  lines.push(`Contributors: ditto`);
  lines.push(`Tags: full-site-editing, block-theme, custom-colors, custom-menu, editor-style`);
  lines.push(`Requires at least: 6.4`);
  lines.push(`Tested up to: 6.6`);
  lines.push(`Stable tag: 1.0.0`);
  lines.push(`Requires PHP: 7.4`);
  lines.push(`License: GPLv2 or later`);
  lines.push(`License URI: https://www.gnu.org/licenses/gpl-2.0.html`);
  lines.push(``);
  lines.push(`A block theme generated by Ditto from ${designUrl ?? "a source design system"}.`);
  lines.push(``);
  lines.push(`== Description ==`);
  lines.push(``);
  lines.push(`This theme was auto-generated from a Ditto-extracted design system. It includes a complete theme.json with the original palette, typography scale, spacing tokens and shadows, plus a full set of FSE templates and a few block patterns to get you started.`);
  lines.push(``);
  lines.push(`== Installation ==`);
  lines.push(``);
  lines.push(`1. Upload the theme folder to /wp-content/themes/`);
  lines.push(`2. Activate the theme via Appearance → Themes`);
  if (hasLogo) {
    lines.push(`3. Set the bundled logo: Appearance → Editor → Styles → set Site Logo to assets/logo.svg`);
  }
  lines.push(``);
  lines.push(`== Changelog ==`);
  lines.push(``);
  lines.push(`= 1.0.0 =`);
  lines.push(`* Initial release.`);
  lines.push(``);
  lines.push(`== Credits ==`);
  lines.push(``);
  lines.push(`Generated by Ditto — https://ditto.design`);
  if (hasFonts) {
    lines.push(``);
    lines.push(`Self-hosted fonts shipped under /assets/fonts/ are extracted from the source site. Verify their licenses before redistributing.`);
  }
  return lines.join("\n") + "\n";
}

// ── Templates ─────────────────────────────────────────────────────────

const tplIndex = `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:query {"queryId":1,"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":true}} -->
  <div class="wp-block-query">
    <!-- wp:post-template -->
      <!-- wp:post-title {"isLink":true,"level":2,"fontSize":"2xl"} /-->
      <!-- wp:post-excerpt /-->
      <!-- wp:post-date {"fontSize":"sm","style":{"color":{"text":"var:preset|color|text-muted"}}} /-->
      <!-- wp:separator /-->
    <!-- /wp:post-template -->
    <!-- wp:query-pagination {"layout":{"type":"flex","justifyContent":"space-between"}} -->
      <!-- wp:query-pagination-previous /-->
      <!-- wp:query-pagination-numbers /-->
      <!-- wp:query-pagination-next /-->
    <!-- /wp:query-pagination -->
    <!-- wp:query-no-results -->
      <!-- wp:paragraph -->
      <p>No posts yet.</p>
      <!-- /wp:paragraph -->
    <!-- /wp:query-no-results -->
  </div>
  <!-- /wp:query -->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;

const tplSingle = `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:post-title {"level":1,"fontSize":"4xl"} /-->
  <!-- wp:post-featured-image {"style":{"border":{"radius":"var:custom|radius|md"}}} /-->
  <!-- wp:post-content {"layout":{"type":"constrained"}} /-->
  <!-- wp:separator /-->
  <!-- wp:post-author {"showAvatar":true,"showBio":true} /-->
  <!-- wp:comments -->
    <!-- wp:comments-title /-->
    <!-- wp:comment-template -->
      <!-- wp:columns -->
        <!-- wp:column {"width":"40px"} -->
          <!-- wp:avatar {"size":40} /-->
        <!-- /wp:column -->
        <!-- wp:column -->
          <!-- wp:comment-author-name /-->
          <!-- wp:comment-date /-->
          <!-- wp:comment-content /-->
          <!-- wp:comment-reply-link /-->
        <!-- /wp:column -->
      <!-- /wp:columns -->
    <!-- /wp:comment-template -->
    <!-- wp:comments-pagination -->
      <!-- wp:comments-pagination-previous /-->
      <!-- wp:comments-pagination-numbers /-->
      <!-- wp:comments-pagination-next /-->
    <!-- /wp:comments-pagination -->
    <!-- wp:post-comments-form /-->
  <!-- /wp:comments -->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;

const tplPage = `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:post-title {"level":1,"fontSize":"4xl"} /-->
  <!-- wp:post-featured-image {"style":{"border":{"radius":"var:custom|radius|md"}}} /-->
  <!-- wp:post-content {"layout":{"type":"constrained"}} /-->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;

const tplArchive = `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:query-title {"type":"archive","fontSize":"3xl"} /-->
  <!-- wp:term-description /-->
  <!-- wp:query {"queryId":2,"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":true}} -->
  <div class="wp-block-query">
    <!-- wp:post-template -->
      <!-- wp:post-title {"isLink":true,"level":2,"fontSize":"2xl"} /-->
      <!-- wp:post-excerpt /-->
      <!-- wp:post-date {"fontSize":"sm","style":{"color":{"text":"var:preset|color|text-muted"}}} /-->
      <!-- wp:separator /-->
    <!-- /wp:post-template -->
    <!-- wp:query-pagination -->
      <!-- wp:query-pagination-previous /-->
      <!-- wp:query-pagination-numbers /-->
      <!-- wp:query-pagination-next /-->
    <!-- /wp:query-pagination -->
  </div>
  <!-- /wp:query -->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;

const tplSearch = `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:query-title {"type":"search","fontSize":"3xl"} /-->
  <!-- wp:search {"label":"Search","buttonText":"Search","buttonPosition":"button-inside"} /-->
  <!-- wp:query {"queryId":3,"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":true}} -->
  <div class="wp-block-query">
    <!-- wp:post-template -->
      <!-- wp:post-title {"isLink":true,"level":2,"fontSize":"2xl"} /-->
      <!-- wp:post-excerpt /-->
      <!-- wp:post-date {"fontSize":"sm"} /-->
      <!-- wp:separator /-->
    <!-- /wp:post-template -->
    <!-- wp:query-no-results -->
      <!-- wp:paragraph -->
      <p>No matching results.</p>
      <!-- /wp:paragraph -->
    <!-- /wp:query-no-results -->
  </div>
  <!-- /wp:query -->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;

function tpl404(designName: string): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained","contentSize":"640px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}}} -->
<main class="wp-block-group" style="text-align:center">
  <!-- wp:heading {"level":1,"fontSize":"4xl","textAlign":"center"} -->
  <h1 class="wp-block-heading has-text-align-center has-4-xl-font-size">404 — Page not found</h1>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","fontSize":"lg","textColor":"text-secondary"} -->
  <p class="has-text-align-center has-lg-font-size has-text-secondary-color has-text-color">
    We couldn't find what you were looking for on ${htmlEscape(designName)}.
  </p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button -->
    <div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="/">Back to home</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;
}

function tplFrontPage(designSlug: string): string {
  const cat = slugDashed(designSlug);
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:pattern {"slug":"${cat}/hero-default"} /-->

<!-- wp:pattern {"slug":"${cat}/feature-grid"} /-->

<!-- wp:group {"tagName":"section","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}}} -->
<section class="wp-block-group">
  <!-- wp:heading {"level":2,"fontSize":"2xl"} -->
  <h2 class="wp-block-heading has-2-xl-font-size">Latest posts</h2>
  <!-- /wp:heading -->
  <!-- wp:query {"queryId":4,"query":{"perPage":3,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":false}} -->
  <div class="wp-block-query">
    <!-- wp:post-template {"layout":{"type":"grid","columnCount":3}} -->
      <!-- wp:post-featured-image {"isLink":true,"style":{"border":{"radius":"var:custom|radius|md"}}} /-->
      <!-- wp:post-title {"isLink":true,"level":3,"fontSize":"lg"} /-->
      <!-- wp:post-excerpt /-->
    <!-- /wp:post-template -->
    <!-- wp:query-no-results -->
      <!-- wp:paragraph -->
      <p>No posts yet — your homepage layout is ready.</p>
      <!-- /wp:paragraph -->
    <!-- /wp:query-no-results -->
  </div>
  <!-- /wp:query -->
</section>
<!-- /wp:group -->

<!-- wp:pattern {"slug":"${cat}/cta"} /-->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;
}

// ── Parts ─────────────────────────────────────────────────────────────

function partHeader(opts: GenerateWordPressThemeOptions): string {
  const navLabels = (opts.tokens.microcopy?.navLabels ?? []).filter(Boolean).slice(0, 5);
  const labels = navLabels.length > 0 ? navLabels : ["Home", "About", "Blog", "Contact"];
  const navItems = labels
    .map(
      (l) =>
        `      <!-- wp:navigation-link {"label":"${htmlEscape(l)}","url":"#"} /-->`
    )
    .join("\n");
  return `<!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between","flexWrap":"nowrap"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}},"border":{"bottom":{"color":"var:preset|color|border","width":"1px","style":"solid"}}}} -->
<div class="wp-block-group">
  <!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
  <div class="wp-block-group">
    <!-- wp:site-logo {"width":36} /-->
    <!-- wp:site-title {"level":0,"fontSize":"lg"} /-->
  </div>
  <!-- /wp:group -->

  <!-- wp:navigation {"layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"right"},"fontSize":"sm"} -->
${navItems}
  <!-- /wp:navigation -->
</div>
<!-- /wp:group -->
`;
}

function partFooter(opts: GenerateWordPressThemeOptions): string {
  const name = htmlEscape(opts.designName);
  const year = new Date().getUTCFullYear();
  return `<!-- wp:group {"tagName":"footer","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|40"}},"border":{"top":{"color":"var:preset|color|border","width":"1px","style":"solid"}}},"backgroundColor":"surface"} -->
<footer class="wp-block-group has-surface-background-color has-background">
  <!-- wp:columns {"style":{"spacing":{"blockGap":{"top":"var:preset|spacing|40","left":"var:preset|spacing|60"}}}} -->
  <div class="wp-block-columns">
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:site-title {"level":0,"fontSize":"lg"} /-->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-muted"} -->
      <p class="has-text-muted-color has-text-color has-sm-font-size">${name} — built with Ditto.</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":4,"fontSize":"sm"} -->
      <h4 class="wp-block-heading has-sm-font-size">Product</h4>
      <!-- /wp:heading -->
      <!-- wp:list {"fontSize":"sm","textColor":"text-muted"} -->
      <ul class="has-text-muted-color has-text-color has-sm-font-size">
        <li>Features</li><li>Pricing</li><li>Changelog</li>
      </ul>
      <!-- /wp:list -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":4,"fontSize":"sm"} -->
      <h4 class="wp-block-heading has-sm-font-size">Company</h4>
      <!-- /wp:heading -->
      <!-- wp:list {"fontSize":"sm","textColor":"text-muted"} -->
      <ul class="has-text-muted-color has-text-color has-sm-font-size">
        <li>About</li><li>Blog</li><li>Contact</li>
      </ul>
      <!-- /wp:list -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":4,"fontSize":"sm"} -->
      <h4 class="wp-block-heading has-sm-font-size">Legal</h4>
      <!-- /wp:heading -->
      <!-- wp:list {"fontSize":"sm","textColor":"text-muted"} -->
      <ul class="has-text-muted-color has-text-color has-sm-font-size">
        <li>Privacy</li><li>Terms</li><li>Cookies</li>
      </ul>
      <!-- /wp:list -->
    </div>
    <!-- /wp:column -->
  </div>
  <!-- /wp:columns -->

  <!-- wp:separator {"backgroundColor":"border"} -->
  <hr class="wp-block-separator has-text-color has-border-background-color has-alpha-channel-opacity" />
  <!-- /wp:separator -->

  <!-- wp:paragraph {"align":"center","fontSize":"xs","textColor":"text-muted"} -->
  <p class="has-text-align-center has-text-muted-color has-text-color has-xs-font-size">
    &copy; ${year} ${name}. All rights reserved.
  </p>
  <!-- /wp:paragraph -->
</footer>
<!-- /wp:group -->
`;
}

// ── Patterns ──────────────────────────────────────────────────────────

function patternHero(opts: GenerateWordPressThemeOptions): string {
  const { designName, designSlug, tokens } = opts;
  const textDomain = textDomainFor(designSlug);
  const cat = slugDashed(designSlug);
  const headline = phpEscape(tokens.microcopy?.heroHeadline || `Welcome to ${designName}`);
  const subhead = phpEscape(
    tokens.microcopy?.heroSubheadline || "Built with a design system extracted by Ditto."
  );
  const cta = phpEscape(tokens.microcopy?.ctaLabels?.[0] || "Get Started");
  return `<?php
/**
 * Title: Hero — Default
 * Slug: ${cat}/hero-default
 * Categories: ${cat}, featured
 * Description: Centered hero with headline, subhead, and primary CTA.
 * Keywords: hero, header, banner
 */
?>
<!-- wp:group {"tagName":"section","layout":{"type":"constrained","contentSize":"720px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}},"align":"full"} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":1,"fontSize":"4xl","textAlign":"center"} -->
  <h1 class="wp-block-heading has-text-align-center has-4-xl-font-size"><?php echo esc_html__( '${headline}', '${textDomain}' ); ?></h1>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","fontSize":"lg","textColor":"text-secondary"} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color has-lg-font-size"><?php echo esc_html__( '${subhead}', '${textDomain}' ); ?></p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button -->
    <div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#"><?php echo esc_html__( '${cta}', '${textDomain}' ); ?></a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</section>
<!-- /wp:group -->
`;
}

function patternFeatureGrid(opts: GenerateWordPressThemeOptions): string {
  const { designSlug } = opts;
  const textDomain = textDomainFor(designSlug);
  const cat = slugDashed(designSlug);
  return `<?php
/**
 * Title: Feature Grid
 * Slug: ${cat}/feature-grid
 * Categories: ${cat}
 * Description: Three-column feature grid with headings and descriptions.
 * Keywords: features, grid, columns
 */
?>
<!-- wp:group {"tagName":"section","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"backgroundColor":"surface","align":"full"} -->
<section class="wp-block-group alignfull has-surface-background-color has-background">
  <!-- wp:heading {"level":2,"fontSize":"3xl","textAlign":"center"} -->
  <h2 class="wp-block-heading has-text-align-center has-3-xl-font-size"><?php echo esc_html__( 'Everything you need', '${textDomain}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:columns {"style":{"spacing":{"margin":{"top":"var:preset|spacing|50"},"blockGap":{"top":"var:preset|spacing|40","left":"var:preset|spacing|40"}}}} -->
  <div class="wp-block-columns">
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3,"fontSize":"lg"} -->
      <h3 class="wp-block-heading has-lg-font-size"><?php echo esc_html__( 'Lightning fast', '${textDomain}' ); ?></h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary"} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size"><?php echo esc_html__( 'Built on the block editor for snappy authoring and rendering.', '${textDomain}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3,"fontSize":"lg"} -->
      <h3 class="wp-block-heading has-lg-font-size"><?php echo esc_html__( 'Fully themeable', '${textDomain}' ); ?></h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary"} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size"><?php echo esc_html__( 'All colors, fonts and spacing live in theme.json — edit once, apply everywhere.', '${textDomain}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3,"fontSize":"lg"} -->
      <h3 class="wp-block-heading has-lg-font-size"><?php echo esc_html__( 'Drop-in patterns', '${textDomain}' ); ?></h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary"} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size"><?php echo esc_html__( 'Hero, feature grid and CTA patterns ready to compose into pages.', '${textDomain}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function patternCta(opts: GenerateWordPressThemeOptions): string {
  const { designSlug, tokens } = opts;
  const textDomain = textDomainFor(designSlug);
  const cat = slugDashed(designSlug);
  const cta = phpEscape(tokens.microcopy?.ctaLabels?.[1] || tokens.microcopy?.ctaLabels?.[0] || "Get Started");
  return `<?php
/**
 * Title: Call to Action
 * Slug: ${cat}/cta
 * Categories: ${cat}, call-to-action
 * Description: Centered call-to-action with headline and button.
 * Keywords: cta, action, conversion
 */
?>
<!-- wp:group {"tagName":"section","layout":{"type":"constrained","contentSize":"560px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}},"align":"full"} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":2,"fontSize":"3xl","textAlign":"center"} -->
  <h2 class="wp-block-heading has-text-align-center has-3-xl-font-size"><?php echo esc_html__( 'Ready when you are.', '${textDomain}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","fontSize":"base","textColor":"text-secondary"} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color"><?php echo esc_html__( 'Join the team building with this design system.', '${textDomain}' ); ?></p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button -->
    <div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#"><?php echo esc_html__( '${cta}', '${textDomain}' ); ?></a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</section>
<!-- /wp:group -->
`;
}

// ── Public API ────────────────────────────────────────────────────────

export async function generateWordPressTheme(
  opts: GenerateWordPressThemeOptions
): Promise<WPThemeFile[]> {
  const files: WPThemeFile[] = [];
  const { tokens } = opts;

  // 1. Bundle fonts (parallel fetch)
  const fontFaceMap = new Map<string, FontFaceEntry[]>();
  const downloadedFonts = tokens.downloadedFonts ?? [];
  const fontFetches = await Promise.all(
    downloadedFonts.map(async (df) => {
      const bytes = await fetchFontBytes(df.localPath);
      if (!bytes) return null;
      const filename = df.localPath.split("/").pop() ?? `${slugDashed(df.family)}.woff2`;
      return { df, bytes, filename };
    })
  );
  for (const r of fontFetches) {
    if (!r) continue;
    files.push({ path: `assets/fonts/${r.filename}`, content: r.bytes });
    const entry: FontFaceEntry = {
      filename: r.filename,
      format: normalizeFontFormat(r.df.format),
      weight: parseWeightFromFilename(r.filename),
      style: parseStyleFromFilename(r.filename),
    };
    const arr = fontFaceMap.get(r.df.family) ?? [];
    arr.push(entry);
    fontFaceMap.set(r.df.family, arr);
  }

  // 2. Logo
  let hasLogo = false;
  if (tokens.logo?.inlineSvg) {
    files.push({ path: "assets/logo.svg", content: tokens.logo.inlineSvg });
    hasLogo = true;
  }

  // 3. Screenshot
  if (opts.screenshotBase64) {
    try {
      files.push({ path: "screenshot.png", content: base64ToBytes(opts.screenshotBase64) });
    } catch {
      files.push({ path: "screenshot.png", content: synthesizeFallbackScreenshot(opts.resolved.colorPrimary) });
    }
  } else {
    files.push({ path: "screenshot.png", content: synthesizeFallbackScreenshot(opts.resolved.colorPrimary) });
  }

  // 4. Core text files
  files.push({ path: "style.css", content: buildStyleCss(opts) });
  files.push({ path: "theme.json", content: buildThemeJson(opts, fontFaceMap) });
  files.push({ path: "functions.php", content: buildFunctionsPhp(opts) });
  files.push({ path: "readme.txt", content: buildReadmeTxt(opts, fontFaceMap.size > 0, hasLogo) });

  // 5. Templates
  files.push({ path: "templates/index.html", content: tplIndex });
  files.push({ path: "templates/home.html", content: tplIndex });
  files.push({ path: "templates/front-page.html", content: tplFrontPage(opts.designSlug) });
  files.push({ path: "templates/single.html", content: tplSingle });
  files.push({ path: "templates/page.html", content: tplPage });
  files.push({ path: "templates/archive.html", content: tplArchive });
  files.push({ path: "templates/search.html", content: tplSearch });
  files.push({ path: "templates/404.html", content: tpl404(opts.designName) });

  // 6. Parts
  files.push({ path: "parts/header.html", content: partHeader(opts) });
  files.push({ path: "parts/footer.html", content: partFooter(opts) });

  // 7. Patterns
  files.push({ path: "patterns/hero-default.php", content: patternHero(opts) });
  files.push({ path: "patterns/feature-grid.php", content: patternFeatureGrid(opts) });
  files.push({ path: "patterns/cta.php", content: patternCta(opts) });

  return files;
}

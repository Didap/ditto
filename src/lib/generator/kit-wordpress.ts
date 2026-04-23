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

import type { ResolvedDesign, DesignTokens, SectionVariant } from "../types";
import {
  slugDashed,
  slugUnderscore,
  phpEscape,
  htmlEscape,
  onPrimaryColor,
  normalizeFontFormat,
  parseWeightFromFilename,
  parseStyleFromFilename,
  fetchFontBytes,
  type SharedFontFaceEntry,
} from "./wp-shared";
import { buildAllPatternFiles } from "./kit-wordpress-patterns";

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

type FontFaceEntry = SharedFontFaceEntry;

// ── Helpers (theme-specific) ───────────────────────────────────────────

/** Build the Ditto placeholder mark — two semicircles using the brand colors. */
function buildDittoPlaceholderSvg(primary: string, secondary: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="128" height="128">
  <title>Ditto placeholder mark</title>
  <path d="M16 0 A16 16 0 0 1 16 32 Z" fill="${primary}"/>
  <path d="M16 0 A16 16 0 0 0 16 32 Z" fill="${secondary}"/>
</svg>
`;
}


/** Truncate a slug to fit WordPress text-domain conventions. */
function textDomainFor(slug: string): string {
  const candidate = `${slug}-block-theme`;
  if (candidate.length <= 30) return candidate;
  return `${slug.slice(0, 22)}-block-theme`;
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

if ( ! function_exists( '${fnPrefix}_register_nav_menus' ) ) :
    function ${fnPrefix}_register_nav_menus() {
        register_nav_menus( array(
            'primary' => __( 'Primary', '${textDomain}' ),
            'footer'  => __( 'Footer', '${textDomain}' ),
        ) );
    }
endif;
add_action( 'after_setup_theme', '${fnPrefix}_register_nav_menus' );

// Demo Importer — admin notice + one-click setup of the 5 starter pages.
require get_template_directory() . '/includes/class-ditto-wp-demo-importer.php';
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
  if (opts.resolved.logoUrl) {
    lines.push(``);
    lines.push(`== Brand ==`);
    lines.push(``);
    lines.push(`Brand name: ${opts.resolved.brandName || designName}`);
    lines.push(`Header style: ${opts.resolved.headerVariant || "classic"} (applied to parts/header.html)`);
    lines.push(`Custom logo: ${opts.resolved.logoUrl}`);
    lines.push(`Download the logo and upload it via Appearance → Editor → Styles → Site Logo.`);
  } else {
    lines.push(``);
    lines.push(`== Brand ==`);
    lines.push(``);
    lines.push(`Header style: ${opts.resolved.headerVariant || "classic"} (applied to parts/header.html)`);
    lines.push(`No custom logo was uploaded — WordPress will render the Ditto placeholder mark (two semicircles) until a Site Logo is set in the editor.`);
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

/**
 * Compose the homepage from the 5 chosen section variants (header comes from
 * the `header` template-part; the footer pattern is referenced at the bottom
 * so the whole landing matches exactly what the user sees in the preview).
 */
function tplFrontPage(opts: GenerateWordPressThemeOptions): string {
  const cat = slugDashed(opts.designSlug);
  const r = opts.resolved;
  const hero: SectionVariant = r.heroVariant || "classic";
  const stats: SectionVariant = r.statsVariant || "classic";
  const features: SectionVariant = r.featuresVariant || "classic";
  const reviews: SectionVariant = r.reviewsVariant || "classic";
  const cta: SectionVariant = r.ctaVariant || "classic";
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:pattern {"slug":"${cat}/hero-${hero}"} /-->

<!-- wp:pattern {"slug":"${cat}/stats-${stats}"} /-->

<!-- wp:pattern {"slug":"${cat}/features-${features}"} /-->

<!-- wp:pattern {"slug":"${cat}/reviews-${reviews}"} /-->

<!-- wp:pattern {"slug":"${cat}/cta-${cta}"} /-->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;
}

/** About page — reuses hero + features + cta variants. */
function tplPageAbout(opts: GenerateWordPressThemeOptions): string {
  const cat = slugDashed(opts.designSlug);
  const r = opts.resolved;
  const hero: SectionVariant = r.heroVariant || "classic";
  const features: SectionVariant = r.featuresVariant || "classic";
  const cta: SectionVariant = r.ctaVariant || "classic";
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:pattern {"slug":"${cat}/hero-${hero}"} /-->

<!-- wp:pattern {"slug":"${cat}/features-${features}"} /-->

<!-- wp:pattern {"slug":"${cat}/cta-${cta}"} /-->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;
}

/** Services page — features + reviews + cta. */
function tplPageServices(opts: GenerateWordPressThemeOptions): string {
  const cat = slugDashed(opts.designSlug);
  const r = opts.resolved;
  const features: SectionVariant = r.featuresVariant || "classic";
  const reviews: SectionVariant = r.reviewsVariant || "classic";
  const cta: SectionVariant = r.ctaVariant || "classic";
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":1,"textAlign":"center","fontSize":"4xl"} -->
  <h1 class="wp-block-heading has-text-align-center has-4-xl-font-size">What we do</h1>
  <!-- /wp:heading -->
</section>
<!-- /wp:group -->

<!-- wp:pattern {"slug":"${cat}/features-${features}"} /-->

<!-- wp:pattern {"slug":"${cat}/reviews-${reviews}"} /-->

<!-- wp:pattern {"slug":"${cat}/cta-${cta}"} /-->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;
}

/** Contact page — simple centered block with email + form placeholder. */
function tplPageContact(_opts: GenerateWordPressThemeOptions): string {
  void _opts;
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained","contentSize":"640px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":1,"textAlign":"center","fontSize":"4xl"} -->
  <h1 class="wp-block-heading has-text-align-center has-4-xl-font-size">Get in touch</h1>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","fontSize":"lg","textColor":"text-secondary","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|50"}}}} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color has-lg-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:var(--wp--preset--spacing--50)">Questions, feedback, partnerships — we'd love to hear from you.</p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"backgroundColor":"primary","textColor":"background","style":{"border":{"radius":"var:custom|radius|md"}}} -->
    <div class="wp-block-button"><a class="wp-block-button__link has-background-color has-primary-background-color has-text-color has-background wp-element-button" href="mailto:hello@example.com" style="border-radius:var(--wp--custom--radius--md)">Email us</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</section>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;
}

/** Blog page — query loop with posts + cta. */
function tplPageBlog(opts: GenerateWordPressThemeOptions): string {
  const cat = slugDashed(opts.designSlug);
  const cta: SectionVariant = opts.resolved.ctaVariant || "classic";
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":1,"textAlign":"center","fontSize":"4xl"} -->
  <h1 class="wp-block-heading has-text-align-center has-4-xl-font-size">Journal</h1>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","fontSize":"lg","textColor":"text-secondary","style":{"spacing":{"margin":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|50"}}}} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color has-lg-font-size" style="margin-top:var(--wp--preset--spacing--20);margin-bottom:var(--wp--preset--spacing--50)">Thoughts, notes, updates.</p>
  <!-- /wp:paragraph -->
  <!-- wp:query {"queryId":5,"query":{"perPage":6,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","inherit":false}} -->
  <div class="wp-block-query">
    <!-- wp:post-template {"layout":{"type":"grid","columnCount":3}} -->
      <!-- wp:post-featured-image {"isLink":true,"style":{"border":{"radius":"var:custom|radius|md"}}} /-->
      <!-- wp:post-title {"isLink":true,"level":3,"fontSize":"lg"} /-->
      <!-- wp:post-excerpt /-->
    <!-- /wp:post-template -->
    <!-- wp:query-no-results -->
      <!-- wp:paragraph -->
      <p>No posts yet — when you publish articles they'll appear here.</p>
      <!-- /wp:paragraph -->
    <!-- /wp:query-no-results -->
  </div>
  <!-- /wp:query -->
</section>
<!-- /wp:group -->

<!-- wp:pattern {"slug":"${cat}/cta-${cta}"} /-->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
`;
}

// ── Parts ─────────────────────────────────────────────────────────────

function partHeader(opts: GenerateWordPressThemeOptions): string {
  const navLabels = (opts.tokens.microcopy?.navLabels ?? []).filter(Boolean).slice(0, 5);
  const labels = navLabels.length > 0 ? navLabels : ["Home", "About", "Blog", "Contact"];
  const variant = opts.resolved.headerVariant || "classic";
  const navItems = labels
    .map(
      (l) =>
        `      <!-- wp:navigation-link {"label":"${htmlEscape(l)}","url":"#"} /-->`
    )
    .join("\n");

  if (variant === "elegante") {
    return `<!-- wp:group {"layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|0"}}}} -->
<div class="wp-block-group">
  <!-- wp:group {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-group">
    <!-- wp:site-logo {"width":48} /-->
    <!-- wp:site-title {"level":0,"fontSize":"xl","style":{"typography":{"fontWeight":"500","letterSpacing":"-0.01em"}}} /-->
  </div>
  <!-- /wp:group -->
  <!-- wp:separator {"className":"is-style-wide"} -->
  <hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>
  <!-- /wp:separator -->
  <!-- wp:navigation {"layout":{"type":"flex","justifyContent":"center"},"fontSize":"sm","style":{"typography":{"letterSpacing":"0.22em","textTransform":"uppercase"}}} -->
${navItems}
  <!-- /wp:navigation -->
  <!-- wp:separator {"className":"is-style-wide"} -->
  <hr class="wp-block-separator has-alpha-channel-opacity is-style-wide"/>
  <!-- /wp:separator -->
</div>
<!-- /wp:group -->
`;
  }

  if (variant === "artistico") {
    return `<!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between","flexWrap":"nowrap"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<div class="wp-block-group">
  <!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
  <div class="wp-block-group">
    <!-- wp:site-logo {"width":40} /-->
    <!-- wp:site-title {"level":0,"fontSize":"lg","style":{"typography":{"fontWeight":"800"}}} /-->
  </div>
  <!-- /wp:group -->

  <!-- wp:navigation {"layout":{"type":"flex","justifyContent":"center"},"fontSize":"sm","className":"ditto-artistico-nav","style":{"border":{"radius":"var(--wp--preset--spacing--60)","width":"1px","color":"var(--wp--preset--color--border)"},"spacing":{"padding":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|20","left":"var:preset|spacing|30","right":"var:preset|spacing|30"}}}} -->
${navItems}
  <!-- /wp:navigation -->

  <!-- wp:buttons -->
  <div class="wp-block-buttons">
    <!-- wp:button {"textColor":"text-primary","style":{"border":{"width":"2px","color":"var(--wp--preset--color--text-primary)","radius":"999px"},"color":{"background":"transparent"}}} -->
    <div class="wp-block-button"><a class="wp-block-button__link has-text-primary-color has-text-color has-border-color wp-element-button" style="border-color:var(--wp--preset--color--text-primary);border-width:2px;border-radius:999px;background:transparent">Get Started ✦</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</div>
<!-- /wp:group -->
`;
  }

  if (variant === "fresco") {
    return `<!-- wp:group {"layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|30","left":"var:preset|spacing|30","right":"var:preset|spacing|30"}}}} -->
<div class="wp-block-group">
  <!-- wp:group {"layout":{"type":"flex","justifyContent":"space-between","flexWrap":"nowrap"},"style":{"border":{"radius":"999px","width":"1px","color":"var(--wp--preset--color--border)"},"spacing":{"padding":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|20","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"backgroundColor":"surface"} -->
  <div class="wp-block-group has-surface-background-color has-background" style="border-color:var(--wp--preset--color--border);border-width:1px;border-radius:999px">
    <!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
    <div class="wp-block-group">
      <!-- wp:site-logo {"width":28} /-->
      <!-- wp:site-title {"level":0,"fontSize":"md","style":{"typography":{"fontWeight":"700"}}} /-->
    </div>
    <!-- /wp:group -->

    <!-- wp:navigation {"layout":{"type":"flex","justifyContent":"center"},"fontSize":"sm"} -->
${navItems}
    <!-- /wp:navigation -->

    <!-- wp:buttons -->
    <div class="wp-block-buttons">
      <!-- wp:button {"style":{"border":{"radius":"999px"},"color":{"gradient":"linear-gradient(135deg, var(--wp--preset--color--primary) 0%, var(--wp--preset--color--secondary) 100%)"}}} -->
      <div class="wp-block-button"><a class="wp-block-button__link has-background wp-element-button" style="border-radius:999px;background:linear-gradient(135deg, var(--wp--preset--color--primary) 0%, var(--wp--preset--color--secondary) 100%)">Start free</a></div>
      <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->
  </div>
  <!-- /wp:group -->
</div>
<!-- /wp:group -->
`;
  }

  // Classic (default)
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

/**
 * Footer template-part — delegates to the chosen footer variant pattern so
 * every page of the site shares the same footer the user previewed.
 */
function partFooter(opts: GenerateWordPressThemeOptions): string {
  const cat = slugDashed(opts.designSlug);
  const variant: SectionVariant = opts.resolved.footerVariant || "classic";
  return `<!-- wp:pattern {"slug":"${cat}/footer-${variant}"} /-->
`;
}

// ── Demo Importer ─────────────────────────────────────────────────────

/**
 * Ships a PHP class that, on first activation, shows an admin notice asking
 * the user if they want to create the 5 starter pages (Home/About/Services/
 * Contact/Blog), set Home as the static front page, wire a Primary menu and
 * register the bundled logo as Site Logo.
 *
 * Without this, a brand new WP install shows a blank homepage even though
 * the theme has a rich `front-page.html` — because by default "Your latest
 * posts" is used until the user creates a Page and sets it as the front.
 */
function buildDemoImporterPhp(opts: GenerateWordPressThemeOptions): string {
  const textDomain = textDomainFor(opts.designSlug);
  const designNameEsc = phpEscape(opts.designName);
  return `<?php
/**
 * Demo Importer — one-click setup for ${opts.designName}.
 *
 * Adds an admin notice on first activation. One click creates the 5 starter
 * pages, sets Home as front page, wires a Primary menu and attaches the
 * bundled logo as Site Logo.
 *
 * @package ${phpClassName(opts.designSlug)}
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

class Ditto_Wp_Demo_Importer {
\tconst OPTION_DONE = 'ditto_wp_demo_imported';
\tconst NONCE = 'ditto_wp_import_demo';

\tprivate static $pages = [
\t\t[ 'slug' => 'home',     'title' => 'Home' ],
\t\t[ 'slug' => 'about',    'title' => 'About' ],
\t\t[ 'slug' => 'services', 'title' => 'Services' ],
\t\t[ 'slug' => 'blog',     'title' => 'Blog' ],
\t\t[ 'slug' => 'contact',  'title' => 'Contact' ],
\t];

\tpublic static function init() {
\t\tadd_action( 'admin_notices', [ __CLASS__, 'maybe_notice' ] );
\t\tadd_action( 'admin_menu', [ __CLASS__, 'add_menu' ] );
\t\tadd_action( 'admin_post_ditto_wp_import_demo', [ __CLASS__, 'handle_import' ] );
\t}

\tpublic static function maybe_notice() {
\t\tif ( get_option( self::OPTION_DONE ) ) return;
\t\tif ( ! current_user_can( 'manage_options' ) ) return;
\t\t$url = admin_url( 'themes.php?page=ditto-wp-setup' );
\t\techo '<div class="notice notice-info"><p><strong>${designNameEsc}</strong> — ' . esc_html__( 'Welcome! Click below to import the demo content: 5 pages, a Primary menu and the homepage already wired.', '${textDomain}' ) . ' <a href="' . esc_url( $url ) . '" class="button button-primary" style="margin-left:12px">' . esc_html__( 'Import demo', '${textDomain}' ) . '</a></p></div>';
\t}

\tpublic static function add_menu() {
\t\tadd_theme_page(
\t\t\t'${designNameEsc} Setup',
\t\t\t'${designNameEsc} Setup',
\t\t\t'manage_options',
\t\t\t'ditto-wp-setup',
\t\t\t[ __CLASS__, 'render_page' ]
\t\t);
\t}

\tpublic static function render_page() {
\t\t$done = (bool) get_option( self::OPTION_DONE );
\t\t$action = admin_url( 'admin-post.php' );
\t\t?>
\t\t<div class="wrap">
\t\t\t<h1><?php echo esc_html( '${designNameEsc} — Demo Importer' ); ?></h1>
\t\t\t<?php if ( $done ) : ?>
\t\t\t\t<div class="notice notice-success"><p><?php esc_html_e( 'Demo already imported. Re-running will update existing pages with matching slugs.', '${textDomain}' ); ?></p></div>
\t\t\t<?php endif; ?>
\t\t\t<p><?php esc_html_e( 'This creates 5 pages (Home / About / Services / Blog / Contact), assigns each to the matching Ditto page template, sets Home as the static front page and builds a Primary menu.', '${textDomain}' ); ?></p>
\t\t\t<form method="post" action="<?php echo esc_url( $action ); ?>">
\t\t\t\t<input type="hidden" name="action" value="ditto_wp_import_demo" />
\t\t\t\t<?php wp_nonce_field( self::NONCE ); ?>
\t\t\t\t<?php submit_button( $done ? __( 'Re-import demo', '${textDomain}' ) : __( 'Import demo', '${textDomain}' ), 'primary large' ); ?>
\t\t\t</form>
\t\t</div>
\t\t<?php
\t}

\tpublic static function handle_import() {
\t\tif ( ! current_user_can( 'manage_options' ) ) wp_die( 'no perms' );
\t\tcheck_admin_referer( self::NONCE );

\t\t$ids = [];
\t\tforeach ( self::$pages as $p ) {
\t\t\t$existing = get_page_by_path( $p['slug'] );
\t\t\tif ( $existing ) {
\t\t\t\t$id = $existing->ID;
\t\t\t} else {
\t\t\t\t$id = wp_insert_post( [
\t\t\t\t\t'post_title'  => $p['title'],
\t\t\t\t\t'post_name'   => $p['slug'],
\t\t\t\t\t'post_status' => 'publish',
\t\t\t\t\t'post_type'   => 'page',
\t\t\t\t] );
\t\t\t}
\t\t\tif ( ! is_wp_error( $id ) && $id ) {
\t\t\t\t$ids[ $p['slug'] ] = $id;
\t\t\t\t// Assign the Ditto page template (file name matches page slug).
\t\t\t\tif ( $p['slug'] !== 'home' ) {
\t\t\t\t\tupdate_post_meta( $id, '_wp_page_template', 'page-' . $p['slug'] . '.html' );
\t\t\t\t}
\t\t\t}
\t\t}

\t\tself::build_menu( $ids );

\t\tif ( ! empty( $ids['home'] ) ) {
\t\t\tupdate_option( 'show_on_front', 'page' );
\t\t\tupdate_option( 'page_on_front', (int) $ids['home'] );
\t\t\tif ( ! empty( $ids['blog'] ) ) {
\t\t\t\tupdate_option( 'page_for_posts', (int) $ids['blog'] );
\t\t\t}
\t\t}

\t\tself::set_site_logo();

\t\tupdate_option( self::OPTION_DONE, 1 );
\t\twp_safe_redirect( admin_url( 'themes.php?page=ditto-wp-setup&imported=1' ) );
\t\texit;
\t}

\tprivate static function build_menu( $ids ) {
\t\t$menu_name = 'Primary';
\t\t$menu = wp_get_nav_menu_object( $menu_name );
\t\t$menu_id = $menu ? $menu->term_id : wp_create_nav_menu( $menu_name );
\t\tif ( is_wp_error( $menu_id ) ) return;

\t\t$items = wp_get_nav_menu_items( $menu_id );
\t\tif ( is_array( $items ) ) {
\t\t\tforeach ( $items as $item ) wp_delete_post( $item->ID, true );
\t\t}
\t\t$order = [ 'home', 'about', 'services', 'blog', 'contact' ];
\t\tforeach ( $order as $slug ) {
\t\t\t$id = isset( $ids[ $slug ] ) ? (int) $ids[ $slug ] : 0;
\t\t\tif ( ! $id ) continue;
\t\t\t$page = get_post( $id );
\t\t\tif ( ! $page ) continue;
\t\t\twp_update_nav_menu_item( $menu_id, 0, [
\t\t\t\t'menu-item-title'     => $page->post_title,
\t\t\t\t'menu-item-object'    => 'page',
\t\t\t\t'menu-item-object-id' => $id,
\t\t\t\t'menu-item-type'      => 'post_type',
\t\t\t\t'menu-item-status'    => 'publish',
\t\t\t] );
\t\t}
\t\t$locations = get_theme_mod( 'nav_menu_locations' );
\t\tif ( ! is_array( $locations ) ) $locations = [];
\t\t$locations['primary'] = $menu_id;
\t\tset_theme_mod( 'nav_menu_locations', $locations );
\t}

\t/**
\t * Import the bundled logo (assets/logo.svg) into the media library and
\t * set it as the Site Logo so every <!-- wp:site-logo /--> block renders
\t * the brand mark out of the box.
\t */
\tprivate static function set_site_logo() {
\t\t$logo_path = get_template_directory() . '/assets/logo.svg';
\t\tif ( ! file_exists( $logo_path ) ) return;
\t\tif ( get_theme_mod( 'custom_logo' ) ) return; // already set

\t\t$uploads = wp_upload_dir();
\t\tif ( ! empty( $uploads['error'] ) ) return;
\t\t$target = trailingslashit( $uploads['path'] ) . 'ditto-site-logo.svg';
\t\tif ( ! copy( $logo_path, $target ) ) return;

\t\t$attachment = [
\t\t\t'post_mime_type' => 'image/svg+xml',
\t\t\t'post_title'     => 'Site Logo',
\t\t\t'post_content'   => '',
\t\t\t'post_status'    => 'inherit',
\t\t];
\t\t$attach_id = wp_insert_attachment( $attachment, $target );
\t\tif ( ! is_wp_error( $attach_id ) && $attach_id ) {
\t\t\trequire_once ABSPATH . 'wp-admin/includes/image.php';
\t\t\t$attach_data = wp_generate_attachment_metadata( $attach_id, $target );
\t\t\twp_update_attachment_metadata( $attach_id, $attach_data );
\t\t\tset_theme_mod( 'custom_logo', $attach_id );
\t\t}
\t}
}

add_action( 'admin_init', [ 'Ditto_Wp_Demo_Importer', 'init' ] );
`;
}

function phpClassName(slug: string): string {
  const parts = slug.split(/[-_]/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return `Ditto_${parts.join("_") || "Theme"}`;
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

  // 2. Logo — prefer extracted inline SVG, else synthesize the Ditto placeholder
  // so the theme always has an assets/logo.svg to plug into the Site Logo block.
  let hasLogo = false;
  if (tokens.logo?.inlineSvg) {
    files.push({ path: "assets/logo.svg", content: tokens.logo.inlineSvg });
    hasLogo = true;
  } else {
    files.push({
      path: "assets/logo.svg",
      content: buildDittoPlaceholderSvg(opts.resolved.colorPrimary, opts.resolved.colorSecondary),
    });
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

  // 5. Templates — FSE block templates
  files.push({ path: "templates/index.html", content: tplIndex });
  files.push({ path: "templates/home.html", content: tplIndex });
  files.push({ path: "templates/front-page.html", content: tplFrontPage(opts) });
  files.push({ path: "templates/single.html", content: tplSingle });
  files.push({ path: "templates/page.html", content: tplPage });
  files.push({ path: "templates/archive.html", content: tplArchive });
  files.push({ path: "templates/search.html", content: tplSearch });
  files.push({ path: "templates/404.html", content: tpl404(opts.designName) });

  // 5b. Custom page templates — one per starter page
  // (WP lists these in Page Attributes → Template and the Demo Importer
  // assigns them to the matching post.)
  files.push({ path: "templates/page-about.html", content: tplPageAbout(opts) });
  files.push({ path: "templates/page-services.html", content: tplPageServices(opts) });
  files.push({ path: "templates/page-contact.html", content: tplPageContact(opts) });
  files.push({ path: "templates/page-blog.html", content: tplPageBlog(opts) });

  // 6. Parts
  files.push({ path: "parts/header.html", content: partHeader(opts) });
  files.push({ path: "parts/footer.html", content: partFooter(opts) });

  // 7. All 24 section patterns (6 sections × 4 variants)
  const ctx = {
    designName: opts.designName,
    designSlug: opts.designSlug,
    resolved: opts.resolved,
    tokens: opts.tokens,
  };
  for (const p of buildAllPatternFiles(ctx)) {
    files.push(p);
  }

  // 7b. Legacy patterns kept so existing template parts keep rendering if the
  // user had manually referenced them. Low cost (3 files) and safe.
  files.push({ path: "patterns/hero-default.php", content: patternHero(opts) });
  files.push({ path: "patterns/feature-grid.php", content: patternFeatureGrid(opts) });
  files.push({ path: "patterns/cta.php", content: patternCta(opts) });

  // 8. Demo Importer — creates 5 pages + menu + front-page on first activation
  files.push({
    path: "includes/class-ditto-wp-demo-importer.php",
    content: buildDemoImporterPhp(opts),
  });

  return files;
}

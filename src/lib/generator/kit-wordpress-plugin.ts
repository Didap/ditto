/**
 * WordPress plugin generator (Hybrid).
 *
 * Produces a standalone WP plugin that works with *any* theme:
 *   • injects design tokens as `--d-*` CSS variables globally
 *   • registers 4 Gutenberg blocks (Hero, Feature Grid, CTA, Pricing Card)
 *   • exposes an admin page to override colors
 *   • bundles self-hosted fonts (same pipeline as the block theme)
 *
 * Output mirrors `kit-wordpress.ts` — array of `{ path, content }` for JSZip.
 */

import type { ResolvedDesign, DesignTokens } from "../types";
import {
  slugDashed,
  slugUnderscore,
  phpEscape,
  onPrimaryColor,
  normalizeFontFormat,
  parseWeightFromFilename,
  parseStyleFromFilename,
  fetchFontBytes,
  type SharedFontFaceEntry,
} from "./wp-shared";

export interface WPPluginFile {
  path: string;
  content: string | Uint8Array;
}

export interface GenerateWordPressPluginOptions {
  designName: string;
  designSlug: string;
  designUrl?: string;
  resolved: ResolvedDesign;
  tokens: DesignTokens;
  authorName?: string;
  authorUri?: string;
}

/** Truncate slug so that `${slug}-ditto` fits in 30 chars. */
function textDomainFor(slug: string): string {
  const candidate = `${slug}-ditto`;
  if (candidate.length <= 30) return candidate;
  return `${slug.slice(0, 24)}-ditto`;
}

/** Shorter slug used as the PHP function prefix. */
function fnPrefixFor(slug: string): string {
  return `ditto_${slugUnderscore(slug)}`;
}

// ── tokens.css (front + editor) ────────────────────────────────────────

function buildTokensCss(resolved: ResolvedDesign, fontFaces: string[]): string {
  return `${fontFaces.join("\n")}

:root {
  /* Colors */
  --d-primary: ${resolved.colorPrimary};
  --d-secondary: ${resolved.colorSecondary};
  --d-accent: ${resolved.colorAccent};
  --d-background: ${resolved.colorBackground};
  --d-surface: ${resolved.colorSurface};
  --d-text: ${resolved.colorTextPrimary};
  --d-text-secondary: ${resolved.colorTextSecondary};
  --d-text-muted: ${resolved.colorTextMuted};
  --d-border: ${resolved.colorBorder};
  --d-success: ${resolved.colorSuccess};
  --d-warning: ${resolved.colorWarning};
  --d-error: ${resolved.colorError};
  --d-on-primary: ${onPrimaryColor(resolved.colorPrimary, resolved.colorTextPrimary)};

  /* Typography */
  --d-font-heading: "${resolved.fontHeading}", system-ui, sans-serif;
  --d-font-body: "${resolved.fontBody}", system-ui, sans-serif;
  --d-font-mono: "${resolved.fontMono}", ui-monospace, SFMono-Regular, Menlo, monospace;
  --d-font-weight-heading: ${resolved.fontWeightHeading};
  --d-font-weight-body: ${resolved.fontWeightBody};

  /* Type scale */
  --d-text-xs: ${resolved.textXs};
  --d-text-sm: ${resolved.textSm};
  --d-text-base: ${resolved.textBase};
  --d-text-lg: ${resolved.textLg};
  --d-text-xl: ${resolved.textXl};
  --d-text-2xl: ${resolved.text2xl};
  --d-text-3xl: ${resolved.text3xl};
  --d-text-4xl: ${resolved.text4xl};

  /* Line heights */
  --d-leading-tight: ${resolved.lineHeightTight};
  --d-leading-normal: ${resolved.lineHeightNormal};
  --d-leading-relaxed: ${resolved.lineHeightRelaxed};

  /* Radii */
  --d-radius-sm: ${resolved.radiusSm};
  --d-radius-md: ${resolved.radiusMd};
  --d-radius-lg: ${resolved.radiusLg};
  --d-radius-full: ${resolved.radiusFull};

  /* Shadows */
  --d-shadow-sm: ${resolved.shadowSm};
  --d-shadow-md: ${resolved.shadowMd};
  --d-shadow-lg: ${resolved.shadowLg};

  /* Spacing */
  --d-space-xs: ${resolved.spacingXs};
  --d-space-sm: ${resolved.spacingSm};
  --d-space-md: ${resolved.spacingMd};
  --d-space-lg: ${resolved.spacingLg};
  --d-space-xl: ${resolved.spacingXl};
  --d-space-2xl: ${resolved.spacing2xl};

  /* Brand */
  --d-brand-name: ${JSON.stringify(resolved.brandName || "Brand")};
  --d-header-variant: ${JSON.stringify(resolved.headerVariant || "classic")};${
    resolved.logoUrl
      ? `
  --d-logo-url: url("${resolved.logoUrl}");`
      : ""
  }
}
`;
}

function buildFontFaceRule(
  family: string,
  entries: SharedFontFaceEntry[]
): string[] {
  return entries.map((e) => {
    const fmt = e.format;
    return `@font-face {
  font-family: "${family}";
  font-style: ${e.style};
  font-weight: ${e.weight};
  font-display: swap;
  src: url("./fonts/${e.filename}") format("${fmt}");
}`;
  });
}

// ── Main plugin file ───────────────────────────────────────────────────

function buildMainPhp(opts: GenerateWordPressPluginOptions): string {
  const { designName, designSlug, designUrl, authorName, authorUri } = opts;
  const textDomain = textDomainFor(designSlug);
  const fnPrefix = fnPrefixFor(designSlug);
  return `<?php
/**
 * Plugin Name:       ${designName} — Ditto
 * Plugin URI:        ${authorUri ?? "https://ditto.design"}/plugins/${designSlug}
 * Description:       Ditto-generated design system for ${designUrl ?? "your site"}. Injects global CSS tokens and ships 4 Gutenberg blocks (Hero, Feature Grid, CTA, Pricing Card). Works with any theme.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            ${authorName ?? "Ditto"}
 * Author URI:        ${authorUri ?? "https://ditto.design"}
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ${textDomain}
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( '${fnPrefix.toUpperCase()}_VERSION', '1.0.0' );
define( '${fnPrefix.toUpperCase()}_PATH', plugin_dir_path( __FILE__ ) );
define( '${fnPrefix.toUpperCase()}_URL', plugin_dir_url( __FILE__ ) );
define( '${fnPrefix.toUpperCase()}_TEXTDOMAIN', '${textDomain}' );
define( '${fnPrefix.toUpperCase()}_SLUG', '${slugDashed(designSlug)}' );

require_once ${fnPrefix.toUpperCase()}_PATH . 'inc/helpers.php';
require_once ${fnPrefix.toUpperCase()}_PATH . 'inc/enqueue.php';
require_once ${fnPrefix.toUpperCase()}_PATH . 'inc/admin-page.php';
require_once ${fnPrefix.toUpperCase()}_PATH . 'inc/customizer.php';
require_once ${fnPrefix.toUpperCase()}_PATH . 'inc/register-blocks.php';

register_activation_hook( __FILE__, function () {
    // Seed default overrides with the design-extracted values.
    if ( false === get_option( 'ditto_tokens_overrides' ) ) {
        add_option( 'ditto_tokens_overrides', array() );
    }
} );
`;
}

// ── uninstall.php ──────────────────────────────────────────────────────

function buildUninstallPhp(): string {
  return `<?php
// Fired when the user uninstalls the plugin via the WP admin.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}
delete_option( 'ditto_tokens_overrides' );
`;
}

// ── inc/helpers.php ────────────────────────────────────────────────────

function buildHelpersPhp(opts: GenerateWordPressPluginOptions): string {
  const { resolved } = opts;
  const colorMap: Record<string, string> = {
    primary: resolved.colorPrimary,
    secondary: resolved.colorSecondary,
    accent: resolved.colorAccent,
    background: resolved.colorBackground,
    surface: resolved.colorSurface,
    text: resolved.colorTextPrimary,
    "text-secondary": resolved.colorTextSecondary,
    "text-muted": resolved.colorTextMuted,
    border: resolved.colorBorder,
    success: resolved.colorSuccess,
    warning: resolved.colorWarning,
    error: resolved.colorError,
  };
  const colorEntries = Object.entries(colorMap)
    .map(([k, v]) => `        '${k}' => '${phpEscape(v)}',`)
    .join("\n");
  const fontMap: Record<string, string> = {
    heading: resolved.fontHeading,
    body: resolved.fontBody,
    mono: resolved.fontMono,
  };
  const fontEntries = Object.entries(fontMap)
    .map(([k, v]) => `        '${k}' => '${phpEscape(v)}',`)
    .join("\n");
  const spacingMap: Record<string, string> = {
    xs: resolved.spacingXs,
    sm: resolved.spacingSm,
    md: resolved.spacingMd,
    lg: resolved.spacingLg,
    xl: resolved.spacingXl,
    "2xl": resolved.spacing2xl,
  };
  const spacingEntries = Object.entries(spacingMap)
    .map(([k, v]) => `        '${k}' => '${phpEscape(v)}',`)
    .join("\n");
  return `<?php
if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! function_exists( 'ditto_color' ) ) :
    /** Get a Ditto color by role, honoring any admin overrides. */
    function ditto_color( $name ) {
        static $defaults = null;
        if ( null === $defaults ) {
            $defaults = array(
${colorEntries}
            );
        }
        $overrides = get_option( 'ditto_tokens_overrides', array() );
        $colors = isset( $overrides['colors'] ) && is_array( $overrides['colors'] ) ? $overrides['colors'] : array();
        if ( isset( $colors[ $name ] ) && ! empty( $colors[ $name ] ) ) {
            return $colors[ $name ];
        }
        return isset( $defaults[ $name ] ) ? $defaults[ $name ] : '';
    }
endif;

if ( ! function_exists( 'ditto_font' ) ) :
    /** Get a Ditto font family by role. */
    function ditto_font( $role ) {
        static $fonts = null;
        if ( null === $fonts ) {
            $fonts = array(
${fontEntries}
            );
        }
        return isset( $fonts[ $role ] ) ? $fonts[ $role ] : '';
    }
endif;

if ( ! function_exists( 'ditto_spacing' ) ) :
    /** Get a Ditto spacing token. */
    function ditto_spacing( $size ) {
        static $spacing = null;
        if ( null === $spacing ) {
            $spacing = array(
${spacingEntries}
            );
        }
        return isset( $spacing[ $size ] ) ? $spacing[ $size ] : '';
    }
endif;
`;
}

// ── inc/enqueue.php ────────────────────────────────────────────────────

function buildEnqueuePhp(opts: GenerateWordPressPluginOptions): string {
  const fnPrefix = fnPrefixFor(opts.designSlug);
  const PREFIX = fnPrefix.toUpperCase();
  const textDomain = textDomainFor(opts.designSlug);
  return `<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function ${fnPrefix}_enqueue_front() {
    wp_enqueue_style(
        '${slugDashed(opts.designSlug)}-ditto-tokens',
        ${PREFIX}_URL . 'assets/tokens.css',
        array(),
        ${PREFIX}_VERSION
    );
    $inline = ${fnPrefix}_build_overrides_css();
    if ( ! empty( $inline ) ) {
        wp_add_inline_style( '${slugDashed(opts.designSlug)}-ditto-tokens', $inline );
    }
}
add_action( 'wp_enqueue_scripts', '${fnPrefix}_enqueue_front' );
add_action( 'enqueue_block_editor_assets', '${fnPrefix}_enqueue_front' );

/** Build :root CSS overrides from the admin-saved option. */
function ${fnPrefix}_build_overrides_css() {
    $o = get_option( 'ditto_tokens_overrides', array() );
    if ( empty( $o ) || ! is_array( $o ) ) return '';
    $lines = array();
    if ( ! empty( $o['colors'] ) && is_array( $o['colors'] ) ) {
        foreach ( $o['colors'] as $slug => $val ) {
            if ( empty( $val ) ) continue;
            $safe_slug = sanitize_key( $slug );
            $safe_val  = sanitize_hex_color( $val );
            if ( $safe_val ) {
                $lines[] = '--d-' . $safe_slug . ': ' . $safe_val . ';';
            }
        }
    }
    if ( empty( $lines ) ) return '';
    return ':root{' . implode( '', $lines ) . '}';
}

// Enqueue block styles on front + editor
function ${fnPrefix}_enqueue_block_styles() {
    $blocks = array( 'hero', 'feature-grid', 'cta', 'pricing-card' );
    foreach ( $blocks as $block ) {
        wp_enqueue_style(
            'ditto-block-' . $block,
            ${PREFIX}_URL . 'blocks/' . $block . '/style.css',
            array( '${slugDashed(opts.designSlug)}-ditto-tokens' ),
            ${PREFIX}_VERSION
        );
    }
}
add_action( 'wp_enqueue_scripts', '${fnPrefix}_enqueue_block_styles' );
add_action( 'enqueue_block_editor_assets', '${fnPrefix}_enqueue_block_styles' );

// Load text domain for i18n
function ${fnPrefix}_load_textdomain() {
    load_plugin_textdomain( '${textDomain}', false, dirname( plugin_basename( ${PREFIX}_PATH ) ) . '/languages' );
}
add_action( 'init', '${fnPrefix}_load_textdomain' );
`;
}

// ── inc/admin-page.php ─────────────────────────────────────────────────

function buildAdminPagePhp(opts: GenerateWordPressPluginOptions): string {
  const fnPrefix = fnPrefixFor(opts.designSlug);
  const textDomain = textDomainFor(opts.designSlug);
  const { designName } = opts;
  return `<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function ${fnPrefix}_register_admin_menu() {
    add_options_page(
        __( 'Ditto Tokens', '${textDomain}' ),
        __( 'Ditto Tokens', '${textDomain}' ),
        'manage_options',
        'ditto-tokens',
        '${fnPrefix}_render_admin_page'
    );
}
add_action( 'admin_menu', '${fnPrefix}_register_admin_menu' );

function ${fnPrefix}_enqueue_admin( $hook ) {
    if ( 'settings_page_ditto-tokens' !== $hook ) return;
    wp_enqueue_style( 'wp-color-picker' );
    wp_enqueue_script( 'wp-color-picker' );
    wp_add_inline_script( 'wp-color-picker', "jQuery(function($){$('.ditto-color-field').wpColorPicker();});" );
}
add_action( 'admin_enqueue_scripts', '${fnPrefix}_enqueue_admin' );

function ${fnPrefix}_render_admin_page() {
    if ( ! current_user_can( 'manage_options' ) ) return;

    if ( isset( $_POST['ditto_tokens_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['ditto_tokens_nonce'] ) ), 'ditto_tokens_save' ) ) {
        $colors = array();
        if ( isset( $_POST['ditto_colors'] ) && is_array( $_POST['ditto_colors'] ) ) {
            foreach ( $_POST['ditto_colors'] as $slug => $val ) {
                $safe_val = sanitize_hex_color( sanitize_text_field( wp_unslash( $val ) ) );
                if ( $safe_val ) $colors[ sanitize_key( $slug ) ] = $safe_val;
            }
        }
        update_option( 'ditto_tokens_overrides', array( 'colors' => $colors ) );
        echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Tokens saved.', '${textDomain}' ) . '</p></div>';
    }

    $overrides = get_option( 'ditto_tokens_overrides', array() );
    $color_overrides = isset( $overrides['colors'] ) && is_array( $overrides['colors'] ) ? $overrides['colors'] : array();
    $color_slugs = array( 'primary', 'secondary', 'accent', 'background', 'surface', 'text', 'text-secondary', 'text-muted', 'border', 'success', 'warning', 'error' );
    ?>
    <div class="wrap">
      <h1><?php esc_html_e( '${phpEscape(designName)} — Ditto Tokens', '${textDomain}' ); ?></h1>
      <p><?php esc_html_e( 'Override the extracted colors below. Leave empty to keep the design default.', '${textDomain}' ); ?></p>
      <form method="post">
        <?php wp_nonce_field( 'ditto_tokens_save', 'ditto_tokens_nonce' ); ?>
        <table class="form-table" role="presentation">
          <tbody>
          <?php foreach ( $color_slugs as $slug ) :
              $default = ditto_color( $slug );
              $value   = isset( $color_overrides[ $slug ] ) ? $color_overrides[ $slug ] : '';
              ?>
            <tr>
              <th scope="row"><label for="ditto-color-<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( ucwords( str_replace( '-', ' ', $slug ) ) ); ?></label></th>
              <td>
                <input
                  type="text"
                  id="ditto-color-<?php echo esc_attr( $slug ); ?>"
                  name="ditto_colors[<?php echo esc_attr( $slug ); ?>]"
                  value="<?php echo esc_attr( $value ); ?>"
                  class="ditto-color-field"
                  data-default-color="<?php echo esc_attr( $default ); ?>"
                />
                <p class="description"><?php echo esc_html( sprintf( __( 'Design default: %s', '${textDomain}' ), $default ) ); ?></p>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
        <?php submit_button( __( 'Save tokens', '${textDomain}' ) ); ?>
      </form>
    </div>
    <?php
}
`;
}

// ── inc/customizer.php ─────────────────────────────────────────────────

function buildCustomizerPhp(opts: GenerateWordPressPluginOptions): string {
  const fnPrefix = fnPrefixFor(opts.designSlug);
  const textDomain = textDomainFor(opts.designSlug);
  return `<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function ${fnPrefix}_customize_register( $wp_customize ) {
    $wp_customize->add_section( 'ditto_tokens', array(
        'title'    => __( 'Ditto Tokens', '${textDomain}' ),
        'priority' => 200,
    ) );

    $color_slugs = array( 'primary', 'secondary', 'accent' );
    foreach ( $color_slugs as $slug ) {
        $setting_id = 'ditto_tokens_' . $slug;
        $wp_customize->add_setting( $setting_id, array(
            'default'           => ditto_color( $slug ),
            'sanitize_callback' => 'sanitize_hex_color',
            'transport'         => 'refresh',
        ) );
        $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, $setting_id, array(
            'label'   => ucwords( str_replace( '-', ' ', $slug ) ),
            'section' => 'ditto_tokens',
        ) ) );
    }
}
add_action( 'customize_register', '${fnPrefix}_customize_register' );
`;
}

// ── inc/register-blocks.php ────────────────────────────────────────────

function buildRegisterBlocksPhp(opts: GenerateWordPressPluginOptions): string {
  const fnPrefix = fnPrefixFor(opts.designSlug);
  const PREFIX = fnPrefix.toUpperCase();
  return `<?php
if ( ! defined( 'ABSPATH' ) ) exit;

function ${fnPrefix}_register_blocks() {
    $blocks = array( 'hero', 'feature-grid', 'cta', 'pricing-card' );
    foreach ( $blocks as $block ) {
        register_block_type( ${PREFIX}_PATH . 'blocks/' . $block );
    }
}
add_action( 'init', '${fnPrefix}_register_blocks' );

function ${fnPrefix}_register_block_category( $categories ) {
    return array_merge(
        array( array(
            'slug'  => 'ditto',
            'title' => __( 'Ditto', ${PREFIX}_TEXTDOMAIN ),
            'icon'  => 'art',
        ) ),
        $categories
    );
}
add_filter( 'block_categories_all', '${fnPrefix}_register_block_category' );
`;
}

// ── blocks/* generators ────────────────────────────────────────────────

interface BlockSpec {
  name: string;
  title: string;
  description: string;
  icon: string;
  attributes: Record<string, { type: string; default?: string | number | boolean }>;
  renderPhp: string;
  styleCss: string;
}

function heroBlock(opts: GenerateWordPressPluginOptions): BlockSpec {
  const { tokens } = opts;
  const title = tokens.microcopy?.heroHeadline || `Welcome to ${opts.designName}`;
  const subtitle =
    tokens.microcopy?.heroSubheadline ||
    "Built with a design system extracted by Ditto.";
  const cta = tokens.microcopy?.ctaLabels?.[0] || "Get started";
  return {
    name: "hero",
    title: "Ditto Hero",
    description: "Centered hero with headline, subheadline, and CTA",
    icon: "megaphone",
    attributes: {
      title: { type: "string", default: title },
      subtitle: { type: "string", default: subtitle },
      ctaText: { type: "string", default: cta },
      ctaUrl: { type: "string", default: "#" },
    },
    renderPhp: `<?php
$title    = isset( $attributes['title'] )    ? $attributes['title']    : '';
$subtitle = isset( $attributes['subtitle'] ) ? $attributes['subtitle'] : '';
$cta_text = isset( $attributes['ctaText'] )  ? $attributes['ctaText']  : '';
$cta_url  = isset( $attributes['ctaUrl'] )   ? $attributes['ctaUrl']   : '#';
$wrap = get_block_wrapper_attributes( array( 'class' => 'ditto-hero' ) );
?>
<section <?php echo $wrap; ?>>
  <div class="ditto-hero__inner">
    <?php if ( $title ) : ?>
      <h1 class="ditto-hero__title"><?php echo esc_html( $title ); ?></h1>
    <?php endif; ?>
    <?php if ( $subtitle ) : ?>
      <p class="ditto-hero__subtitle"><?php echo esc_html( $subtitle ); ?></p>
    <?php endif; ?>
    <?php if ( $cta_text ) : ?>
      <a class="ditto-hero__cta" href="<?php echo esc_url( $cta_url ); ?>"><?php echo esc_html( $cta_text ); ?></a>
    <?php endif; ?>
  </div>
</section>
`,
    styleCss: `.ditto-hero {
  padding: var(--d-space-2xl) var(--d-space-md);
  background: var(--d-background);
  color: var(--d-text);
}
.ditto-hero__inner {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
}
.ditto-hero__title {
  font-family: var(--d-font-heading);
  font-weight: var(--d-font-weight-heading);
  font-size: var(--d-text-4xl);
  line-height: var(--d-leading-tight);
  color: var(--d-text);
  margin: 0 0 var(--d-space-md);
}
.ditto-hero__subtitle {
  font-family: var(--d-font-body);
  font-size: var(--d-text-lg);
  line-height: var(--d-leading-relaxed);
  color: var(--d-text-secondary);
  margin: 0 0 var(--d-space-lg);
}
.ditto-hero__cta {
  display: inline-block;
  padding: var(--d-space-sm) var(--d-space-lg);
  background: var(--d-primary);
  color: var(--d-on-primary);
  border-radius: var(--d-radius-md);
  box-shadow: var(--d-shadow-sm);
  font-family: var(--d-font-body);
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease;
}
.ditto-hero__cta:hover {
  background: var(--d-accent);
  color: var(--d-on-primary);
}
`,
  };
}

function featureGridBlock(): BlockSpec {
  return {
    name: "feature-grid",
    title: "Ditto Feature Grid",
    description: "Three-column feature grid with headings and descriptions",
    icon: "grid-view",
    attributes: {
      heading: { type: "string", default: "Everything you need" },
      feature1Title: { type: "string", default: "Lightning fast" },
      feature1Body: {
        type: "string",
        default: "Built for snappy authoring and rendering.",
      },
      feature2Title: { type: "string", default: "Fully themeable" },
      feature2Body: {
        type: "string",
        default: "All tokens live in CSS variables — edit once, apply everywhere.",
      },
      feature3Title: { type: "string", default: "Drop-in blocks" },
      feature3Body: {
        type: "string",
        default: "Hero, features, CTA and pricing ready to compose pages.",
      },
    },
    renderPhp: `<?php
$heading = isset( $attributes['heading'] ) ? $attributes['heading'] : '';
$items = array();
for ( $i = 1; $i <= 3; $i++ ) {
    $items[] = array(
        'title' => isset( $attributes[ 'feature' . $i . 'Title' ] ) ? $attributes[ 'feature' . $i . 'Title' ] : '',
        'body'  => isset( $attributes[ 'feature' . $i . 'Body' ] )  ? $attributes[ 'feature' . $i . 'Body' ]  : '',
    );
}
$wrap = get_block_wrapper_attributes( array( 'class' => 'ditto-feature-grid' ) );
?>
<section <?php echo $wrap; ?>>
  <div class="ditto-feature-grid__inner">
    <?php if ( $heading ) : ?>
      <h2 class="ditto-feature-grid__heading"><?php echo esc_html( $heading ); ?></h2>
    <?php endif; ?>
    <div class="ditto-feature-grid__cols">
      <?php foreach ( $items as $item ) : ?>
        <div class="ditto-feature-grid__item">
          <?php if ( $item['title'] ) : ?>
            <h3 class="ditto-feature-grid__item-title"><?php echo esc_html( $item['title'] ); ?></h3>
          <?php endif; ?>
          <?php if ( $item['body'] ) : ?>
            <p class="ditto-feature-grid__item-body"><?php echo esc_html( $item['body'] ); ?></p>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>
`,
    styleCss: `.ditto-feature-grid {
  padding: var(--d-space-2xl) var(--d-space-md);
  background: var(--d-surface);
  color: var(--d-text);
}
.ditto-feature-grid__inner {
  max-width: 1100px;
  margin: 0 auto;
}
.ditto-feature-grid__heading {
  font-family: var(--d-font-heading);
  font-weight: var(--d-font-weight-heading);
  font-size: var(--d-text-3xl);
  line-height: var(--d-leading-tight);
  text-align: center;
  margin: 0 0 var(--d-space-xl);
}
.ditto-feature-grid__cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--d-space-lg);
}
.ditto-feature-grid__item-title {
  font-family: var(--d-font-heading);
  font-weight: var(--d-font-weight-heading);
  font-size: var(--d-text-lg);
  margin: 0 0 var(--d-space-sm);
  color: var(--d-text);
}
.ditto-feature-grid__item-body {
  font-family: var(--d-font-body);
  font-size: var(--d-text-sm);
  line-height: var(--d-leading-relaxed);
  color: var(--d-text-secondary);
  margin: 0;
}
`,
  };
}

function ctaBlock(opts: GenerateWordPressPluginOptions): BlockSpec {
  const cta =
    opts.tokens.microcopy?.ctaLabels?.[1] ||
    opts.tokens.microcopy?.ctaLabels?.[0] ||
    "Get started";
  return {
    name: "cta",
    title: "Ditto CTA",
    description: "Centered call-to-action with headline and button",
    icon: "cover-image",
    attributes: {
      heading: { type: "string", default: "Ready when you are." },
      body: {
        type: "string",
        default: "Join the team building with this design system.",
      },
      buttonText: { type: "string", default: cta },
      buttonUrl: { type: "string", default: "#" },
    },
    renderPhp: `<?php
$heading = isset( $attributes['heading'] )    ? $attributes['heading']    : '';
$body    = isset( $attributes['body'] )       ? $attributes['body']       : '';
$btn_t   = isset( $attributes['buttonText'] ) ? $attributes['buttonText'] : '';
$btn_u   = isset( $attributes['buttonUrl'] )  ? $attributes['buttonUrl']  : '#';
$wrap = get_block_wrapper_attributes( array( 'class' => 'ditto-cta' ) );
?>
<section <?php echo $wrap; ?>>
  <div class="ditto-cta__inner">
    <?php if ( $heading ) : ?>
      <h2 class="ditto-cta__heading"><?php echo esc_html( $heading ); ?></h2>
    <?php endif; ?>
    <?php if ( $body ) : ?>
      <p class="ditto-cta__body"><?php echo esc_html( $body ); ?></p>
    <?php endif; ?>
    <?php if ( $btn_t ) : ?>
      <a class="ditto-cta__button" href="<?php echo esc_url( $btn_u ); ?>"><?php echo esc_html( $btn_t ); ?></a>
    <?php endif; ?>
  </div>
</section>
`,
    styleCss: `.ditto-cta {
  padding: var(--d-space-2xl) var(--d-space-md);
  background: var(--d-background);
  color: var(--d-text);
}
.ditto-cta__inner {
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
}
.ditto-cta__heading {
  font-family: var(--d-font-heading);
  font-weight: var(--d-font-weight-heading);
  font-size: var(--d-text-3xl);
  line-height: var(--d-leading-tight);
  margin: 0 0 var(--d-space-md);
}
.ditto-cta__body {
  font-family: var(--d-font-body);
  font-size: var(--d-text-base);
  line-height: var(--d-leading-relaxed);
  color: var(--d-text-secondary);
  margin: 0 0 var(--d-space-lg);
}
.ditto-cta__button {
  display: inline-block;
  padding: var(--d-space-sm) var(--d-space-lg);
  background: var(--d-primary);
  color: var(--d-on-primary);
  border-radius: var(--d-radius-md);
  font-weight: 500;
  text-decoration: none;
}
.ditto-cta__button:hover { background: var(--d-accent); }
`,
  };
}

function pricingCardBlock(): BlockSpec {
  return {
    name: "pricing-card",
    title: "Ditto Pricing Card",
    description: "Pricing card with plan name, price and feature list",
    icon: "money-alt",
    attributes: {
      planName: { type: "string", default: "Pro" },
      price: { type: "string", default: "$29" },
      priceSuffix: { type: "string", default: "/month" },
      features: {
        type: "string",
        default: "Unlimited projects|Priority support|Team collaboration|Export everywhere",
      },
      buttonText: { type: "string", default: "Start free trial" },
      buttonUrl: { type: "string", default: "#" },
      featured: { type: "boolean", default: false },
    },
    renderPhp: `<?php
$plan      = isset( $attributes['planName'] )    ? $attributes['planName']    : '';
$price     = isset( $attributes['price'] )       ? $attributes['price']       : '';
$suffix    = isset( $attributes['priceSuffix'] ) ? $attributes['priceSuffix'] : '';
$features  = isset( $attributes['features'] )    ? $attributes['features']    : '';
$btn_t     = isset( $attributes['buttonText'] )  ? $attributes['buttonText']  : '';
$btn_u     = isset( $attributes['buttonUrl'] )   ? $attributes['buttonUrl']   : '#';
$featured  = ! empty( $attributes['featured'] );
$wrap_class = 'ditto-pricing-card' . ( $featured ? ' is-featured' : '' );
$wrap = get_block_wrapper_attributes( array( 'class' => $wrap_class ) );
$items = array_filter( array_map( 'trim', explode( '|', $features ) ) );
?>
<div <?php echo $wrap; ?>>
  <?php if ( $plan ) : ?>
    <div class="ditto-pricing-card__plan"><?php echo esc_html( $plan ); ?></div>
  <?php endif; ?>
  <?php if ( $price ) : ?>
    <div class="ditto-pricing-card__price">
      <span class="ditto-pricing-card__amount"><?php echo esc_html( $price ); ?></span>
      <?php if ( $suffix ) : ?>
        <span class="ditto-pricing-card__suffix"><?php echo esc_html( $suffix ); ?></span>
      <?php endif; ?>
    </div>
  <?php endif; ?>
  <?php if ( ! empty( $items ) ) : ?>
    <ul class="ditto-pricing-card__features">
      <?php foreach ( $items as $item ) : ?>
        <li><?php echo esc_html( $item ); ?></li>
      <?php endforeach; ?>
    </ul>
  <?php endif; ?>
  <?php if ( $btn_t ) : ?>
    <a class="ditto-pricing-card__cta" href="<?php echo esc_url( $btn_u ); ?>"><?php echo esc_html( $btn_t ); ?></a>
  <?php endif; ?>
</div>
`,
    styleCss: `.ditto-pricing-card {
  background: var(--d-surface);
  border: 1px solid var(--d-border);
  border-radius: var(--d-radius-lg);
  padding: var(--d-space-xl);
  box-shadow: var(--d-shadow-sm);
  font-family: var(--d-font-body);
  color: var(--d-text);
  max-width: 340px;
}
.ditto-pricing-card.is-featured {
  border-color: var(--d-primary);
  box-shadow: var(--d-shadow-md);
}
.ditto-pricing-card__plan {
  font-family: var(--d-font-heading);
  font-weight: var(--d-font-weight-heading);
  font-size: var(--d-text-lg);
  color: var(--d-text);
}
.ditto-pricing-card__price {
  display: flex;
  align-items: baseline;
  gap: var(--d-space-xs);
  margin: var(--d-space-sm) 0 var(--d-space-md);
}
.ditto-pricing-card__amount {
  font-family: var(--d-font-heading);
  font-weight: var(--d-font-weight-heading);
  font-size: var(--d-text-3xl);
  color: var(--d-primary);
}
.ditto-pricing-card__suffix {
  font-size: var(--d-text-sm);
  color: var(--d-text-muted);
}
.ditto-pricing-card__features {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--d-space-lg);
}
.ditto-pricing-card__features li {
  padding: var(--d-space-xs) 0;
  font-size: var(--d-text-sm);
  color: var(--d-text-secondary);
  border-top: 1px solid var(--d-border);
}
.ditto-pricing-card__features li:first-child { border-top: none; }
.ditto-pricing-card__cta {
  display: block;
  text-align: center;
  padding: var(--d-space-sm) var(--d-space-md);
  background: var(--d-primary);
  color: var(--d-on-primary);
  border-radius: var(--d-radius-md);
  font-weight: 500;
  text-decoration: none;
}
.ditto-pricing-card__cta:hover { background: var(--d-accent); }
`,
  };
}

function buildBlockJson(
  block: BlockSpec,
  textDomain: string
): string {
  const blockJson = {
    $schema: "https://schemas.wp.org/trunk/block.json",
    apiVersion: 3,
    name: `ditto/${block.name}`,
    title: block.title,
    category: "ditto",
    description: block.description,
    icon: block.icon,
    textdomain: textDomain,
    supports: {
      html: false,
      align: ["wide", "full"],
    },
    attributes: block.attributes,
    style: "file:./style.css",
    editorStyle: "file:./style.css",
    render: "file:./render.php",
    editorScript: "file:./edit.js",
  };
  return JSON.stringify(blockJson, null, 2);
}

function buildBlockEditJs(blockName: string): string {
  // Plain IIFE using WP globals — no build step required. Uses ServerSideRender
  // so the editor preview matches render.php output.
  return `( function ( blocks, element, serverSideRender ) {
  var el = element.createElement;
  blocks.registerBlockType( 'ditto/${blockName}', {
    edit: function ( props ) {
      return el(
        'div',
        { className: 'ditto-ssr-wrap' },
        el( serverSideRender, {
          block: 'ditto/${blockName}',
          attributes: props.attributes,
        } )
      );
    },
    save: function () { return null; }
  } );
} )( window.wp.blocks, window.wp.element, window.wp.serverSideRender );
`;
}

// ── readme.txt ─────────────────────────────────────────────────────────

function buildReadmeTxt(
  opts: GenerateWordPressPluginOptions,
  hasFonts: boolean
): string {
  const { designName, designUrl } = opts;
  const lines: string[] = [];
  lines.push(`=== ${designName} — Ditto ===`);
  lines.push(`Contributors: ditto`);
  lines.push(`Tags: design-system, tokens, blocks, gutenberg, customizer`);
  lines.push(`Requires at least: 6.4`);
  lines.push(`Tested up to: 6.6`);
  lines.push(`Stable tag: 1.0.0`);
  lines.push(`Requires PHP: 7.4`);
  lines.push(`License: GPLv2 or later`);
  lines.push(`License URI: https://www.gnu.org/licenses/gpl-2.0.html`);
  lines.push(``);
  lines.push(
    `A universal WordPress plugin that applies the design system extracted by Ditto from ${designUrl ?? "a source site"} to any theme.`
  );
  lines.push(``);
  lines.push(`== Description ==`);
  lines.push(``);
  lines.push(`This plugin ships:`);
  lines.push(``);
  lines.push(
    `* A set of global CSS custom properties (\`--d-*\`) covering colors, typography, spacing, radii and shadows.`
  );
  lines.push(
    `* 4 Gutenberg blocks: Hero, Feature Grid, CTA, and Pricing Card.`
  );
  lines.push(`* An admin page under Settings → Ditto Tokens to override colors.`);
  lines.push(
    `* PHP helpers \`ditto_color()\`, \`ditto_font()\`, \`ditto_spacing()\` for theme integration.`
  );
  lines.push(``);
  lines.push(`== Installation ==`);
  lines.push(``);
  lines.push(`1. Upload the plugin folder to /wp-content/plugins/`);
  lines.push(`2. Activate the plugin in Plugins → Installed Plugins`);
  lines.push(`3. Visit Settings → Ditto Tokens to review defaults or customize`);
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
    lines.push(
      `Self-hosted fonts shipped under /assets/fonts/ are extracted from the source site. Verify their licenses before redistributing.`
    );
  }
  return lines.join("\n") + "\n";
}

// ── Public API ─────────────────────────────────────────────────────────

export async function generateWordPressPlugin(
  opts: GenerateWordPressPluginOptions
): Promise<WPPluginFile[]> {
  const files: WPPluginFile[] = [];
  const { tokens, designSlug } = opts;
  const textDomain = textDomainFor(designSlug);

  // 1. Bundle fonts + build @font-face rules
  const fontFaceMap = new Map<string, SharedFontFaceEntry[]>();
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
    const entry: SharedFontFaceEntry = {
      filename: r.filename,
      format: normalizeFontFormat(r.df.format),
      weight: parseWeightFromFilename(r.filename),
      style: parseStyleFromFilename(r.filename),
    };
    const arr = fontFaceMap.get(r.df.family) ?? [];
    arr.push(entry);
    fontFaceMap.set(r.df.family, arr);
  }

  const fontFaceBlocks: string[] = [];
  for (const [family, entries] of fontFaceMap) {
    fontFaceBlocks.push(...buildFontFaceRule(family, entries));
  }

  // 2. Plugin main file (named `${slug}-ditto.php`)
  const mainFileName = `${slugDashed(designSlug)}-ditto.php`;
  files.push({ path: mainFileName, content: buildMainPhp(opts) });
  files.push({ path: "uninstall.php", content: buildUninstallPhp() });
  files.push({
    path: "readme.txt",
    content: buildReadmeTxt(opts, fontFaceMap.size > 0),
  });

  // 3. Assets
  files.push({
    path: "assets/tokens.css",
    content: buildTokensCss(opts.resolved, fontFaceBlocks),
  });

  // 4. inc/
  files.push({ path: "inc/helpers.php", content: buildHelpersPhp(opts) });
  files.push({ path: "inc/enqueue.php", content: buildEnqueuePhp(opts) });
  files.push({ path: "inc/admin-page.php", content: buildAdminPagePhp(opts) });
  files.push({ path: "inc/customizer.php", content: buildCustomizerPhp(opts) });
  files.push({
    path: "inc/register-blocks.php",
    content: buildRegisterBlocksPhp(opts),
  });

  // 5. Blocks
  const blocks: BlockSpec[] = [
    heroBlock(opts),
    featureGridBlock(),
    ctaBlock(opts),
    pricingCardBlock(),
  ];
  for (const block of blocks) {
    files.push({
      path: `blocks/${block.name}/block.json`,
      content: buildBlockJson(block, textDomain),
    });
    files.push({
      path: `blocks/${block.name}/render.php`,
      content: block.renderPhp,
    });
    files.push({
      path: `blocks/${block.name}/style.css`,
      content: block.styleCss,
    });
    files.push({
      path: `blocks/${block.name}/edit.js`,
      content: buildBlockEditJs(block.name),
    });
  }

  return files;
}

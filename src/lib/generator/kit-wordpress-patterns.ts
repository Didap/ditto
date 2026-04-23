/**
 * WordPress FSE pattern generator — 24 section variants (Hero, Stats,
 * Features, Reviews, CTA, Footer × classic/elegante/artistico/fresco).
 *
 * Each builder returns a `.php` file as a string. WP auto-registers anything
 * in `patterns/*.php` with a Slug header. Patterns are then referenced from
 * templates via `<!-- wp:pattern {"slug":"<cat>/<section>-<variant>"} /-->`.
 *
 * All patterns use the site's theme.json palette tokens (`primary`,
 * `secondary`, `accent`, `surface`, `text-secondary`, etc.) — editing Global
 * Styles propagates to every section without touching markup.
 */

import type { ResolvedDesign, DesignTokens, SectionVariant } from "../types";
import { slugDashed } from "./wp-shared";

export interface PatternContext {
  designName: string;
  designSlug: string;
  resolved: ResolvedDesign;
  tokens: DesignTokens;
}

function esc(s: string): string {
  // Escape for use inside a single-quoted PHP string.
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function textDomain(slug: string): string {
  const candidate = `${slug}-block-theme`;
  return candidate.length <= 30 ? candidate : `${slug.slice(0, 24)}-block-theme`;
}

function localLogoMarkup(ctx: PatternContext, opts: { size?: number } = {}): string {
  const { size = 32 } = opts;
  // Use Site Logo block — respects whatever the user set via the WP Customizer.
  // Falls back to Site Title. The placeholder SVG ships at assets/logo.svg
  // and can be set as Site Logo one-click from the demo importer.
  void ctx;
  return `<!-- wp:site-logo {"width":${size}} /-->
<!-- wp:site-title {"level":0,"fontSize":"lg","style":{"typography":{"fontWeight":"700"}}} /-->`;
}

function sectionHeader(title: string, category: string): string {
  return `<?php
/**
 * Title: ${title}
 * Slug: ${category}/${title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}
 * Categories: ${category}, featured
 * Inserter: no
 */
?>`;
}

// ════════════════════════════════════════════════════════════════════════
// HERO
// ════════════════════════════════════════════════════════════════════════

function heroClassic(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const title = esc(ctx.tokens.microcopy?.heroHeadline || `Welcome to ${ctx.designName}`);
  const sub = esc(ctx.tokens.microcopy?.heroSubheadline || "Built with a design system extracted by Ditto.");
  const cta = esc(ctx.tokens.microcopy?.ctaLabels?.[0] || "Get Started");
  return `<?php
/**
 * Title: Hero — Classic
 * Slug: ${cat}/hero-classic
 * Categories: ${cat}, featured
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained","contentSize":"720px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--40)">
  <!-- wp:heading {"level":1,"textAlign":"center","fontSize":"4xl","style":{"typography":{"lineHeight":"1.1","letterSpacing":"-0.02em"}}} -->
  <h1 class="wp-block-heading has-text-align-center has-4-xl-font-size" style="letter-spacing:-0.02em;line-height:1.1"><?php esc_html_e( '${title}', '${d}' ); ?></h1>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","fontSize":"lg","textColor":"text-secondary","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|50"}}}} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color has-lg-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:var(--wp--preset--spacing--50)"><?php esc_html_e( '${sub}', '${d}' ); ?></p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"backgroundColor":"primary","textColor":"background","style":{"border":{"radius":"var:custom|radius|md"}}} -->
    <div class="wp-block-button"><a class="wp-block-button__link has-background-color has-primary-background-color has-text-color has-background wp-element-button" style="border-radius:var(--wp--custom--radius--md)"><?php esc_html_e( '${cta}', '${d}' ); ?></a></div>
    <!-- /wp:button -->
    <!-- wp:button {"className":"is-style-outline","style":{"border":{"radius":"var:custom|radius|md"}}} -->
    <div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" style="border-radius:var(--wp--custom--radius--md)"><?php esc_html_e( 'Learn more', '${d}' ); ?></a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</section>
<!-- /wp:group -->
`;
}

function heroElegante(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const title = esc(ctx.tokens.microcopy?.heroHeadline || `${ctx.designName}`);
  const sub = esc(ctx.tokens.microcopy?.heroSubheadline || "A quiet, deliberate take on the modern web.");
  return `<?php
/**
 * Title: Hero — Elegante
 * Slug: ${cat}/hero-elegante
 * Categories: ${cat}, featured
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained","contentSize":"800px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-muted","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.3em"},"spacing":{"margin":{"bottom":"var:preset|spacing|40"}}}} -->
  <p class="has-text-align-center has-text-muted-color has-text-color has-sm-font-size" style="margin-bottom:var(--wp--preset--spacing--40);text-transform:uppercase;letter-spacing:0.3em">— <?php esc_html_e( 'New Collection', '${d}' ); ?> —</p>
  <!-- /wp:paragraph -->
  <!-- wp:heading {"level":1,"textAlign":"center","style":{"typography":{"fontSize":"clamp(2.5rem,6vw,4.5rem)","fontWeight":"400","lineHeight":"1.05","letterSpacing":"-0.02em"}}} -->
  <h1 class="wp-block-heading has-text-align-center" style="font-size:clamp(2.5rem,6vw,4.5rem);font-weight:400;letter-spacing:-0.02em;line-height:1.05"><?php esc_html_e( '${title}', '${d}' ); ?></h1>
  <!-- /wp:heading -->
  <!-- wp:group {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}}} -->
  <div class="wp-block-group" style="margin-top:var(--wp--preset--spacing--50);margin-bottom:var(--wp--preset--spacing--50)">
    <!-- wp:separator {"backgroundColor":"text-muted","style":{"spacing":{"margin":{"top":"0","bottom":"0"}},"layout":{"selfStretch":"fixed","flexSize":"80px"}}} -->
    <hr class="wp-block-separator has-text-color has-text-muted-color has-alpha-channel-opacity has-text-muted-background-color has-background" style="margin-top:0;margin-bottom:0"/>
    <!-- /wp:separator -->
  </div>
  <!-- /wp:group -->
  <!-- wp:paragraph {"align":"center","fontSize":"md","textColor":"text-secondary","style":{"typography":{"lineHeight":"1.7"}}} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color has-md-font-size" style="line-height:1.7"><?php esc_html_e( '${sub}', '${d}' ); ?></p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|60"}}}} -->
  <div class="wp-block-buttons" style="margin-top:var(--wp--preset--spacing--60)">
    <!-- wp:button {"className":"is-style-outline","style":{"border":{"radius":"0","width":"1px"},"typography":{"textTransform":"uppercase","letterSpacing":"0.22em","fontSize":"0.75rem","fontWeight":"500"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"32px","right":"32px"}}}} -->
    <div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" style="border-width:1px;border-radius:0;padding-top:14px;padding-right:32px;padding-bottom:14px;padding-left:32px;font-size:0.75rem;font-weight:500;letter-spacing:0.22em;text-transform:uppercase"><?php esc_html_e( 'Begin the journey', '${d}' ); ?> →</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</section>
<!-- /wp:group -->
`;
}

function heroArtistico(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const title = esc(ctx.tokens.microcopy?.heroHeadline || `Bold ideas.\nBetter outcomes.`);
  const sub = esc(ctx.tokens.microcopy?.heroSubheadline || "We believe in strong opinions, loosely held, and pixel-perfect execution.");
  return `<?php
/**
 * Title: Hero — Artistico
 * Slug: ${cat}/hero-artistico
 * Categories: ${cat}, featured
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:columns {"align":"wide","verticalAlignment":"center","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|50","left":"var:preset|spacing|60"}}}} -->
  <div class="wp-block-columns alignwide are-vertically-aligned-center">
    <!-- wp:column {"verticalAlignment":"center","width":"58%"} -->
    <div class="wp-block-column is-vertically-aligned-center" style="flex-basis:58%">
      <!-- wp:paragraph {"style":{"color":{"background":"var:preset|color|accent"},"border":{"radius":"4px"},"spacing":{"padding":{"top":"4px","bottom":"4px","left":"12px","right":"12px"},"margin":{"bottom":"var:preset|spacing|30"}},"typography":{"fontSize":"0.75rem","fontWeight":"600","textTransform":"uppercase","letterSpacing":"0.08em"}},"className":"","fontSize":"sm"} -->
      <p class="has-sm-font-size" style="border-radius:4px;background-color:var(--wp--preset--color--accent);margin-bottom:var(--wp--preset--spacing--30);padding-top:4px;padding-right:12px;padding-bottom:4px;padding-left:12px;font-size:0.75rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;display:inline-block">✦ <?php esc_html_e( 'New Release', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
      <!-- wp:heading {"level":1,"style":{"typography":{"fontSize":"clamp(2.75rem,6vw,3.5rem)","fontWeight":"800","lineHeight":"1.05","letterSpacing":"-0.03em"}}} -->
      <h1 class="wp-block-heading" style="font-size:clamp(2.75rem,6vw,3.5rem);font-weight:800;letter-spacing:-0.03em;line-height:1.05"><?php echo wp_kses_post( nl2br( esc_html__( '${title}', '${d}' ) ) ); ?></h1>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"fontSize":"lg","textColor":"text-secondary","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|50"}}}} -->
      <p class="has-text-secondary-color has-text-color has-lg-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:var(--wp--preset--spacing--50)"><?php esc_html_e( '${sub}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
      <!-- wp:buttons -->
      <div class="wp-block-buttons">
        <!-- wp:button {"backgroundColor":"text","textColor":"background","style":{"border":{"radius":"999px"}}} -->
        <div class="wp-block-button"><a class="wp-block-button__link has-background-color has-text-background-color has-text-color has-background wp-element-button" style="border-radius:999px"><?php esc_html_e( 'Get Started', '${d}' ); ?> ✦</a></div>
        <!-- /wp:button -->
        <!-- wp:button {"className":"is-style-outline","style":{"border":{"radius":"999px","width":"2px"}}} -->
        <div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" style="border-width:2px;border-radius:999px"><?php esc_html_e( 'View Demo', '${d}' ); ?></a></div>
        <!-- /wp:button -->
      </div>
      <!-- /wp:buttons -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column {"verticalAlignment":"center","width":"42%"} -->
    <div class="wp-block-column is-vertically-aligned-center" style="flex-basis:42%">
      <!-- wp:cover {"customOverlayColor":"#ffffff00","isUserOverlayColor":true,"gradient":"primary-to-secondary","isDark":false,"style":{"border":{"radius":"var:custom|radius|lg"},"dimensions":{"aspectRatio":"1"}}} -->
      <div class="wp-block-cover is-light" style="border-radius:var(--wp--custom--radius--lg);aspect-ratio:1">
        <span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim has-background-gradient has-primary-to-secondary-gradient-background"></span>
        <div class="wp-block-cover__inner-container"></div>
      </div>
      <!-- /wp:cover -->
    </div>
    <!-- /wp:column -->
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function heroFresco(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const title = esc(ctx.tokens.microcopy?.heroHeadline || `Build beautiful products faster`);
  const sub = esc(ctx.tokens.microcopy?.heroSubheadline || "The modern way to ship ideas.");
  return `<?php
/**
 * Title: Hero — Fresco
 * Slug: ${cat}/hero-fresco
 * Categories: ${cat}, featured
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<section class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
  <!-- wp:group {"align":"wide","gradient":"primary-to-secondary","style":{"border":{"radius":"var:custom|radius|lg"},"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}}},"layout":{"type":"constrained","contentSize":"720px"}} -->
  <div class="wp-block-group alignwide has-primary-to-secondary-gradient-background has-background" style="border-radius:var(--wp--custom--radius--lg);padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--50)">
    <!-- wp:paragraph {"align":"center","fontSize":"sm","style":{"color":{"background":"var:preset|color|background"},"border":{"radius":"999px","width":"1px","color":"var:preset|color|border"},"spacing":{"padding":{"top":"4px","bottom":"4px","left":"14px","right":"14px"},"margin":{"bottom":"var:preset|spacing|30"}},"typography":{"fontWeight":"600"}},"textColor":"text"} -->
    <p class="has-text-align-center has-text-color has-text-color has-background has-border-color has-sm-font-size" style="border-color:var(--wp--preset--color--border);border-width:1px;border-radius:999px;background-color:var(--wp--preset--color--background);margin-bottom:var(--wp--preset--spacing--30);padding-top:4px;padding-right:14px;padding-bottom:4px;padding-left:14px;font-weight:600;display:inline-block">🎉 <?php esc_html_e( 'Now live', '${d}' ); ?></p>
    <!-- /wp:paragraph -->
    <!-- wp:heading {"level":1,"textAlign":"center","textColor":"background","style":{"typography":{"fontSize":"clamp(2.25rem,5vw,3rem)","fontWeight":"800","lineHeight":"1.1","letterSpacing":"-0.01em"}}} -->
    <h1 class="wp-block-heading has-text-align-center has-background-color has-text-color" style="font-size:clamp(2.25rem,5vw,3rem);font-weight:800;letter-spacing:-0.01em;line-height:1.1"><?php esc_html_e( '${title}', '${d}' ); ?></h1>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"align":"center","textColor":"background","fontSize":"md","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|50"}},"typography":{"fontSize":"1rem"}}} -->
    <p class="has-text-align-center has-background-color has-text-color has-md-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:var(--wp--preset--spacing--50);font-size:1rem;opacity:.9"><?php esc_html_e( '${sub}', '${d}' ); ?></p>
    <!-- /wp:paragraph -->
    <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
    <div class="wp-block-buttons">
      <!-- wp:button {"backgroundColor":"background","textColor":"text","style":{"border":{"radius":"999px"},"typography":{"fontWeight":"700"}}} -->
      <div class="wp-block-button"><a class="wp-block-button__link has-text-color has-text-color has-background-background-color has-background wp-element-button" style="border-radius:999px;font-weight:700"><?php esc_html_e( 'Start free', '${d}' ); ?> →</a></div>
      <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->
  </div>
  <!-- /wp:group -->
</section>
<!-- /wp:group -->
`;
}

// ════════════════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════════════════

const STATS_ITEMS = [
  { value: "12,000+", label: "Active Users" },
  { value: "99.99%", label: "Uptime" },
  { value: "40+", label: "Countries" },
];

function statsClassic(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const cols = STATS_ITEMS.map(
    (s) => `    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":3,"textAlign":"center","style":{"typography":{"fontSize":"2.25rem","fontWeight":"800","letterSpacing":"-0.01em"}}} -->
      <h3 class="wp-block-heading has-text-align-center" style="font-size:2.25rem;font-weight:800;letter-spacing:-0.01em">${esc(s.value)}</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-muted"} -->
      <p class="has-text-align-center has-text-muted-color has-text-color has-sm-font-size"><?php esc_html_e( '${esc(s.label)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Stats — Classic
 * Slug: ${cat}/stats-classic
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:columns {"align":"wide"} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function statsElegante(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const cols = STATS_ITEMS.map(
    (s, i) => `    <!-- wp:column {"style":{"border":{"right":${i < STATS_ITEMS.length - 1 ? "{\"color\":\"var:preset|color|border\",\"width\":\"1px\"}" : "{}"}}}} -->
    <div class="wp-block-column"${i < STATS_ITEMS.length - 1 ? " style=\"border-right-color:var(--wp--preset--color--border);border-right-width:1px\"" : ""}>
      <!-- wp:heading {"level":3,"textAlign":"center","style":{"typography":{"fontSize":"3rem","fontWeight":"300","letterSpacing":"-0.01em"}}} -->
      <h3 class="wp-block-heading has-text-align-center" style="font-size:3rem;font-weight:300;letter-spacing:-0.01em">${esc(s.value)}</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-muted","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.22em","fontSize":"0.6875rem"},"spacing":{"margin":{"top":"var:preset|spacing|30"}}}} -->
      <p class="has-text-align-center has-text-muted-color has-text-color has-sm-font-size" style="margin-top:var(--wp--preset--spacing--30);font-size:0.6875rem;letter-spacing:0.22em;text-transform:uppercase"><?php esc_html_e( '${esc(s.label)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Stats — Elegante
 * Slug: ${cat}/stats-elegante
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:columns {"align":"wide"} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function statsArtistico(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const tints = ["primary", "secondary", "accent"];
  const cols = STATS_ITEMS.map(
    (s, i) => `    <!-- wp:column {"style":{"border":{"width":"2px","color":"var:preset|color|text","radius":"var:custom|radius|lg"},"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}},"color":{"background":"var:preset|color|surface"}}} -->
    <div class="wp-block-column has-background" style="border-color:var(--wp--preset--color--text);border-width:2px;border-radius:var(--wp--custom--radius--lg);background-color:var(--wp--preset--color--surface);padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40);${i === 1 ? "transform:translateY(-12px);" : i === 2 ? "transform:translateY(4px);" : ""}">
      <!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"2.25rem","fontWeight":"800","letterSpacing":"-0.02em"},"color":{"text":"var:preset|color|${tints[i % 3]}"}}} -->
      <h3 class="wp-block-heading has-text-color" style="color:var(--wp--preset--color--${tints[i % 3]});font-size:2.25rem;font-weight:800;letter-spacing:-0.02em">${esc(s.value)}</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary","style":{"typography":{"fontWeight":"500"}}} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size" style="font-weight:500"><?php esc_html_e( '${esc(s.label)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Stats — Artistico
 * Slug: ${cat}/stats-artistico
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|30","left":"var:preset|spacing|30"}}}} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function statsFresco(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const pills = STATS_ITEMS.map(
    (s) => `    <!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"},"style":{"border":{"radius":"999px","width":"1px","color":"var:preset|color|border"},"spacing":{"padding":{"top":"10px","bottom":"10px","left":"20px","right":"20px"},"blockGap":"8px"},"color":{"background":"var:preset|color|surface"}}} -->
    <div class="wp-block-group has-background" style="border-color:var(--wp--preset--color--border);border-width:1px;border-radius:999px;background-color:var(--wp--preset--color--surface);padding-top:10px;padding-right:20px;padding-bottom:10px;padding-left:20px">
      <!-- wp:paragraph {"style":{"typography":{"fontSize":"1.375rem","fontWeight":"800"},"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
      <p style="margin-top:0;margin-bottom:0;font-size:1.375rem;font-weight:800">${esc(s.value)}</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-muted","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
      <p class="has-text-muted-color has-text-color has-sm-font-size" style="margin-top:0;margin-bottom:0"><?php esc_html_e( '${esc(s.label)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:group -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Stats — Fresco
 * Slug: ${cat}/stats-fresco
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<section class="wp-block-group alignfull">
  <!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"center"}} -->
  <div class="wp-block-group alignwide">
${pills}
  </div>
  <!-- /wp:group -->
</section>
<!-- /wp:group -->
`;
}

// ════════════════════════════════════════════════════════════════════════
// FEATURES
// ════════════════════════════════════════════════════════════════════════

const FEATURES_ITEMS = [
  { icon: "⚡", title: "Lightning fast", desc: "Built for speed with optimized rendering and smart caching." },
  { icon: "🛡️", title: "Fully secure", desc: "Enterprise-grade security with end-to-end encryption." },
  { icon: "🔗", title: "Easy integration", desc: "Connect with your favorite tools in just a few clicks." },
];

function featuresClassic(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const cols = FEATURES_ITEMS.map(
    (f) => `    <!-- wp:column {"style":{"color":{"background":"var:preset|color|background"},"border":{"radius":"var:custom|radius|lg","width":"1px","color":"var:preset|color|border"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}}} -->
    <div class="wp-block-column has-background" style="border-color:var(--wp--preset--color--border);border-width:1px;border-radius:var(--wp--custom--radius--lg);background-color:var(--wp--preset--color--background);padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
      <!-- wp:paragraph {"style":{"typography":{"fontSize":"1.5rem"},"spacing":{"margin":{"bottom":"var:preset|spacing|30"}}}} -->
      <p style="margin-bottom:var(--wp--preset--spacing--30);font-size:1.5rem">${f.icon}</p>
      <!-- /wp:paragraph -->
      <!-- wp:heading {"level":3,"fontSize":"lg"} -->
      <h3 class="wp-block-heading has-lg-font-size"><?php esc_html_e( '${esc(f.title)}', '${d}' ); ?></h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary"} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size"><?php esc_html_e( '${esc(f.desc)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Features — Classic
 * Slug: ${cat}/features-classic
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","backgroundColor":"surface","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull has-surface-background-color has-background">
  <!-- wp:heading {"level":2,"textAlign":"center","fontSize":"3xl","style":{"spacing":{"margin":{"bottom":"var:preset|spacing|50"}}}} -->
  <h2 class="wp-block-heading has-text-align-center has-3-xl-font-size" style="margin-bottom:var(--wp--preset--spacing--50)"><?php esc_html_e( 'Everything you need', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|40","left":"var:preset|spacing|40"}}}} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function featuresElegante(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const cols = FEATURES_ITEMS.map(
    (f, i) => `    <!-- wp:column {"style":{"border":{"right":${i < FEATURES_ITEMS.length - 1 ? "{\"color\":\"var:preset|color|border\",\"width\":\"1px\"}" : "{}"}},"spacing":{"padding":{"left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
    <div class="wp-block-column"${i < FEATURES_ITEMS.length - 1 ? " style=\"border-right-color:var(--wp--preset--color--border);border-right-width:1px;padding-left:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40)\"" : " style=\"padding-left:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40)\""}>
      <!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"2rem","fontWeight":"300","letterSpacing":"-0.01em"},"color":{"text":"var:preset|color|text-muted"},"spacing":{"margin":{"bottom":"var:preset|spacing|40"}}}} -->
      <h3 class="wp-block-heading has-text-color" style="color:var(--wp--preset--color--text-muted);margin-bottom:var(--wp--preset--spacing--40);font-size:2rem;font-weight:300;letter-spacing:-0.01em">${String(i + 1).padStart(2, "0")}</h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-muted","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.22em","fontSize":"0.6875rem","fontWeight":"600"},"spacing":{"margin":{"bottom":"var:preset|spacing|30"}}}} -->
      <p class="has-text-muted-color has-text-color has-sm-font-size" style="margin-bottom:var(--wp--preset--spacing--30);font-size:0.6875rem;font-weight:600;letter-spacing:0.22em;text-transform:uppercase"><?php esc_html_e( '${esc(f.title)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary","style":{"typography":{"lineHeight":"1.6"}}} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size" style="line-height:1.6"><?php esc_html_e( '${esc(f.desc)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Features — Elegante
 * Slug: ${cat}/features-elegante
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-muted","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.3em"},"spacing":{"margin":{"bottom":"var:preset|spacing|30"}}}} -->
  <p class="has-text-align-center has-text-muted-color has-text-color has-sm-font-size" style="margin-bottom:var(--wp--preset--spacing--30);text-transform:uppercase;letter-spacing:0.3em">— <?php esc_html_e( 'Features', '${d}' ); ?> —</p>
  <!-- /wp:paragraph -->
  <!-- wp:heading {"level":2,"textAlign":"center","style":{"typography":{"fontSize":"2rem","fontWeight":"400","letterSpacing":"-0.01em"},"spacing":{"margin":{"bottom":"var:preset|spacing|70"}}}} -->
  <h2 class="wp-block-heading has-text-align-center" style="margin-bottom:var(--wp--preset--spacing--70);font-size:2rem;font-weight:400;letter-spacing:-0.01em"><?php esc_html_e( 'What sets us apart', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"top":"0","left":"0"}}}} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function featuresArtistico(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const tints = ["primary", "secondary", "accent"];
  const cols = FEATURES_ITEMS.map(
    (f, i) => `    <!-- wp:column {"style":{"border":{"width":"2px","color":"var:preset|color|text","radius":"var:custom|radius|lg"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"color":{"background":"var:preset|color|background"}}} -->
    <div class="wp-block-column has-background" style="border-color:var(--wp--preset--color--text);border-width:2px;border-radius:var(--wp--custom--radius--lg);background-color:var(--wp--preset--color--background);padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40);transform:${i === 1 ? "rotate(1deg)" : "rotate(-1deg)"}">
      <!-- wp:paragraph {"style":{"color":{"background":"var:preset|color|${tints[i % 3]}"},"border":{"radius":"999px"},"spacing":{"padding":{"top":"8px","bottom":"8px","left":"0","right":"0"},"margin":{"bottom":"var:preset|spacing|30"}},"typography":{"fontSize":"1.25rem"},"dimensions":{"minHeight":"0px"}}} -->
      <p class="has-background" style="border-radius:999px;background-color:var(--wp--preset--color--${tints[i % 3]});margin-bottom:var(--wp--preset--spacing--30);padding-top:8px;padding-right:0;padding-bottom:8px;padding-left:0;font-size:1.25rem;width:48px;text-align:center">${f.icon}</p>
      <!-- /wp:paragraph -->
      <!-- wp:heading {"level":3,"fontSize":"lg","style":{"typography":{"fontWeight":"700"}}} -->
      <h3 class="wp-block-heading has-lg-font-size" style="font-weight:700"><?php esc_html_e( '${esc(f.title)}', '${d}' ); ?></h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary","style":{"typography":{"lineHeight":"1.6"}}} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size" style="line-height:1.6"><?php esc_html_e( '${esc(f.desc)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Features — Artistico
 * Slug: ${cat}/features-artistico
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":2,"textAlign":"center","style":{"typography":{"fontSize":"2.25rem","fontWeight":"800","letterSpacing":"-0.02em"},"spacing":{"margin":{"bottom":"var:preset|spacing|60"}}}} -->
  <h2 class="wp-block-heading has-text-align-center" style="margin-bottom:var(--wp--preset--spacing--60);font-size:2.25rem;font-weight:800;letter-spacing:-0.02em"><?php esc_html_e( 'Everything you need', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|40","left":"var:preset|spacing|40"}}}} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function featuresFresco(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const cols = FEATURES_ITEMS.map(
    (f) => `    <!-- wp:column {"style":{"color":{"background":"var:preset|color|surface"},"border":{"radius":"var:custom|radius|lg","width":"1px","color":"var:preset|color|border","top":{"color":"var:preset|color|primary","width":"4px"}},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"shadow":"var:preset|shadow|natural"}} -->
    <div class="wp-block-column has-background has-shadow" style="border-top-color:var(--wp--preset--color--primary);border-top-width:4px;border-right-color:var(--wp--preset--color--border);border-right-width:1px;border-bottom-color:var(--wp--preset--color--border);border-bottom-width:1px;border-left-color:var(--wp--preset--color--border);border-left-width:1px;border-radius:var(--wp--custom--radius--lg);background-color:var(--wp--preset--color--surface);padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
      <!-- wp:paragraph {"style":{"typography":{"fontSize":"1.25rem"},"spacing":{"margin":{"bottom":"var:preset|spacing|30"}}}} -->
      <p style="margin-bottom:var(--wp--preset--spacing--30);font-size:1.25rem">${f.icon}</p>
      <!-- /wp:paragraph -->
      <!-- wp:heading {"level":3,"fontSize":"md","style":{"typography":{"fontWeight":"700"}}} -->
      <h3 class="wp-block-heading has-md-font-size" style="font-weight:700"><?php esc_html_e( '${esc(f.title)}', '${d}' ); ?></h3>
      <!-- /wp:heading -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary"} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size"><?php esc_html_e( '${esc(f.desc)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Features — Fresco
 * Slug: ${cat}/features-fresco
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":2,"textAlign":"center","fontSize":"2xl","style":{"typography":{"fontWeight":"700"},"spacing":{"margin":{"bottom":"var:preset|spacing|50"}}}} -->
  <h2 class="wp-block-heading has-text-align-center has-2-xl-font-size" style="margin-bottom:var(--wp--preset--spacing--50);font-weight:700"><?php esc_html_e( 'Everything you need', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|30","left":"var:preset|spacing|30"}}}} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

// ════════════════════════════════════════════════════════════════════════
// REVIEWS
// ════════════════════════════════════════════════════════════════════════

const REVIEWS_ITEMS = [
  { name: "Sarah Chen", role: "Product Designer", initials: "SC", text: "This tool has completely changed how we approach design systems." },
  { name: "James Wilson", role: "Frontend Lead", initials: "JW", text: "Clean tokens, working pages, everything themed. It just works." },
  { name: "Maria Lopez", role: "CTO", text: "The ability to blend multiple inspirations is a game changer.", initials: "ML" },
];

function reviewsClassic(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const cols = REVIEWS_ITEMS.map(
    (r) => `    <!-- wp:column {"style":{"color":{"background":"var:preset|color|surface"},"border":{"width":"1px","color":"var:preset|color|border","radius":"var:custom|radius|lg"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}}} -->
    <div class="wp-block-column has-background" style="border-color:var(--wp--preset--color--border);border-width:1px;border-radius:var(--wp--custom--radius--lg);background-color:var(--wp--preset--color--surface);padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
      <!-- wp:paragraph {"style":{"typography":{"fontSize":"0.875rem"},"color":{"text":"var:preset|color|accent"},"spacing":{"margin":{"bottom":"var:preset|spacing|30"}}}} -->
      <p class="has-text-color" style="color:var(--wp--preset--color--accent);margin-bottom:var(--wp--preset--spacing--30);font-size:0.875rem">★★★★★</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary","style":{"typography":{"lineHeight":"1.6"},"spacing":{"margin":{"bottom":"var:preset|spacing|30"}}}} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size" style="margin-bottom:var(--wp--preset--spacing--30);line-height:1.6">&ldquo;<?php esc_html_e( '${esc(r.text)}', '${d}' ); ?>&rdquo;</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","style":{"typography":{"fontWeight":"600"},"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
      <p class="has-sm-font-size" style="margin-top:0;margin-bottom:0;font-weight:600">${esc(r.name)}</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-muted","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
      <p class="has-text-muted-color has-text-color has-sm-font-size" style="margin-top:0;margin-bottom:0">${esc(r.role)}</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Reviews — Classic
 * Slug: ${cat}/reviews-classic
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":2,"textAlign":"center","fontSize":"2xl","style":{"spacing":{"margin":{"bottom":"var:preset|spacing|50"}}}} -->
  <h2 class="wp-block-heading has-text-align-center has-2-xl-font-size" style="margin-bottom:var(--wp--preset--spacing--50)"><?php esc_html_e( 'What our users say', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|30","left":"var:preset|spacing|30"}}}} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function reviewsElegante(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const top = REVIEWS_ITEMS[0];
  return `<?php
/**
 * Title: Reviews — Elegante
 * Slug: ${cat}/reviews-elegante
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained","contentSize":"720px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-muted","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.3em"},"spacing":{"margin":{"bottom":"var:preset|spacing|40"}}}} -->
  <p class="has-text-align-center has-text-muted-color has-text-color has-sm-font-size" style="margin-bottom:var(--wp--preset--spacing--40);text-transform:uppercase;letter-spacing:0.3em">— <?php esc_html_e( 'Testimonial', '${d}' ); ?> —</p>
  <!-- /wp:paragraph -->
  <!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"5rem","fontWeight":"300","lineHeight":"1"},"color":{"text":"var:preset|color|text-muted"},"spacing":{"margin":{"top":"0","bottom":"var:preset|spacing|30"}}}} -->
  <p class="has-text-align-center has-text-color" style="color:var(--wp--preset--color--text-muted);margin-top:0;margin-bottom:var(--wp--preset--spacing--30);font-size:5rem;font-weight:300;line-height:1">&ldquo;</p>
  <!-- /wp:paragraph -->
  <!-- wp:paragraph {"align":"center","style":{"typography":{"fontSize":"1.5rem","lineHeight":"1.5","fontWeight":"400"}}} -->
  <p class="has-text-align-center" style="font-size:1.5rem;font-weight:400;line-height:1.5"><?php esc_html_e( '${esc(top.text)}', '${d}' ); ?></p>
  <!-- /wp:paragraph -->
  <!-- wp:group {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|40"}}}} -->
  <div class="wp-block-group" style="margin-top:var(--wp--preset--spacing--60);margin-bottom:var(--wp--preset--spacing--40)">
    <!-- wp:separator {"backgroundColor":"text-muted","style":{"layout":{"selfStretch":"fixed","flexSize":"60px"}}} -->
    <hr class="wp-block-separator has-text-color has-text-muted-color has-alpha-channel-opacity has-text-muted-background-color has-background"/>
    <!-- /wp:separator -->
  </div>
  <!-- /wp:group -->
  <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-secondary","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.15em","fontWeight":"500"}}} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color has-sm-font-size" style="text-transform:uppercase;letter-spacing:0.15em;font-weight:500">${esc(top.name)} · ${esc(top.role)}</p>
  <!-- /wp:paragraph -->
</section>
<!-- /wp:group -->
`;
}

function reviewsArtistico(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const tints = ["primary", "secondary", "accent"];
  const cols = REVIEWS_ITEMS.map(
    (r, i) => `    <!-- wp:column {"style":{"color":{"background":"var:preset|color|surface"},"border":{"width":"2px","color":"var:preset|color|text","radius":"var:custom|radius|lg"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}}}} -->
    <div class="wp-block-column has-background" style="border-color:var(--wp--preset--color--text);border-width:2px;border-radius:var(--wp--custom--radius--lg);background-color:var(--wp--preset--color--surface);padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40);transform:${i === 1 ? "translateY(32px)" : i === 2 ? "translateY(-12px)" : "none"}">
      <!-- wp:paragraph {"style":{"typography":{"fontSize":"3rem","lineHeight":"1","fontWeight":"900"},"color":{"text":"var:preset|color|${tints[i % 3]}"},"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
      <p class="has-text-color" style="color:var(--wp--preset--color--${tints[i % 3]});margin-top:0;margin-bottom:0;font-size:3rem;font-weight:900;line-height:1">&ldquo;</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary","style":{"typography":{"lineHeight":"1.6"},"spacing":{"margin":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|40"}}}} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size" style="margin-top:var(--wp--preset--spacing--20);margin-bottom:var(--wp--preset--spacing--40);line-height:1.6"><?php esc_html_e( '${esc(r.text)}', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"style":{"typography":{"fontWeight":"700"},"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
      <p style="margin-top:0;margin-bottom:0;font-weight:700">${esc(r.name)}</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-muted","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
      <p class="has-text-muted-color has-text-color has-sm-font-size" style="margin-top:0;margin-bottom:0">${esc(r.role)}</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Reviews — Artistico
 * Slug: ${cat}/reviews-artistico
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":2,"textAlign":"center","style":{"typography":{"fontSize":"2.25rem","fontWeight":"800","letterSpacing":"-0.02em"},"spacing":{"margin":{"bottom":"var:preset|spacing|60"}}}} -->
  <h2 class="wp-block-heading has-text-align-center" style="margin-bottom:var(--wp--preset--spacing--60);font-size:2.25rem;font-weight:800;letter-spacing:-0.02em"><?php esc_html_e( 'What our users say', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|40","left":"var:preset|spacing|40"}}}} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

function reviewsFresco(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const cols = REVIEWS_ITEMS.map(
    (r) => `    <!-- wp:column {"style":{"color":{"background":"var:preset|color|background"},"border":{"width":"1px","color":"var:preset|color|border","radius":"var:custom|radius|lg"},"spacing":{"padding":{"top":"var:preset|spacing|40","right":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40"}},"shadow":"var:preset|shadow|natural"}} -->
    <div class="wp-block-column has-background has-shadow" style="border-color:var(--wp--preset--color--border);border-width:1px;border-radius:var(--wp--custom--radius--lg);background-color:var(--wp--preset--color--background);padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
      <!-- wp:paragraph {"style":{"typography":{"fontSize":"0.875rem"},"color":{"text":"var:preset|color|accent"},"spacing":{"margin":{"bottom":"var:preset|spacing|30"}}}} -->
      <p class="has-text-color" style="color:var(--wp--preset--color--accent);margin-bottom:var(--wp--preset--spacing--30);font-size:0.875rem">★★★★★</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-secondary","style":{"typography":{"lineHeight":"1.6"},"spacing":{"margin":{"bottom":"var:preset|spacing|40"}}}} -->
      <p class="has-text-secondary-color has-text-color has-sm-font-size" style="margin-bottom:var(--wp--preset--spacing--40);line-height:1.6">${esc(r.text)}</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","style":{"typography":{"fontWeight":"600"},"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
      <p class="has-sm-font-size" style="margin-top:0;margin-bottom:0;font-weight:600">${esc(r.name)}</p>
      <!-- /wp:paragraph -->
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-muted","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
      <p class="has-text-muted-color has-text-color has-sm-font-size" style="margin-top:0;margin-bottom:0">${esc(r.role)}</p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->`,
  ).join("\n");
  return `<?php
/**
 * Title: Reviews — Fresco
 * Slug: ${cat}/reviews-fresco
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","backgroundColor":"surface","layout":{"type":"constrained"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull has-surface-background-color has-background">
  <!-- wp:heading {"level":2,"textAlign":"center","fontSize":"2xl","style":{"typography":{"fontWeight":"700"},"spacing":{"margin":{"bottom":"var:preset|spacing|50"}}}} -->
  <h2 class="wp-block-heading has-text-align-center has-2-xl-font-size" style="margin-bottom:var(--wp--preset--spacing--50);font-weight:700"><?php esc_html_e( 'Loved by teams', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:columns {"align":"wide","style":{"spacing":{"blockGap":{"top":"var:preset|spacing|30","left":"var:preset|spacing|30"}}}} -->
  <div class="wp-block-columns alignwide">
${cols}
  </div>
  <!-- /wp:columns -->
</section>
<!-- /wp:group -->
`;
}

// ════════════════════════════════════════════════════════════════════════
// CTA
// ════════════════════════════════════════════════════════════════════════

function ctaClassic(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const cta = esc(ctx.tokens.microcopy?.ctaLabels?.[1] || ctx.tokens.microcopy?.ctaLabels?.[0] || "Subscribe");
  return `<?php
/**
 * Title: CTA — Classic
 * Slug: ${cat}/cta-classic
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained","contentSize":"640px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:heading {"level":2,"textAlign":"center","fontSize":"2xl","style":{"spacing":{"margin":{"bottom":"var:preset|spacing|30"}}}} -->
  <h2 class="wp-block-heading has-text-align-center has-2-xl-font-size" style="margin-bottom:var(--wp--preset--spacing--30)"><?php esc_html_e( 'Ready to get started?', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-secondary","style":{"spacing":{"margin":{"bottom":"var:preset|spacing|40"}}}} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color has-sm-font-size" style="margin-bottom:var(--wp--preset--spacing--40)"><?php esc_html_e( 'Join thousands of teams already building with us.', '${d}' ); ?></p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"backgroundColor":"primary","textColor":"background","style":{"border":{"radius":"var:custom|radius|md"}}} -->
    <div class="wp-block-button"><a class="wp-block-button__link has-background-color has-primary-background-color has-text-color has-background wp-element-button" style="border-radius:var(--wp--custom--radius--md)"><?php esc_html_e( '${cta}', '${d}' ); ?></a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</section>
<!-- /wp:group -->
`;
}

function ctaElegante(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  return `<?php
/**
 * Title: CTA — Elegante
 * Slug: ${cat}/cta-elegante
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","layout":{"type":"constrained","contentSize":"560px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull">
  <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-muted","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.3em"},"spacing":{"margin":{"bottom":"var:preset|spacing|30"}}}} -->
  <p class="has-text-align-center has-text-muted-color has-text-color has-sm-font-size" style="margin-bottom:var(--wp--preset--spacing--30);text-transform:uppercase;letter-spacing:0.3em">— <?php esc_html_e( 'Join us', '${d}' ); ?> —</p>
  <!-- /wp:paragraph -->
  <!-- wp:heading {"level":2,"textAlign":"center","style":{"typography":{"fontSize":"2.5rem","fontWeight":"400","letterSpacing":"-0.01em"}}} -->
  <h2 class="wp-block-heading has-text-align-center" style="font-size:2.5rem;font-weight:400;letter-spacing:-0.01em"><?php esc_html_e( 'Begin the journey', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","fontSize":"md","textColor":"text-secondary","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|60"}}}} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color has-md-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:var(--wp--preset--spacing--60)"><?php esc_html_e( 'Join a community of makers shipping remarkable work.', '${d}' ); ?></p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"className":"is-style-outline","style":{"border":{"radius":"0","width":"1px"},"typography":{"textTransform":"uppercase","letterSpacing":"0.22em","fontSize":"0.75rem"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"32px","right":"32px"}}}} -->
    <div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" style="border-width:1px;border-radius:0;padding-top:14px;padding-right:32px;padding-bottom:14px;padding-left:32px;font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase"><?php esc_html_e( 'Subscribe', '${d}' ); ?> →</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</section>
<!-- /wp:group -->
`;
}

function ctaArtistico(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  return `<?php
/**
 * Title: CTA — Artistico
 * Slug: ${cat}/cta-artistico
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","gradient":"primary-to-secondary","layout":{"type":"constrained","contentSize":"680px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<section class="wp-block-group alignfull has-primary-to-secondary-gradient-background has-background">
  <!-- wp:heading {"level":2,"textAlign":"center","textColor":"background","style":{"typography":{"fontSize":"clamp(2rem,5vw,2.75rem)","fontWeight":"800","letterSpacing":"-0.02em"}}} -->
  <h2 class="wp-block-heading has-text-align-center has-background-color has-text-color" style="font-size:clamp(2rem,5vw,2.75rem);font-weight:800;letter-spacing:-0.02em"><?php esc_html_e( 'Ready to get started?', '${d}' ); ?></h2>
  <!-- /wp:heading -->
  <!-- wp:paragraph {"align":"center","textColor":"background","fontSize":"lg","style":{"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|60"}}}} -->
  <p class="has-text-align-center has-background-color has-text-color has-lg-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:var(--wp--preset--spacing--60);opacity:.92"><?php esc_html_e( 'Join thousands of teams already building with us.', '${d}' ); ?></p>
  <!-- /wp:paragraph -->
  <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-buttons">
    <!-- wp:button {"backgroundColor":"text","textColor":"background","style":{"border":{"radius":"999px"},"typography":{"fontWeight":"700"},"spacing":{"padding":{"top":"14px","bottom":"14px","left":"32px","right":"32px"}}}} -->
    <div class="wp-block-button"><a class="wp-block-button__link has-background-color has-text-background-color has-text-color has-background wp-element-button" style="border-radius:999px;padding-top:14px;padding-right:32px;padding-bottom:14px;padding-left:32px;font-weight:700"><?php esc_html_e( 'Get Started', '${d}' ); ?> ✦</a></div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</section>
<!-- /wp:group -->
`;
}

function ctaFresco(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  return `<?php
/**
 * Title: CTA — Fresco
 * Slug: ${cat}/cta-fresco
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"section","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<section class="wp-block-group alignfull">
  <!-- wp:group {"align":"wide","gradient":"primary-to-secondary","style":{"border":{"radius":"var:custom|radius|lg"},"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}},"shadow":"var:preset|shadow|deep"},"layout":{"type":"constrained","contentSize":"640px"}} -->
  <div class="wp-block-group alignwide has-primary-to-secondary-gradient-background has-background has-shadow" style="border-radius:var(--wp--custom--radius--lg);padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--40)">
    <!-- wp:heading {"level":2,"textAlign":"center","textColor":"background","fontSize":"2xl","style":{"typography":{"fontWeight":"700"}}} -->
    <h2 class="wp-block-heading has-text-align-center has-background-color has-text-color has-2-xl-font-size" style="font-weight:700"><?php esc_html_e( 'Start free today 🚀', '${d}' ); ?></h2>
    <!-- /wp:heading -->
    <!-- wp:paragraph {"align":"center","textColor":"background","fontSize":"sm","style":{"spacing":{"margin":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|50"}}}} -->
    <p class="has-text-align-center has-background-color has-text-color has-sm-font-size" style="margin-top:var(--wp--preset--spacing--20);margin-bottom:var(--wp--preset--spacing--50);opacity:.92"><?php esc_html_e( 'No credit card, no tricks. Just free forever.', '${d}' ); ?></p>
    <!-- /wp:paragraph -->
    <!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
    <div class="wp-block-buttons">
      <!-- wp:button {"backgroundColor":"background","textColor":"text","style":{"border":{"radius":"999px"},"typography":{"fontWeight":"700"}}} -->
      <div class="wp-block-button"><a class="wp-block-button__link has-text-color has-text-color has-background-background-color has-background wp-element-button" style="border-radius:999px;font-weight:700"><?php esc_html_e( 'Start free', '${d}' ); ?></a></div>
      <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->
  </div>
  <!-- /wp:group -->
</section>
<!-- /wp:group -->
`;
}

// ════════════════════════════════════════════════════════════════════════
// FOOTER (as site footer part — 4 variants)
// ════════════════════════════════════════════════════════════════════════

function footerClassic(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const brand = localLogoMarkup(ctx, { size: 32 });
  return `<?php
/**
 * Title: Footer — Classic
 * Slug: ${cat}/footer-classic
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"footer","align":"full","backgroundColor":"surface","style":{"border":{"top":{"color":"var:preset|color|border","width":"1px"}},"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<footer class="wp-block-group alignfull has-surface-background-color has-background" style="border-top-color:var(--wp--preset--color--border);border-top-width:1px;padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
  <!-- wp:columns {"align":"wide"} -->
  <div class="wp-block-columns alignwide">
    <!-- wp:column {"width":"40%"} -->
    <div class="wp-block-column" style="flex-basis:40%">
      ${brand}
      <!-- wp:paragraph {"fontSize":"sm","textColor":"text-muted","style":{"spacing":{"margin":{"top":"var:preset|spacing|20"}}}} -->
      <p class="has-text-muted-color has-text-color has-sm-font-size" style="margin-top:var(--wp--preset--spacing--20)"><?php esc_html_e( 'Building the future, one pixel at a time.', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":4,"fontSize":"sm","style":{"typography":{"fontWeight":"600"}}} -->
      <h4 class="wp-block-heading has-sm-font-size" style="font-weight:600"><?php esc_html_e( 'Product', '${d}' ); ?></h4>
      <!-- /wp:heading -->
      <!-- wp:list {"fontSize":"sm","textColor":"text-muted","style":{"list-style":"none"}} -->
      <ul class="has-text-muted-color has-text-color has-sm-font-size"><li>Features</li><li>Pricing</li><li>Changelog</li></ul>
      <!-- /wp:list -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":4,"fontSize":"sm","style":{"typography":{"fontWeight":"600"}}} -->
      <h4 class="wp-block-heading has-sm-font-size" style="font-weight:600"><?php esc_html_e( 'Company', '${d}' ); ?></h4>
      <!-- /wp:heading -->
      <!-- wp:list {"fontSize":"sm","textColor":"text-muted"} -->
      <ul class="has-text-muted-color has-text-color has-sm-font-size"><li>About</li><li>Blog</li><li>Contact</li></ul>
      <!-- /wp:list -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":4,"fontSize":"sm","style":{"typography":{"fontWeight":"600"}}} -->
      <h4 class="wp-block-heading has-sm-font-size" style="font-weight:600"><?php esc_html_e( 'Legal', '${d}' ); ?></h4>
      <!-- /wp:heading -->
      <!-- wp:list {"fontSize":"sm","textColor":"text-muted"} -->
      <ul class="has-text-muted-color has-text-color has-sm-font-size"><li>Privacy</li><li>Terms</li><li>Cookies</li></ul>
      <!-- /wp:list -->
    </div>
    <!-- /wp:column -->
  </div>
  <!-- /wp:columns -->
</footer>
<!-- /wp:group -->
`;
}

function footerElegante(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const brand = localLogoMarkup(ctx, { size: 28 });
  return `<?php
/**
 * Title: Footer — Elegante
 * Slug: ${cat}/footer-elegante
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"footer","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained","contentSize":"720px"}} -->
<footer class="wp-block-group alignfull">
  <!-- wp:group {"layout":{"type":"flex","justifyContent":"center"}} -->
  <div class="wp-block-group">${brand}</div>
  <!-- /wp:group -->
  <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-muted","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.22em"},"spacing":{"margin":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|40"}}}} -->
  <p class="has-text-align-center has-text-muted-color has-text-color has-sm-font-size" style="margin-top:var(--wp--preset--spacing--30);margin-bottom:var(--wp--preset--spacing--40);text-transform:uppercase;letter-spacing:0.22em"><?php esc_html_e( 'Crafted with care', '${d}' ); ?></p>
  <!-- /wp:paragraph -->
  <!-- wp:group {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"bottom":"var:preset|spacing|40"}}}} -->
  <div class="wp-block-group" style="margin-bottom:var(--wp--preset--spacing--40)">
    <!-- wp:separator {"backgroundColor":"border","style":{"layout":{"selfStretch":"fixed","flexSize":"80px"}}} -->
    <hr class="wp-block-separator has-text-color has-border-color has-alpha-channel-opacity has-border-background-color has-background"/>
    <!-- /wp:separator -->
  </div>
  <!-- /wp:group -->
  <!-- wp:paragraph {"align":"center","fontSize":"sm","textColor":"text-secondary","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.22em"}}} -->
  <p class="has-text-align-center has-text-secondary-color has-text-color has-sm-font-size" style="text-transform:uppercase;letter-spacing:0.22em">Product · Features · Pricing · About · Contact</p>
  <!-- /wp:paragraph -->
</footer>
<!-- /wp:group -->
`;
}

function footerArtistico(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const brand = localLogoMarkup(ctx, { size: 36 });
  return `<?php
/**
 * Title: Footer — Artistico
 * Slug: ${cat}/footer-artistico
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"footer","align":"full","backgroundColor":"text","textColor":"background","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<footer class="wp-block-group alignfull has-background-color has-text-background-color has-text-color has-background">
  <!-- wp:columns {"align":"wide"} -->
  <div class="wp-block-columns alignwide">
    <!-- wp:column {"width":"40%"} -->
    <div class="wp-block-column" style="flex-basis:40%">
      ${brand}
      <!-- wp:paragraph {"fontSize":"sm","style":{"spacing":{"margin":{"top":"var:preset|spacing|20"}}}} -->
      <p class="has-sm-font-size" style="margin-top:var(--wp--preset--spacing--20);opacity:.7"><?php esc_html_e( 'We ship beautiful things.', '${d}' ); ?></p>
      <!-- /wp:paragraph -->
      <!-- wp:group {"layout":{"type":"flex"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|30"}}}} -->
      <div class="wp-block-group" style="margin-top:var(--wp--preset--spacing--30)">
        <!-- wp:paragraph {"style":{"color":{"background":"var:preset|color|primary"},"border":{"radius":"999px"},"dimensions":{"minHeight":"32px"},"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
        <p class="has-background" style="border-radius:999px;background-color:var(--wp--preset--color--primary);margin-top:0;margin-bottom:0;min-height:32px;width:32px"></p>
        <!-- /wp:paragraph -->
        <!-- wp:paragraph {"style":{"color":{"background":"var:preset|color|secondary"},"border":{"radius":"999px"},"dimensions":{"minHeight":"32px"},"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
        <p class="has-background" style="border-radius:999px;background-color:var(--wp--preset--color--secondary);margin-top:0;margin-bottom:0;min-height:32px;width:32px"></p>
        <!-- /wp:paragraph -->
        <!-- wp:paragraph {"style":{"color":{"background":"var:preset|color|accent"},"border":{"radius":"999px"},"dimensions":{"minHeight":"32px"},"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
        <p class="has-background" style="border-radius:999px;background-color:var(--wp--preset--color--accent);margin-top:0;margin-bottom:0;min-height:32px;width:32px"></p>
        <!-- /wp:paragraph -->
      </div>
      <!-- /wp:group -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":4,"fontSize":"sm","textColor":"accent","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.22em","fontWeight":"700"}}} -->
      <h4 class="wp-block-heading has-accent-color has-text-color has-sm-font-size" style="text-transform:uppercase;letter-spacing:0.22em;font-weight:700"><?php esc_html_e( 'Product', '${d}' ); ?></h4>
      <!-- /wp:heading -->
      <!-- wp:list {"fontSize":"sm"} --><ul class="has-sm-font-size" style="opacity:.8"><li>Features</li><li>Pricing</li><li>Changelog</li></ul><!-- /wp:list -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":4,"fontSize":"sm","textColor":"accent","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.22em","fontWeight":"700"}}} -->
      <h4 class="wp-block-heading has-accent-color has-text-color has-sm-font-size" style="text-transform:uppercase;letter-spacing:0.22em;font-weight:700"><?php esc_html_e( 'Company', '${d}' ); ?></h4>
      <!-- /wp:heading -->
      <!-- wp:list {"fontSize":"sm"} --><ul class="has-sm-font-size" style="opacity:.8"><li>About</li><li>Blog</li><li>Contact</li></ul><!-- /wp:list -->
    </div>
    <!-- /wp:column -->
    <!-- wp:column -->
    <div class="wp-block-column">
      <!-- wp:heading {"level":4,"fontSize":"sm","textColor":"accent","style":{"typography":{"textTransform":"uppercase","letterSpacing":"0.22em","fontWeight":"700"}}} -->
      <h4 class="wp-block-heading has-accent-color has-text-color has-sm-font-size" style="text-transform:uppercase;letter-spacing:0.22em;font-weight:700"><?php esc_html_e( 'Legal', '${d}' ); ?></h4>
      <!-- /wp:heading -->
      <!-- wp:list {"fontSize":"sm"} --><ul class="has-sm-font-size" style="opacity:.8"><li>Privacy</li><li>Terms</li><li>Cookies</li></ul><!-- /wp:list -->
    </div>
    <!-- /wp:column -->
  </div>
  <!-- /wp:columns -->
</footer>
<!-- /wp:group -->
`;
}

function footerFresco(ctx: PatternContext): string {
  const d = textDomain(ctx.designSlug);
  const cat = slugDashed(ctx.designSlug);
  const brand = localLogoMarkup(ctx, { size: 26 });
  return `<?php
/**
 * Title: Footer — Fresco
 * Slug: ${cat}/footer-fresco
 * Categories: ${cat}
 * Inserter: no
 */
?>
<!-- wp:group {"tagName":"footer","align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<footer class="wp-block-group alignfull">
  <!-- wp:group {"align":"wide","backgroundColor":"surface","style":{"border":{"radius":"var:custom|radius|lg","width":"1px","color":"var:preset|color|border","top":{"color":"var:preset|color|primary","width":"4px"}},"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}},"shadow":"var:preset|shadow|natural"}} -->
  <div class="wp-block-group alignwide has-surface-background-color has-background has-shadow" style="border-top-color:var(--wp--preset--color--primary);border-top-width:4px;border-right-color:var(--wp--preset--color--border);border-right-width:1px;border-bottom-color:var(--wp--preset--color--border);border-bottom-width:1px;border-left-color:var(--wp--preset--color--border);border-left-width:1px;border-radius:var(--wp--custom--radius--lg);padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--50)">
    <!-- wp:columns -->
    <div class="wp-block-columns">
      <!-- wp:column {"width":"40%"} -->
      <div class="wp-block-column" style="flex-basis:40%">
        ${brand}
        <!-- wp:paragraph {"fontSize":"sm","textColor":"text-muted","style":{"spacing":{"margin":{"top":"var:preset|spacing|20"}}}} -->
        <p class="has-text-muted-color has-text-color has-sm-font-size" style="margin-top:var(--wp--preset--spacing--20)"><?php esc_html_e( 'Made with ❤️ for teams that ship.', '${d}' ); ?></p>
        <!-- /wp:paragraph -->
      </div>
      <!-- /wp:column -->
      <!-- wp:column --><div class="wp-block-column">
        <!-- wp:heading {"level":4,"fontSize":"sm","style":{"typography":{"fontWeight":"700"}}} --><h4 class="wp-block-heading has-sm-font-size" style="font-weight:700">• Product</h4><!-- /wp:heading -->
        <!-- wp:list {"fontSize":"sm","textColor":"text-muted"} --><ul class="has-text-muted-color has-text-color has-sm-font-size"><li>Features</li><li>Pricing</li><li>Changelog</li></ul><!-- /wp:list -->
      </div><!-- /wp:column -->
      <!-- wp:column --><div class="wp-block-column">
        <!-- wp:heading {"level":4,"fontSize":"sm","style":{"typography":{"fontWeight":"700"}}} --><h4 class="wp-block-heading has-sm-font-size" style="font-weight:700">• Company</h4><!-- /wp:heading -->
        <!-- wp:list {"fontSize":"sm","textColor":"text-muted"} --><ul class="has-text-muted-color has-text-color has-sm-font-size"><li>About</li><li>Blog</li><li>Contact</li></ul><!-- /wp:list -->
      </div><!-- /wp:column -->
    </div>
    <!-- /wp:columns -->
  </div>
  <!-- /wp:group -->
</footer>
<!-- /wp:group -->
`;
}

// ════════════════════════════════════════════════════════════════════════
// Public API
// ════════════════════════════════════════════════════════════════════════

type Section = "hero" | "stats" | "features" | "reviews" | "cta" | "footer";

const BUILDERS: Record<Section, Record<SectionVariant, (ctx: PatternContext) => string>> = {
  hero: { classic: heroClassic, elegante: heroElegante, artistico: heroArtistico, fresco: heroFresco },
  stats: { classic: statsClassic, elegante: statsElegante, artistico: statsArtistico, fresco: statsFresco },
  features: { classic: featuresClassic, elegante: featuresElegante, artistico: featuresArtistico, fresco: featuresFresco },
  reviews: { classic: reviewsClassic, elegante: reviewsElegante, artistico: reviewsArtistico, fresco: reviewsFresco },
  cta: { classic: ctaClassic, elegante: ctaElegante, artistico: ctaArtistico, fresco: ctaFresco },
  footer: { classic: footerClassic, elegante: footerElegante, artistico: footerArtistico, fresco: footerFresco },
};

export const ALL_SECTIONS: Section[] = ["hero", "stats", "features", "reviews", "cta", "footer"];
export const ALL_VARIANTS: SectionVariant[] = ["classic", "elegante", "artistico", "fresco"];

/** Build a single pattern file. */
export function buildPatternFile(
  section: Section,
  variant: SectionVariant,
  ctx: PatternContext,
): { path: string; content: string } {
  const content = BUILDERS[section][variant](ctx);
  return {
    path: `patterns/${section}-${variant}.php`,
    content,
  };
}

/** Build all 24 patterns (6 sections × 4 variants). */
export function buildAllPatternFiles(ctx: PatternContext): Array<{ path: string; content: string }> {
  const out: Array<{ path: string; content: string }> = [];
  for (const section of ALL_SECTIONS) {
    for (const variant of ALL_VARIANTS) {
      out.push(buildPatternFile(section, variant, ctx));
    }
  }
  return out;
}

// Ensure the unused helpers are at least referenced (belts-and-braces for dead-code warnings).
void sectionHeader;

/**
 * Elementor Kit generator.
 *
 * Produces a native Elementor Import/Export Kit (.zip) from Ditto's extracted
 * tokens. Users install Elementor (free or pro) and import via
 * Tools → Import/Export Kit.
 *
 * The kit contains:
 *   • manifest.json — declares what's in the kit
 *   • site-settings.json — global colors + global typography + default layout
 *   • templates/*.json — 4 section templates (hero, features, cta, pricing)
 */

import type { ResolvedDesign, DesignTokens } from "../types";
import { onPrimaryColor } from "./wp-shared";

export interface ElementorKitFile {
  path: string;
  content: string | Uint8Array;
}

export interface GenerateElementorKitOptions {
  designName: string;
  designSlug: string;
  designUrl?: string;
  resolved: ResolvedDesign;
  tokens: DesignTokens;
  authorName?: string;
}

/** Deterministic 7-char-ish id generator (Elementor uses short ids like "abc1234"). */
function makeIdFactory(seed: string) {
  let counter = 0;
  return () => {
    counter += 1;
    const raw = `${seed}-${counter}`;
    // FNV-1a 32-bit, rendered as 7-char base36
    let h = 2166136261;
    for (let i = 0; i < raw.length; i++) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36).padStart(7, "0").slice(0, 7);
  };
}

function parsePx(s: string, fallback: number): number {
  const m = s.match(/^(-?\d+(?:\.\d+)?)(px)?$/);
  return m ? Math.round(parseFloat(m[1])) : fallback;
}

// ── manifest.json ──────────────────────────────────────────────────────

function buildManifest(opts: GenerateElementorKitOptions, templateIds: Record<string, string>): string {
  const { designName, designSlug, designUrl, authorName } = opts;
  const templates: Record<string, object> = {};
  for (const [slug, id] of Object.entries(templateIds)) {
    templates[id] = {
      id,
      title: slug.replace(/^./, (c) => c.toUpperCase()).replace(/-/g, " "),
      doc_type: "section",
      thumbnail: "",
      url: "",
    };
  }
  const manifest = {
    name: designSlug,
    title: `${designName} — Ditto Kit`,
    description: `Design system extracted from ${designUrl ?? "a source site"} by Ditto.`,
    author: authorName ?? "Ditto",
    version: "1.0.0",
    elementor_version: "3.20.0",
    created: new Date().toISOString(),
    thumbnail: "",
    "site-settings": {},
    templates,
    content: { page: {} },
  };
  return JSON.stringify(manifest, null, 2);
}

// ── site-settings.json ─────────────────────────────────────────────────

function buildSiteSettings(opts: GenerateElementorKitOptions): string {
  const { resolved } = opts;
  const idFactory = makeIdFactory(`${opts.designSlug}-settings`);

  const systemColors = [
    { _id: "primary", title: "Primary", color: resolved.colorPrimary },
    { _id: "secondary", title: "Secondary", color: resolved.colorSecondary },
    { _id: "text", title: "Text", color: resolved.colorTextPrimary },
    { _id: "accent", title: "Accent", color: resolved.colorAccent },
  ];

  const customColors = [
    { _id: idFactory(), title: "Background", color: resolved.colorBackground },
    { _id: idFactory(), title: "Surface", color: resolved.colorSurface },
    { _id: idFactory(), title: "Text Secondary", color: resolved.colorTextSecondary },
    { _id: idFactory(), title: "Text Muted", color: resolved.colorTextMuted },
    { _id: idFactory(), title: "Border", color: resolved.colorBorder },
    { _id: idFactory(), title: "Success", color: resolved.colorSuccess },
    { _id: idFactory(), title: "Warning", color: resolved.colorWarning },
    { _id: idFactory(), title: "Error", color: resolved.colorError },
  ];

  const typographyBase = (fontFamily: string, weight: number | string) => ({
    typography_typography: "custom",
    typography_font_family: fontFamily,
    typography_font_weight: String(weight),
  });

  const systemTypography = [
    { _id: "primary", title: "Primary", ...typographyBase(resolved.fontHeading, resolved.fontWeightHeading) },
    { _id: "secondary", title: "Secondary", ...typographyBase(resolved.fontHeading, 600) },
    { _id: "text", title: "Text", ...typographyBase(resolved.fontBody, resolved.fontWeightBody) },
    { _id: "accent", title: "Accent", ...typographyBase(resolved.fontBody, 500) },
  ];

  const radiusMd = parsePx(resolved.radiusMd, 8);

  const siteSettings = {
    settings: {
      system_colors: systemColors,
      custom_colors: customColors,
      system_typography: systemTypography,
      custom_typography: [],
      default_generic_fonts: "Sans-serif",
      site_name: opts.designName,
      site_description: opts.designUrl ?? "",
      container_width: { unit: "px", size: 1140, sizes: [] },
      space_between_widgets: { unit: "px", size: 20, sizes: [] },
      page_title_selector: "h1.entry-title",
      stretched_section_container: "body",
      global_image_lightbox: "yes",
      // Button global defaults
      button_typography_typography: "custom",
      button_typography_font_family: resolved.fontBody,
      button_typography_font_weight: "500",
      button_text_color: onPrimaryColor(resolved.colorPrimary, resolved.colorTextPrimary),
      button_background_color: resolved.colorPrimary,
      button_hover_background_color: resolved.colorAccent,
      button_border_radius: {
        unit: "px",
        top: radiusMd,
        right: radiusMd,
        bottom: radiusMd,
        left: radiusMd,
        isLinked: true,
      },
      button_padding: {
        unit: "px",
        top: 10,
        right: 20,
        bottom: 10,
        left: 20,
        isLinked: false,
      },
      // Global body typography
      body_typography_typography: "custom",
      body_typography_font_family: resolved.fontBody,
      body_typography_font_weight: String(resolved.fontWeightBody),
      body_color: resolved.colorTextPrimary,
      body_background_color: resolved.colorBackground,
      // H1..H6
      h1_typography_typography: "custom",
      h1_typography_font_family: resolved.fontHeading,
      h1_typography_font_weight: String(resolved.fontWeightHeading),
      h2_typography_typography: "custom",
      h2_typography_font_family: resolved.fontHeading,
      h2_typography_font_weight: String(resolved.fontWeightHeading),
      h3_typography_typography: "custom",
      h3_typography_font_family: resolved.fontHeading,
      h3_typography_font_weight: String(resolved.fontWeightHeading),
    },
  };

  return JSON.stringify(siteSettings, null, 2);
}

// ── Templates ──────────────────────────────────────────────────────────

interface ElementorWidget {
  id: string;
  elType: string;
  settings: Record<string, unknown>;
  elements: ElementorWidget[];
  widgetType?: string;
  isInner?: boolean;
}

function wrapTemplate(title: string, content: ElementorWidget[]): string {
  const doc = {
    version: "0.4",
    title,
    type: "section",
    content,
  };
  return JSON.stringify(doc, null, 2);
}

function heroTemplate(opts: GenerateElementorKitOptions): string {
  const { resolved, tokens, designName } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-hero`);
  const title = tokens.microcopy?.heroHeadline || `Welcome to ${designName}`;
  const subtitle =
    tokens.microcopy?.heroSubheadline ||
    "Built with a design system extracted by Ditto.";
  const cta = tokens.microcopy?.ctaLabels?.[0] || "Get started";

  const radiusMd = parsePx(resolved.radiusMd, 8);

  const content: ElementorWidget[] = [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "10",
        background_background: "classic",
        background_color: resolved.colorBackground,
        padding: { unit: "px", top: 96, right: 16, bottom: 96, left: 16, isLinked: false },
      },
      elements: [
        {
          id: mkId(),
          elType: "column",
          settings: { _column_size: 100, _inline_size: null },
          elements: [
            {
              id: mkId(),
              elType: "widget",
              widgetType: "heading",
              settings: {
                title,
                header_size: "h1",
                align: "center",
                title_color: resolved.colorTextPrimary,
                typography_typography: "custom",
                typography_font_family: resolved.fontHeading,
                typography_font_weight: String(resolved.fontWeightHeading),
                typography_font_size: { unit: "rem", size: 3, sizes: [] },
              },
              elements: [],
            },
            {
              id: mkId(),
              elType: "widget",
              widgetType: "heading",
              settings: {
                title: subtitle,
                header_size: "h3",
                align: "center",
                title_color: resolved.colorTextSecondary,
                typography_typography: "custom",
                typography_font_family: resolved.fontBody,
                typography_font_weight: String(resolved.fontWeightBody),
                typography_font_size: { unit: "rem", size: 1.25, sizes: [] },
                _margin: { unit: "px", top: 16, right: 0, bottom: 32, left: 0, isLinked: false },
              },
              elements: [],
            },
            {
              id: mkId(),
              elType: "widget",
              widgetType: "button",
              settings: {
                text: cta,
                link: { url: "#", is_external: "", nofollow: "" },
                align: "center",
                size: "md",
                button_text_color: onPrimaryColor(resolved.colorPrimary, resolved.colorTextPrimary),
                background_color: resolved.colorPrimary,
                hover_color: onPrimaryColor(resolved.colorPrimary, resolved.colorTextPrimary),
                background_hover_color: resolved.colorAccent,
                border_radius: {
                  unit: "px",
                  top: radiusMd,
                  right: radiusMd,
                  bottom: radiusMd,
                  left: radiusMd,
                  isLinked: true,
                },
                typography_typography: "custom",
                typography_font_family: resolved.fontBody,
                typography_font_weight: "500",
              },
              elements: [],
            },
          ],
          isInner: false,
        },
      ],
      isInner: false,
    },
  ];

  return wrapTemplate("Hero", content);
}

function featuresTemplate(opts: GenerateElementorKitOptions): string {
  const { resolved } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-features`);

  const column = (title: string, body: string): ElementorWidget => ({
    id: mkId(),
    elType: "column",
    settings: {
      _column_size: 33,
      _inline_size: null,
      padding: { unit: "px", top: 16, right: 16, bottom: 16, left: 16, isLinked: true },
    },
    elements: [
      {
        id: mkId(),
        elType: "widget",
        widgetType: "heading",
        settings: {
          title,
          header_size: "h3",
          title_color: resolved.colorTextPrimary,
          typography_typography: "custom",
          typography_font_family: resolved.fontHeading,
          typography_font_weight: String(resolved.fontWeightHeading),
          typography_font_size: { unit: "rem", size: 1.25, sizes: [] },
        },
        elements: [],
      },
      {
        id: mkId(),
        elType: "widget",
        widgetType: "text-editor",
        settings: {
          editor: `<p>${body}</p>`,
          text_color: resolved.colorTextSecondary,
          typography_typography: "custom",
          typography_font_family: resolved.fontBody,
          typography_font_size: { unit: "rem", size: 0.95, sizes: [] },
        },
        elements: [],
      },
    ],
    isInner: false,
  });

  const content: ElementorWidget[] = [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "30",
        background_background: "classic",
        background_color: resolved.colorSurface,
        padding: { unit: "px", top: 80, right: 16, bottom: 80, left: 16, isLinked: false },
        gap: "extended",
      },
      elements: [
        column("Lightning fast", "Built for snappy rendering across themes and devices."),
        column("Fully themeable", "Global colors and typography live in site settings — tweak once, apply everywhere."),
        column("Drop-in sections", "Hero, feature grid, CTA and pricing templates ready to compose."),
      ],
      isInner: false,
    },
  ];

  return wrapTemplate("Features", content);
}

function ctaTemplate(opts: GenerateElementorKitOptions): string {
  const { resolved, tokens } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-cta`);
  const cta = tokens.microcopy?.ctaLabels?.[1] || tokens.microcopy?.ctaLabels?.[0] || "Get started";
  const radiusMd = parsePx(resolved.radiusMd, 8);

  const content: ElementorWidget[] = [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "10",
        background_background: "classic",
        background_color: resolved.colorBackground,
        padding: { unit: "px", top: 80, right: 16, bottom: 80, left: 16, isLinked: false },
      },
      elements: [
        {
          id: mkId(),
          elType: "column",
          settings: { _column_size: 100, _inline_size: null },
          elements: [
            {
              id: mkId(),
              elType: "widget",
              widgetType: "heading",
              settings: {
                title: "Ready when you are.",
                header_size: "h2",
                align: "center",
                title_color: resolved.colorTextPrimary,
                typography_typography: "custom",
                typography_font_family: resolved.fontHeading,
                typography_font_weight: String(resolved.fontWeightHeading),
                typography_font_size: { unit: "rem", size: 2, sizes: [] },
              },
              elements: [],
            },
            {
              id: mkId(),
              elType: "widget",
              widgetType: "text-editor",
              settings: {
                editor: `<p style="text-align:center">Join the team building with this design system.</p>`,
                text_color: resolved.colorTextSecondary,
                typography_typography: "custom",
                typography_font_family: resolved.fontBody,
              },
              elements: [],
            },
            {
              id: mkId(),
              elType: "widget",
              widgetType: "button",
              settings: {
                text: cta,
                link: { url: "#", is_external: "", nofollow: "" },
                align: "center",
                button_text_color: onPrimaryColor(resolved.colorPrimary, resolved.colorTextPrimary),
                background_color: resolved.colorPrimary,
                background_hover_color: resolved.colorAccent,
                border_radius: {
                  unit: "px",
                  top: radiusMd,
                  right: radiusMd,
                  bottom: radiusMd,
                  left: radiusMd,
                  isLinked: true,
                },
              },
              elements: [],
            },
          ],
          isInner: false,
        },
      ],
      isInner: false,
    },
  ];

  return wrapTemplate("CTA", content);
}

function pricingTemplate(opts: GenerateElementorKitOptions): string {
  const { resolved } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-pricing`);
  const radiusLg = parsePx(resolved.radiusLg, 12);

  const content: ElementorWidget[] = [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "10",
        background_background: "classic",
        background_color: resolved.colorBackground,
        padding: { unit: "px", top: 80, right: 16, bottom: 80, left: 16, isLinked: false },
      },
      elements: [
        {
          id: mkId(),
          elType: "column",
          settings: {
            _column_size: 100,
            _inline_size: null,
            background_background: "classic",
            background_color: resolved.colorSurface,
            border_border: "solid",
            border_width: { unit: "px", top: 1, right: 1, bottom: 1, left: 1, isLinked: true },
            border_color: resolved.colorBorder,
            border_radius: {
              unit: "px",
              top: radiusLg,
              right: radiusLg,
              bottom: radiusLg,
              left: radiusLg,
              isLinked: true,
            },
            padding: { unit: "px", top: 32, right: 32, bottom: 32, left: 32, isLinked: true },
            _inline_size_tablet: null,
          },
          elements: [
            {
              id: mkId(),
              elType: "widget",
              widgetType: "heading",
              settings: {
                title: "Pro",
                header_size: "h3",
                align: "center",
                title_color: resolved.colorTextPrimary,
                typography_typography: "custom",
                typography_font_family: resolved.fontHeading,
                typography_font_weight: String(resolved.fontWeightHeading),
              },
              elements: [],
            },
            {
              id: mkId(),
              elType: "widget",
              widgetType: "heading",
              settings: {
                title: "$29",
                header_size: "h2",
                align: "center",
                title_color: resolved.colorPrimary,
                typography_typography: "custom",
                typography_font_family: resolved.fontHeading,
                typography_font_weight: String(resolved.fontWeightHeading),
                typography_font_size: { unit: "rem", size: 2.5, sizes: [] },
                _margin: { unit: "px", top: 8, right: 0, bottom: 16, left: 0, isLinked: false },
              },
              elements: [],
            },
            {
              id: mkId(),
              elType: "widget",
              widgetType: "text-editor",
              settings: {
                editor: `<ul style="list-style:none;padding:0;text-align:center;margin:0"><li>Unlimited projects</li><li>Priority support</li><li>Team collaboration</li><li>Export everywhere</li></ul>`,
                text_color: resolved.colorTextSecondary,
                typography_typography: "custom",
                typography_font_family: resolved.fontBody,
              },
              elements: [],
            },
            {
              id: mkId(),
              elType: "widget",
              widgetType: "button",
              settings: {
                text: "Start free trial",
                link: { url: "#", is_external: "", nofollow: "" },
                align: "center",
                button_text_color: onPrimaryColor(resolved.colorPrimary, resolved.colorTextPrimary),
                background_color: resolved.colorPrimary,
                background_hover_color: resolved.colorAccent,
                _margin: { unit: "px", top: 16, right: 0, bottom: 0, left: 0, isLinked: false },
              },
              elements: [],
            },
          ],
          isInner: false,
        },
      ],
      isInner: false,
    },
  ];

  return wrapTemplate("Pricing", content);
}

// ── Public API ─────────────────────────────────────────────────────────

export async function generateElementorKit(
  opts: GenerateElementorKitOptions
): Promise<ElementorKitFile[]> {
  const files: ElementorKitFile[] = [];
  const idFactory = makeIdFactory(`${opts.designSlug}-tpl`);
  const templateIds: Record<string, string> = {
    hero: idFactory(),
    features: idFactory(),
    cta: idFactory(),
    pricing: idFactory(),
  };

  // Templates
  files.push({ path: `templates/${templateIds.hero}.json`, content: heroTemplate(opts) });
  files.push({ path: `templates/${templateIds.features}.json`, content: featuresTemplate(opts) });
  files.push({ path: `templates/${templateIds.cta}.json`, content: ctaTemplate(opts) });
  files.push({ path: `templates/${templateIds.pricing}.json`, content: pricingTemplate(opts) });

  // Site settings + manifest
  files.push({ path: "site-settings.json", content: buildSiteSettings(opts) });
  files.push({ path: "manifest.json", content: buildManifest(opts, templateIds) });

  return files;
}

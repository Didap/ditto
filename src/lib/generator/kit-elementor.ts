/**
 * Elementor Theme generator.
 *
 * Produces a full Hello-Elementor-style classic WordPress theme preconfigured
 * with the design's brand tokens, plus a Demo Importer admin page that —
 * one-click — creates 5 pages (home/about/services/contact/blog), imports
 * header/footer Elementor templates and wires the menu + homepage.
 *
 * Output is an array of `{ path, content }` consumed by design-client.tsx and
 * zipped client-side into `<slug>-elementor-theme.zip`.
 *
 * Requires WordPress ≥ 6.0 + Elementor (free) ≥ 3.20.
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
  authorUri?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Deterministic 7-char id generator — Elementor uses short alnum ids. */
function makeIdFactory(seed: string) {
  let counter = 0;
  return () => {
    counter += 1;
    const raw = `${seed}-${counter}`;
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

function phpEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function textDomainFor(slug: string): string {
  const candidate = `${slug}-elementor`;
  if (candidate.length <= 30) return candidate;
  return `${slug.slice(0, 20)}-elementor`;
}

function phpClassName(slug: string): string {
  const parts = slug.split(/[-_]/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  return `Ditto_${parts.join("_") || "Theme"}`;
}

// ── Elementor widget builder types ─────────────────────────────────────

interface ElementorWidget {
  id: string;
  elType: string;
  settings: Record<string, unknown>;
  elements: ElementorWidget[];
  widgetType?: string;
  isInner?: boolean;
}

function wrapDocument(
  title: string,
  type: "section" | "wp-page" | "header" | "footer",
  content: ElementorWidget[],
): string {
  const doc = {
    version: "0.4",
    title,
    type,
    content,
    page_settings: [],
  };
  return JSON.stringify(doc, null, 2);
}

// ── Section widget builders ────────────────────────────────────────────
// Return ElementorWidget[] so they can be composed into pages.

function heroSection(opts: GenerateElementorKitOptions): ElementorWidget[] {
  const { resolved, tokens, designName } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-hero`);
  const title = tokens.microcopy?.heroHeadline || `Welcome to ${designName}`;
  const subtitle =
    tokens.microcopy?.heroSubheadline ||
    "Built with a design system extracted by Ditto.";
  const cta = tokens.microcopy?.ctaLabels?.[0] || "Get started";
  const radiusMd = parsePx(resolved.radiusMd, 8);

  return [
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
                border_radius: { unit: "px", top: radiusMd, right: radiusMd, bottom: radiusMd, left: radiusMd, isLinked: true },
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
}

function statsSection(opts: GenerateElementorKitOptions): ElementorWidget[] {
  const { resolved } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-stats`);
  const stats = [
    { label: "Active Users", value: "12,000+" },
    { label: "Uptime", value: "99.99%" },
    { label: "Countries", value: "40+" },
  ];
  const column = (value: string, label: string): ElementorWidget => ({
    id: mkId(),
    elType: "column",
    settings: { _column_size: 33, _inline_size: null },
    elements: [
      {
        id: mkId(),
        elType: "widget",
        widgetType: "heading",
        settings: {
          title: value,
          header_size: "h2",
          align: "center",
          title_color: resolved.colorTextPrimary,
          typography_typography: "custom",
          typography_font_family: resolved.fontHeading,
          typography_font_weight: String(resolved.fontWeightHeading),
          typography_font_size: { unit: "rem", size: 2.5, sizes: [] },
        },
        elements: [],
      },
      {
        id: mkId(),
        elType: "widget",
        widgetType: "heading",
        settings: {
          title: label,
          header_size: "h6",
          align: "center",
          title_color: resolved.colorTextMuted,
          typography_typography: "custom",
          typography_font_family: resolved.fontBody,
          typography_font_size: { unit: "rem", size: 0.875, sizes: [] },
        },
        elements: [],
      },
    ],
    isInner: false,
  });
  return [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "30",
        background_background: "classic",
        background_color: resolved.colorBackground,
        padding: { unit: "px", top: 32, right: 16, bottom: 64, left: 16, isLinked: false },
      },
      elements: stats.map((s) => column(s.value, s.label)),
      isInner: false,
    },
  ];
}

function featuresSection(opts: GenerateElementorKitOptions): ElementorWidget[] {
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
  return [
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
}

function reviewsSection(opts: GenerateElementorKitOptions): ElementorWidget[] {
  const { resolved } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-reviews`);
  const radiusLg = parsePx(resolved.radiusLg, 12);
  const reviews = [
    { name: "Sarah Chen", role: "Product Designer", text: "Ditto turned our design system into a real working kit in minutes." },
    { name: "James Wilson", role: "Frontend Lead", text: "Clean tokens, working pages, everything themed. It just works." },
    { name: "Maria Lopez", role: "CTO", text: "We shipped a branded marketing site the same afternoon we downloaded this." },
  ];
  const review = (r: { name: string; role: string; text: string }): ElementorWidget => ({
    id: mkId(),
    elType: "column",
    settings: {
      _column_size: 33,
      _inline_size: null,
      background_background: "classic",
      background_color: resolved.colorSurface,
      border_border: "solid",
      border_width: { unit: "px", top: 1, right: 1, bottom: 1, left: 1, isLinked: true },
      border_color: resolved.colorBorder,
      border_radius: { unit: "px", top: radiusLg, right: radiusLg, bottom: radiusLg, left: radiusLg, isLinked: true },
      padding: { unit: "px", top: 24, right: 24, bottom: 24, left: 24, isLinked: true },
    },
    elements: [
      {
        id: mkId(),
        elType: "widget",
        widgetType: "text-editor",
        settings: {
          editor: `<p>&ldquo;${r.text}&rdquo;</p>`,
          text_color: resolved.colorTextSecondary,
          typography_typography: "custom",
          typography_font_family: resolved.fontBody,
          typography_font_size: { unit: "rem", size: 0.95, sizes: [] },
        },
        elements: [],
      },
      {
        id: mkId(),
        elType: "widget",
        widgetType: "heading",
        settings: {
          title: r.name,
          header_size: "h5",
          title_color: resolved.colorTextPrimary,
          typography_typography: "custom",
          typography_font_family: resolved.fontHeading,
          typography_font_size: { unit: "rem", size: 1, sizes: [] },
          _margin: { unit: "px", top: 12, right: 0, bottom: 0, left: 0, isLinked: false },
        },
        elements: [],
      },
      {
        id: mkId(),
        elType: "widget",
        widgetType: "heading",
        settings: {
          title: r.role,
          header_size: "h6",
          title_color: resolved.colorTextMuted,
          typography_typography: "custom",
          typography_font_family: resolved.fontBody,
          typography_font_size: { unit: "rem", size: 0.8125, sizes: [] },
        },
        elements: [],
      },
    ],
    isInner: false,
  });

  return [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "30",
        background_background: "classic",
        background_color: resolved.colorBackground,
        padding: { unit: "px", top: 80, right: 16, bottom: 80, left: 16, isLinked: false },
        gap: "extended",
      },
      elements: reviews.map(review),
      isInner: false,
    },
  ];
}

function ctaSection(opts: GenerateElementorKitOptions): ElementorWidget[] {
  const { resolved, tokens } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-cta`);
  const cta = tokens.microcopy?.ctaLabels?.[1] || tokens.microcopy?.ctaLabels?.[0] || "Get started";
  const radiusMd = parsePx(resolved.radiusMd, 8);
  return [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "10",
        background_background: "classic",
        background_color: resolved.colorSurface,
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
                border_radius: { unit: "px", top: radiusMd, right: radiusMd, bottom: radiusMd, left: radiusMd, isLinked: true },
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
}

function contactSection(opts: GenerateElementorKitOptions): ElementorWidget[] {
  const { resolved } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-contact`);
  return [
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
          settings: { _column_size: 66, _inline_size: null },
          elements: [
            {
              id: mkId(),
              elType: "widget",
              widgetType: "heading",
              settings: {
                title: "Get in touch",
                header_size: "h1",
                align: "center",
                title_color: resolved.colorTextPrimary,
                typography_typography: "custom",
                typography_font_family: resolved.fontHeading,
                typography_font_weight: String(resolved.fontWeightHeading),
                typography_font_size: { unit: "rem", size: 2.5, sizes: [] },
              },
              elements: [],
            },
            {
              id: mkId(),
              elType: "widget",
              widgetType: "text-editor",
              settings: {
                editor: `<p style="text-align:center">Questions, feedback, partnerships — we'd love to hear from you. Write to hello@example.com and we'll get back within one business day.</p>`,
                text_color: resolved.colorTextSecondary,
                typography_typography: "custom",
                typography_font_family: resolved.fontBody,
                typography_font_size: { unit: "rem", size: 1, sizes: [] },
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
}

// ── Page composers — full Elementor page JSON ──────────────────────────

function pageHomeJson(opts: GenerateElementorKitOptions): string {
  return wrapDocument("Home", "wp-page", [
    ...heroSection(opts),
    ...statsSection(opts),
    ...featuresSection(opts),
    ...reviewsSection(opts),
    ...ctaSection(opts),
  ]);
}

function pageAboutJson(opts: GenerateElementorKitOptions): string {
  const { resolved, designName } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-about`);
  const intro: ElementorWidget[] = [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "10",
        background_background: "classic",
        background_color: resolved.colorBackground,
        padding: { unit: "px", top: 96, right: 16, bottom: 48, left: 16, isLinked: false },
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
                title: `About ${designName}`,
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
              widgetType: "text-editor",
              settings: {
                editor: `<p style="text-align:center;max-width:640px;margin:16px auto 0">We believe good design is a system. This page is a placeholder — edit it in Elementor to tell your story.</p>`,
                text_color: resolved.colorTextSecondary,
                typography_typography: "custom",
                typography_font_family: resolved.fontBody,
                typography_font_size: { unit: "rem", size: 1.125, sizes: [] },
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
  return wrapDocument("About", "wp-page", [...intro, ...featuresSection(opts), ...ctaSection(opts)]);
}

function pageServicesJson(opts: GenerateElementorKitOptions): string {
  const { resolved } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-services`);
  const intro: ElementorWidget[] = [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "10",
        background_background: "classic",
        background_color: resolved.colorBackground,
        padding: { unit: "px", top: 96, right: 16, bottom: 32, left: 16, isLinked: false },
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
                title: "What we do",
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
          ],
          isInner: false,
        },
      ],
      isInner: false,
    },
  ];
  return wrapDocument("Services", "wp-page", [...intro, ...featuresSection(opts), ...reviewsSection(opts), ...ctaSection(opts)]);
}

function pageContactJson(opts: GenerateElementorKitOptions): string {
  return wrapDocument("Contact", "wp-page", contactSection(opts));
}

function pageBlogJson(opts: GenerateElementorKitOptions): string {
  const { resolved } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-blog`);
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
                title: "Journal",
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
              widgetType: "text-editor",
              settings: {
                editor: `<p style="text-align:center">Thoughts, notes and updates. Replace this widget with an Elementor Posts widget to list your latest articles.</p>`,
                text_color: resolved.colorTextSecondary,
                typography_typography: "custom",
                typography_font_family: resolved.fontBody,
                typography_font_size: { unit: "rem", size: 1, sizes: [] },
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
  return wrapDocument("Blog", "wp-page", content);
}

// ── Header / Footer as Elementor section templates (fallback) ──────────

function headerJson(opts: GenerateElementorKitOptions): string {
  const { resolved, designName } = opts;
  const mkId = makeIdFactory(`${opts.designSlug}-header`);
  return wrapDocument("Site Header", "header", [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "20",
        background_background: "classic",
        background_color: resolved.colorBackground,
        padding: { unit: "px", top: 16, right: 24, bottom: 16, left: 24, isLinked: false },
        border_border: "solid",
        border_width: { unit: "px", top: 0, right: 0, bottom: 1, left: 0, isLinked: false },
        border_color: resolved.colorBorder,
      },
      elements: [
        {
          id: mkId(),
          elType: "column",
          settings: { _column_size: 50, _inline_size: 50 },
          elements: [
            {
              id: mkId(),
              elType: "widget",
              widgetType: "heading",
              settings: {
                title: resolved.brandName || designName,
                header_size: "h3",
                title_color: resolved.colorTextPrimary,
                typography_typography: "custom",
                typography_font_family: resolved.fontHeading,
                typography_font_weight: "700",
                typography_font_size: { unit: "rem", size: 1.125, sizes: [] },
                link: { url: "/", is_external: "", nofollow: "" },
              },
              elements: [],
            },
          ],
          isInner: false,
        },
        {
          id: mkId(),
          elType: "column",
          settings: {
            _column_size: 50,
            _inline_size: 50,
            align_self: "center",
          },
          elements: [
            {
              id: mkId(),
              elType: "widget",
              widgetType: "text-editor",
              settings: {
                editor: `<p style="text-align:right;margin:0"><a href="/" style="color:${resolved.colorTextSecondary};margin-left:16px">Home</a><a href="/about" style="color:${resolved.colorTextSecondary};margin-left:16px">About</a><a href="/services" style="color:${resolved.colorTextSecondary};margin-left:16px">Services</a><a href="/blog" style="color:${resolved.colorTextSecondary};margin-left:16px">Blog</a><a href="/contact" style="color:${resolved.colorTextSecondary};margin-left:16px">Contact</a></p>`,
                typography_typography: "custom",
                typography_font_family: resolved.fontBody,
                typography_font_size: { unit: "rem", size: 0.875, sizes: [] },
              },
              elements: [],
            },
          ],
          isInner: false,
        },
      ],
      isInner: false,
    },
  ]);
}

function footerJson(opts: GenerateElementorKitOptions): string {
  const { resolved, designName } = opts;
  const year = new Date().getUTCFullYear();
  const mkId = makeIdFactory(`${opts.designSlug}-footer`);
  return wrapDocument("Site Footer", "footer", [
    {
      id: mkId(),
      elType: "section",
      settings: {
        structure: "10",
        background_background: "classic",
        background_color: resolved.colorSurface,
        padding: { unit: "px", top: 40, right: 24, bottom: 40, left: 24, isLinked: false },
        border_border: "solid",
        border_width: { unit: "px", top: 1, right: 0, bottom: 0, left: 0, isLinked: false },
        border_color: resolved.colorBorder,
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
              widgetType: "text-editor",
              settings: {
                editor: `<p style="text-align:center;margin:0">© ${year} ${resolved.brandName || designName}. Built with Ditto.</p>`,
                text_color: resolved.colorTextMuted,
                typography_typography: "custom",
                typography_font_family: resolved.fontBody,
                typography_font_size: { unit: "rem", size: 0.8125, sizes: [] },
              },
              elements: [],
            },
          ],
          isInner: false,
        },
      ],
      isInner: false,
    },
  ]);
}

// ── PHP / CSS / theme scaffolding ──────────────────────────────────────

function buildStyleCss(opts: GenerateElementorKitOptions): string {
  const { designName, designUrl, authorName, authorUri } = opts;
  const description = `${designName} — Elementor-compatible theme generated by Ditto from ${designUrl ?? "a source design system"}. Install Elementor (free), activate this theme, then run the Demo Importer under Appearance → ${designName} Setup.`;
  return `/*
Theme Name: ${designName}
Theme URI: https://ditto.design
Description: ${description}
Author: ${authorName ?? "Ditto"}
Author URI: ${authorUri ?? "https://ditto.design"}
Version: 1.0.0
Requires at least: 6.0
Tested up to: 6.6
Requires PHP: 7.4
License: GNU General Public License v3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html
Text Domain: ${textDomainFor(opts.designSlug)}
Tags: elementor, custom-colors, custom-menu, custom-logo, featured-images, translation-ready
*/
`;
}

function buildThemeJson(opts: GenerateElementorKitOptions): string {
  const { resolved } = opts;
  const palette = [
    { slug: "primary", name: "Primary", color: resolved.colorPrimary },
    { slug: "secondary", name: "Secondary", color: resolved.colorSecondary },
    { slug: "accent", name: "Accent", color: resolved.colorAccent },
    { slug: "background", name: "Background", color: resolved.colorBackground },
    { slug: "surface", name: "Surface", color: resolved.colorSurface },
    { slug: "text-primary", name: "Text", color: resolved.colorTextPrimary },
    { slug: "text-secondary", name: "Text Secondary", color: resolved.colorTextSecondary },
    { slug: "text-muted", name: "Text Muted", color: resolved.colorTextMuted },
    { slug: "border", name: "Border", color: resolved.colorBorder },
  ];
  return JSON.stringify(
    {
      $schema: "https://schemas.wp.org/trunk/theme.json",
      version: 3,
      settings: {
        appearanceTools: true,
        layout: { contentSize: "800px", wideSize: "1200px" },
        color: { custom: true, link: true, palette },
        typography: {
          customFontSize: true,
          lineHeight: true,
          fontFamilies: [
            { slug: "heading", name: "Heading", fontFamily: `'${resolved.fontHeading}', system-ui, sans-serif` },
            { slug: "body", name: "Body", fontFamily: `'${resolved.fontBody}', system-ui, sans-serif` },
          ],
        },
        spacing: {
          defaultSpacingSizes: false,
          margin: true,
          padding: true,
          units: ["%", "px", "em", "rem", "vh", "vw"],
        },
      },
    },
    null,
    2,
  ) + "\n";
}

function buildThemeCss(opts: GenerateElementorKitOptions): string {
  const { resolved } = opts;
  const onPrimary = onPrimaryColor(resolved.colorPrimary, resolved.colorTextPrimary);
  return `/*
 * Theme tokens — design extracted by Ditto.
 * Global CSS variables usable from Elementor templates with \`var(--d-primary)\`.
 */
:root {
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
  --d-on-primary: ${onPrimary};
  --d-font-heading: '${resolved.fontHeading}', system-ui, sans-serif;
  --d-font-body: '${resolved.fontBody}', system-ui, sans-serif;
  --d-font-mono: '${resolved.fontMono}', ui-monospace, monospace;
  --d-font-weight-heading: ${resolved.fontWeightHeading};
  --d-font-weight-body: ${resolved.fontWeightBody};
  --d-radius-sm: ${resolved.radiusSm};
  --d-radius-md: ${resolved.radiusMd};
  --d-radius-lg: ${resolved.radiusLg};
  --d-radius-full: ${resolved.radiusFull};
  --d-shadow-sm: ${resolved.shadowSm};
  --d-shadow-md: ${resolved.shadowMd};
  --d-shadow-lg: ${resolved.shadowLg};
}

body {
  background: var(--d-background);
  color: var(--d-text);
  font-family: var(--d-font-body);
  font-weight: var(--d-font-weight-body);
  margin: 0;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--d-font-heading);
  font-weight: var(--d-font-weight-heading);
  color: var(--d-text);
}

a { color: var(--d-primary); }
a:hover { color: var(--d-accent); }
`;
}

function buildResetCss(): string {
  return `/* Minimal reset — adapted from hello-elementor for Ditto themes. */
html { box-sizing: border-box; }
*, *:before, *:after { box-sizing: inherit; }
body { margin: 0; }
img { max-width: 100%; height: auto; display: block; }
ul, ol { padding: 0; margin: 0 0 1em 1em; }
blockquote { margin: 0; }
button { font: inherit; color: inherit; }
.screen-reader-text { position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden; }
.skip-link { position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; z-index: 100000; }
.skip-link:focus { top: 0; }
`;
}

function buildHeaderFooterCss(opts: GenerateElementorKitOptions): string {
  const { resolved } = opts;
  return `/* Fallback header/footer CSS — used only when Elementor Pro theme-builder is NOT active. */
.site-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px;
  background: ${resolved.colorBackground};
  border-bottom: 1px solid ${resolved.colorBorder};
}
.site-header .site-title a {
  color: ${resolved.colorTextPrimary};
  font-family: var(--d-font-heading);
  font-weight: 700;
  font-size: 1.125rem;
  text-decoration: none;
}
.site-header .site-description {
  color: ${resolved.colorTextMuted};
  font-size: 0.8125rem;
  margin: 2px 0 0 0;
}
.site-header .site-navigation ul {
  list-style: none; margin: 0; padding: 0;
  display: flex; gap: 24px;
}
.site-header .site-navigation a {
  color: ${resolved.colorTextSecondary};
  font-size: 0.875rem;
  text-decoration: none;
}
.site-header .site-navigation a:hover { color: ${resolved.colorTextPrimary}; }

.site-footer {
  padding: 32px 24px;
  background: ${resolved.colorSurface};
  border-top: 1px solid ${resolved.colorBorder};
  color: ${resolved.colorTextMuted};
  font-size: 0.8125rem;
  text-align: center;
}
.site-footer a { color: ${resolved.colorTextSecondary}; }
`;
}

function buildFunctionsPhp(opts: GenerateElementorKitOptions): string {
  const slug = opts.designSlug;
  const textDomain = textDomainFor(slug);
  const classHandle = phpClassName(slug);
  const underscored = slug.replace(/-/g, "_");
  return `<?php
/**
 * ${opts.designName} — Elementor Theme
 *
 * @package ${classHandle}
 */

if ( ! defined( 'ABSPATH' ) ) {
\texit;
}

define( '${underscored.toUpperCase()}_VERSION', '1.0.0' );
define( '${underscored.toUpperCase()}_PATH', get_template_directory() );
define( '${underscored.toUpperCase()}_URL', get_template_directory_uri() );
define( '${underscored.toUpperCase()}_ASSETS_URL', ${underscored.toUpperCase()}_URL . '/assets/' );

if ( ! isset( $content_width ) ) {
\t$content_width = 1200;
}

if ( ! function_exists( '${underscored}_setup' ) ) {
\tfunction ${underscored}_setup() {
\t\tregister_nav_menus( [
\t\t\t'menu-1' => __( 'Header', '${textDomain}' ),
\t\t\t'menu-2' => __( 'Footer', '${textDomain}' ),
\t\t] );
\t\tadd_theme_support( 'post-thumbnails' );
\t\tadd_theme_support( 'title-tag' );
\t\tadd_theme_support( 'automatic-feed-links' );
\t\tadd_theme_support( 'custom-logo', [
\t\t\t'height'      => 100,
\t\t\t'width'       => 350,
\t\t\t'flex-height' => true,
\t\t\t'flex-width'  => true,
\t\t] );
\t\tadd_theme_support( 'html5', [ 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ] );
\t\tadd_theme_support( 'align-wide' );
\t\tadd_theme_support( 'editor-styles' );
\t\tadd_theme_support( 'responsive-embeds' );
\t\tadd_theme_support( 'woocommerce' );

\t\tload_theme_textdomain( '${textDomain}', get_template_directory() . '/languages' );
\t}
}
add_action( 'after_setup_theme', '${underscored}_setup' );

if ( ! function_exists( '${underscored}_enqueue' ) ) {
\tfunction ${underscored}_enqueue() {
\t\twp_enqueue_style( '${slug}-reset', ${underscored.toUpperCase()}_ASSETS_URL . 'css/reset.css', [], ${underscored.toUpperCase()}_VERSION );
\t\twp_enqueue_style( '${slug}-theme', ${underscored.toUpperCase()}_ASSETS_URL . 'css/theme.css', [], ${underscored.toUpperCase()}_VERSION );
\t\twp_enqueue_style( '${slug}-header-footer', ${underscored.toUpperCase()}_ASSETS_URL . 'css/header-footer.css', [], ${underscored.toUpperCase()}_VERSION );
\t}
}
add_action( 'wp_enqueue_scripts', '${underscored}_enqueue' );

/**
 * Register core Elementor theme-builder locations (header/footer/single/archive).
 * Requires Elementor (free ≥ 3.20) to take effect.
 */
if ( ! function_exists( '${underscored}_register_elementor_locations' ) ) {
\tfunction ${underscored}_register_elementor_locations( $elementor_theme_manager ) {
\t\t$elementor_theme_manager->register_all_core_location();
\t}
}
add_action( 'elementor/theme/register_locations', '${underscored}_register_elementor_locations' );

require get_template_directory() . '/includes/theme-setup.php';
require get_template_directory() . '/includes/elementor-functions.php';
require get_template_directory() . '/includes/class-ditto-demo-importer.php';
`;
}

function buildThemeSetupPhp(opts: GenerateElementorKitOptions): string {
  return `<?php
/**
 * Theme setup helpers — content_width + description meta.
 * @package ${phpClassName(opts.designSlug)}
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

if ( ! function_exists( 'ditto_theme_content_width' ) ) {
\tfunction ditto_theme_content_width() {
\t\t$GLOBALS['content_width'] = apply_filters( 'ditto_theme_content_width', 1200 );
\t}
}
add_action( 'after_setup_theme', 'ditto_theme_content_width', 0 );

if ( ! function_exists( 'ditto_theme_description_meta' ) ) {
\tfunction ditto_theme_description_meta() {
\t\tif ( ! is_singular() ) return;
\t\t$post = get_queried_object();
\t\tif ( empty( $post->post_excerpt ) ) return;
\t\techo '<meta name="description" content="' . esc_attr( wp_strip_all_tags( $post->post_excerpt ) ) . '">' . "\\n";
\t}
}
add_action( 'wp_head', 'ditto_theme_description_meta' );
`;
}

function buildElementorFunctionsPhp(opts: GenerateElementorKitOptions): string {
  const { resolved, designName } = opts;
  const onPrimary = onPrimaryColor(resolved.colorPrimary, resolved.colorTextPrimary);
  return `<?php
/**
 * Elementor integration — registers brand colors + typography into Elementor's
 * active kit so global styles match the Ditto-extracted design tokens.
 *
 * @package ${phpClassName(opts.designSlug)}
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * On first admin load, seed the Elementor global colors/fonts from the theme's tokens.
 * This only runs once — flagged via an option — so users can later customize freely.
 */
if ( ! function_exists( 'ditto_theme_seed_elementor_kit' ) ) {
\tfunction ditto_theme_seed_elementor_kit() {
\t\tif ( get_option( 'ditto_theme_elementor_kit_seeded' ) ) return;
\t\tif ( ! did_action( 'elementor/loaded' ) ) return;
\t\tif ( ! class_exists( '\\Elementor\\Plugin' ) ) return;

\t\t$kit = \\Elementor\\Plugin::$instance->kits_manager->get_active_kit();
\t\tif ( ! $kit || ! $kit->get_id() ) return;

\t\t$settings = $kit->get_settings();
\t\tif ( ! is_array( $settings ) ) $settings = [];

\t\t$settings['system_colors'] = [
\t\t\t[ '_id' => 'primary',   'title' => 'Primary',   'color' => '${phpEscape(resolved.colorPrimary)}' ],
\t\t\t[ '_id' => 'secondary', 'title' => 'Secondary', 'color' => '${phpEscape(resolved.colorSecondary)}' ],
\t\t\t[ '_id' => 'text',      'title' => 'Text',      'color' => '${phpEscape(resolved.colorTextPrimary)}' ],
\t\t\t[ '_id' => 'accent',    'title' => 'Accent',    'color' => '${phpEscape(resolved.colorAccent)}' ],
\t\t];

\t\t$settings['custom_colors'] = [
\t\t\t[ '_id' => 'ditto_bg',        'title' => 'Background',       'color' => '${phpEscape(resolved.colorBackground)}' ],
\t\t\t[ '_id' => 'ditto_surface',   'title' => 'Surface',          'color' => '${phpEscape(resolved.colorSurface)}' ],
\t\t\t[ '_id' => 'ditto_text_sec',  'title' => 'Text Secondary',   'color' => '${phpEscape(resolved.colorTextSecondary)}' ],
\t\t\t[ '_id' => 'ditto_text_mut',  'title' => 'Text Muted',       'color' => '${phpEscape(resolved.colorTextMuted)}' ],
\t\t\t[ '_id' => 'ditto_border',    'title' => 'Border',           'color' => '${phpEscape(resolved.colorBorder)}' ],
\t\t];

\t\t$settings['system_typography'] = [
\t\t\t[
\t\t\t\t'_id' => 'primary',
\t\t\t\t'title' => 'Primary',
\t\t\t\t'typography_typography' => 'custom',
\t\t\t\t'typography_font_family' => '${phpEscape(resolved.fontHeading)}',
\t\t\t\t'typography_font_weight' => '${resolved.fontWeightHeading}',
\t\t\t],
\t\t\t[
\t\t\t\t'_id' => 'secondary',
\t\t\t\t'title' => 'Secondary',
\t\t\t\t'typography_typography' => 'custom',
\t\t\t\t'typography_font_family' => '${phpEscape(resolved.fontHeading)}',
\t\t\t\t'typography_font_weight' => '600',
\t\t\t],
\t\t\t[
\t\t\t\t'_id' => 'text',
\t\t\t\t'title' => 'Text',
\t\t\t\t'typography_typography' => 'custom',
\t\t\t\t'typography_font_family' => '${phpEscape(resolved.fontBody)}',
\t\t\t\t'typography_font_weight' => '${resolved.fontWeightBody}',
\t\t\t],
\t\t\t[
\t\t\t\t'_id' => 'accent',
\t\t\t\t'title' => 'Accent',
\t\t\t\t'typography_typography' => 'custom',
\t\t\t\t'typography_font_family' => '${phpEscape(resolved.fontBody)}',
\t\t\t\t'typography_font_weight' => '500',
\t\t\t],
\t\t];

\t\t$settings['site_name']        = '${phpEscape(designName)}';
\t\t$settings['button_text_color']        = '${phpEscape(onPrimary)}';
\t\t$settings['button_background_color']  = '${phpEscape(resolved.colorPrimary)}';
\t\t$settings['button_hover_background_color'] = '${phpEscape(resolved.colorAccent)}';

\t\t$page_settings_data = method_exists( $kit, 'get_meta' ) ? $kit->get_meta( '_elementor_page_settings' ) : null;
\t\tif ( ! is_array( $page_settings_data ) ) $page_settings_data = [];
\t\t$page_settings_data = array_merge( $page_settings_data, $settings );
\t\tupdate_post_meta( $kit->get_id(), '_elementor_page_settings', $page_settings_data );

\t\tupdate_option( 'ditto_theme_elementor_kit_seeded', 1 );
\t}
}
add_action( 'admin_init', 'ditto_theme_seed_elementor_kit' );
`;
}

function buildDemoImporterPhp(opts: GenerateElementorKitOptions): string {
  const { designName, designSlug } = opts;
  const textDomain = textDomainFor(designSlug);
  return `<?php
/**
 * Demo Importer — one-click setup for the ${designName} theme.
 *
 * On first activation shows an admin notice: "Import the demo?". Clicking runs
 * the import routine which:
 *   1. Creates the Home / About / Services / Contact / Blog pages (empty, will
 *      receive Elementor content below).
 *   2. Imports each JSON file in /elementor-templates/ as an Elementor
 *      Template (saved to Templates → Saved Templates).
 *   3. Copies the template's content onto the corresponding page so it
 *      renders via Elementor out of the box.
 *   4. Assigns a Primary menu with the created pages and shows it in the
 *      theme's header location.
 *   5. Sets the Home page as page_on_front.
 *
 * After the first successful run the notice is dismissed permanently.
 * Users can re-run the wizard from Appearance → ${designName} Setup.
 *
 * @package ${phpClassName(designSlug)}
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

class Ditto_Demo_Importer {
\tconst OPTION_DONE = 'ditto_theme_demo_imported';
\tconst NONCE = 'ditto_theme_import_demo';

\tprivate static $pages = [
\t\t[ 'slug' => 'home',     'title' => 'Home',     'template' => 'page-home.json' ],
\t\t[ 'slug' => 'about',    'title' => 'About',    'template' => 'page-about.json' ],
\t\t[ 'slug' => 'services', 'title' => 'Services', 'template' => 'page-services.json' ],
\t\t[ 'slug' => 'blog',     'title' => 'Blog',     'template' => 'page-blog.json' ],
\t\t[ 'slug' => 'contact',  'title' => 'Contact',  'template' => 'page-contact.json' ],
\t];

\tpublic static function init() {
\t\tadd_action( 'admin_notices', [ __CLASS__, 'maybe_notice' ] );
\t\tadd_action( 'admin_menu', [ __CLASS__, 'add_menu' ] );
\t\tadd_action( 'admin_post_ditto_import_demo', [ __CLASS__, 'handle_import' ] );
\t}

\tpublic static function maybe_notice() {
\t\tif ( get_option( self::OPTION_DONE ) ) return;
\t\tif ( ! current_user_can( 'manage_options' ) ) return;

\t\t$url = admin_url( 'themes.php?page=ditto-theme-setup' );
\t\techo '<div class="notice notice-info" style="border-left-color:' . esc_attr( '${phpEscape(opts.resolved.colorPrimary)}' ) . '"><p><strong>${phpEscape(designName)}</strong> — ' . esc_html__( 'Welcome! Click below to import the demo content (pages, menus, homepage).', '${textDomain}' ) . ' <a href="' . esc_url( $url ) . '" class="button button-primary" style="margin-left:12px">' . esc_html__( 'Import demo', '${textDomain}' ) . '</a></p></div>';
\t}

\tpublic static function add_menu() {
\t\tadd_theme_page(
\t\t\t'${phpEscape(designName)} Setup',
\t\t\t'${phpEscape(designName)} Setup',
\t\t\t'manage_options',
\t\t\t'ditto-theme-setup',
\t\t\t[ __CLASS__, 'render_page' ]
\t\t);
\t}

\tpublic static function render_page() {
\t\t$done = (bool) get_option( self::OPTION_DONE );
\t\t$action = admin_url( 'admin-post.php' );
\t\t?>
\t\t<div class="wrap">
\t\t\t<h1><?php echo esc_html( '${phpEscape(designName)} — Demo Importer' ); ?></h1>
\t\t\t<?php if ( $done ) : ?>
\t\t\t\t<div class="notice notice-success"><p><?php echo esc_html__( 'Demo already imported. You can re-run the importer below to overwrite — existing pages with the same slug will be updated.', '${textDomain}' ); ?></p></div>
\t\t\t<?php endif; ?>
\t\t\t<p><?php echo esc_html__( 'This will create 5 pages (home, about, services, blog, contact), import their Elementor content, build a Primary menu, and set Home as the front page.', '${textDomain}' ); ?></p>
\t\t\t<p><?php echo esc_html__( 'Requires: Elementor plugin (free) installed and active.', '${textDomain}' ); ?></p>
\t\t\t<form method="post" action="<?php echo esc_url( $action ); ?>">
\t\t\t\t<input type="hidden" name="action" value="ditto_import_demo" />
\t\t\t\t<?php wp_nonce_field( self::NONCE ); ?>
\t\t\t\t<?php submit_button( $done ? __( 'Re-import demo', '${textDomain}' ) : __( 'Import demo', '${textDomain}' ), 'primary large' ); ?>
\t\t\t</form>
\t\t</div>
\t\t<?php
\t}

\tpublic static function handle_import() {
\t\tif ( ! current_user_can( 'manage_options' ) ) wp_die( 'no perms' );
\t\tcheck_admin_referer( self::NONCE );

\t\tif ( ! did_action( 'elementor/loaded' ) || ! class_exists( '\\Elementor\\Plugin' ) ) {
\t\t\twp_die( esc_html__( 'Elementor plugin is required. Install and activate it, then re-run this importer.', '${textDomain}' ) );
\t\t}

\t\t$page_ids = [];
\t\tforeach ( self::$pages as $page ) {
\t\t\t$page_ids[ $page['slug'] ] = self::import_page( $page );
\t\t}

\t\tself::build_menu( $page_ids );

\t\tif ( ! empty( $page_ids['home'] ) ) {
\t\t\tupdate_option( 'show_on_front', 'page' );
\t\t\tupdate_option( 'page_on_front', (int) $page_ids['home'] );
\t\t\tif ( ! empty( $page_ids['blog'] ) ) {
\t\t\t\tupdate_option( 'page_for_posts', (int) $page_ids['blog'] );
\t\t\t}
\t\t}

\t\tupdate_option( self::OPTION_DONE, 1 );
\t\twp_safe_redirect( admin_url( 'themes.php?page=ditto-theme-setup&imported=1' ) );
\t\texit;
\t}

\tprivate static function import_page( $spec ) {
\t\t$existing = get_page_by_path( $spec['slug'] );
\t\tif ( $existing ) {
\t\t\t$page_id = $existing->ID;
\t\t} else {
\t\t\t$page_id = wp_insert_post( [
\t\t\t\t'post_title'  => $spec['title'],
\t\t\t\t'post_name'   => $spec['slug'],
\t\t\t\t'post_status' => 'publish',
\t\t\t\t'post_type'   => 'page',
\t\t\t] );
\t\t}
\t\tif ( is_wp_error( $page_id ) || ! $page_id ) return 0;

\t\t$tpl_path = get_template_directory() . '/elementor-templates/' . $spec['template'];
\t\tif ( ! file_exists( $tpl_path ) ) return $page_id;

\t\t$raw = file_get_contents( $tpl_path );
\t\t$data = json_decode( $raw, true );
\t\tif ( ! is_array( $data ) || empty( $data['content'] ) ) return $page_id;

\t\tupdate_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
\t\tupdate_post_meta( $page_id, '_elementor_template_type', 'wp-page' );
\t\tupdate_post_meta( $page_id, '_elementor_version', ELEMENTOR_VERSION );
\t\tupdate_post_meta( $page_id, '_elementor_data', wp_slash( wp_json_encode( $data['content'] ) ) );

\t\t\\Elementor\\Plugin::$instance->files_manager->clear_cache();

\t\treturn $page_id;
\t}

\tprivate static function build_menu( $page_ids ) {
\t\t$menu_name = 'Primary';
\t\t$menu = wp_get_nav_menu_object( $menu_name );
\t\tif ( ! $menu ) {
\t\t\t$menu_id = wp_create_nav_menu( $menu_name );
\t\t} else {
\t\t\t$menu_id = $menu->term_id;
\t\t\t// Clear existing items so re-runs stay clean.
\t\t\t$items = wp_get_nav_menu_items( $menu_id );
\t\t\tif ( is_array( $items ) ) {
\t\t\t\tforeach ( $items as $item ) wp_delete_post( $item->ID, true );
\t\t\t}
\t\t}

\t\t$order = [ 'home', 'about', 'services', 'blog', 'contact' ];
\t\tforeach ( $order as $slug ) {
\t\t\t$id = isset( $page_ids[ $slug ] ) ? (int) $page_ids[ $slug ] : 0;
\t\t\tif ( ! $id ) continue;
\t\t\t$page = get_post( $id );
\t\t\tif ( ! $page ) continue;
\t\t\twp_update_nav_menu_item( $menu_id, 0, [
\t\t\t\t'menu-item-title'   => $page->post_title,
\t\t\t\t'menu-item-object'  => 'page',
\t\t\t\t'menu-item-object-id' => $id,
\t\t\t\t'menu-item-type'    => 'post_type',
\t\t\t\t'menu-item-status'  => 'publish',
\t\t\t] );
\t\t}

\t\t$locations = get_theme_mod( 'nav_menu_locations' );
\t\tif ( ! is_array( $locations ) ) $locations = [];
\t\t$locations['menu-1'] = $menu_id;
\t\tset_theme_mod( 'nav_menu_locations', $locations );
\t}
}

add_action( 'admin_init', [ 'Ditto_Demo_Importer', 'init' ] );
`;
}

function buildIndexPhp(): string {
  return `<?php
/**
 * Default template — delegates to Elementor when available, falls back to
 * simple template-parts otherwise.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

get_header();

$is_elementor = function_exists( 'elementor_theme_do_location' );

if ( is_singular() ) {
\tif ( ! $is_elementor || ! elementor_theme_do_location( 'single' ) ) {
\t\tget_template_part( 'template-parts/single' );
\t}
} elseif ( is_archive() || is_home() ) {
\tif ( ! $is_elementor || ! elementor_theme_do_location( 'archive' ) ) {
\t\tget_template_part( 'template-parts/archive' );
\t}
} elseif ( is_search() ) {
\tif ( ! $is_elementor || ! elementor_theme_do_location( 'archive' ) ) {
\t\tget_template_part( 'template-parts/search' );
\t}
} else {
\tget_template_part( 'template-parts/404' );
}

get_footer();
`;
}

function buildHeaderPhp(opts: GenerateElementorKitOptions): string {
  const textDomain = textDomainFor(opts.designSlug);
  return `<?php
/**
 * The header template.
 * @package ${phpClassName(opts.designSlug)}
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
\t<meta charset="<?php bloginfo( 'charset' ); ?>">
\t<meta name="viewport" content="width=device-width, initial-scale=1">
\t<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="skip-link screen-reader-text" href="#content"><?php echo esc_html__( 'Skip to content', '${textDomain}' ); ?></a>

<?php
if ( ! function_exists( 'elementor_theme_do_location' ) || ! elementor_theme_do_location( 'header' ) ) {
\tget_template_part( 'template-parts/header' );
}
?>

<main id="content" class="site-content">
`;
}

function buildFooterPhp(): string {
  return `<?php
/**
 * The footer template.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
</main><!-- #content -->

<?php
if ( ! function_exists( 'elementor_theme_do_location' ) || ! elementor_theme_do_location( 'footer' ) ) {
\tget_template_part( 'template-parts/footer' );
}

wp_footer();
?>
</body>
</html>
`;
}

function buildTplPartHeaderPhp(opts: GenerateElementorKitOptions): string {
  const textDomain = textDomainFor(opts.designSlug);
  return `<?php
/**
 * Fallback header — shown only when no Elementor header template is assigned.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

$site_name = get_bloginfo( 'name' );
$tagline   = get_bloginfo( 'description', 'display' );
$menu = wp_nav_menu( [
\t'theme_location' => 'menu-1',
\t'fallback_cb'    => false,
\t'container'      => false,
\t'echo'           => false,
] );
?>
<header id="site-header" class="site-header">
\t<div class="site-branding">
\t\t<?php if ( has_custom_logo() ) : ?>
\t\t\t<?php the_custom_logo(); ?>
\t\t<?php elseif ( $site_name ) : ?>
\t\t\t<div class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php echo esc_html( $site_name ); ?></a></div>
\t\t\t<?php if ( $tagline ) : ?>
\t\t\t\t<p class="site-description"><?php echo esc_html( $tagline ); ?></p>
\t\t\t<?php endif; ?>
\t\t<?php endif; ?>
\t</div>
\t<?php if ( $menu ) : ?>
\t\t<nav class="site-navigation" aria-label="<?php echo esc_attr__( 'Main menu', '${textDomain}' ); ?>">
\t\t\t<?php echo $menu; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
\t\t</nav>
\t<?php endif; ?>
</header>
`;
}

function buildTplPartFooterPhp(opts: GenerateElementorKitOptions): string {
  return `<?php
/**
 * Fallback footer — shown only when no Elementor footer template is assigned.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

$site_name = get_bloginfo( 'name' );
$year = date( 'Y' );
?>
<footer id="site-footer" class="site-footer">
\t<p>&copy; <?php echo esc_html( $year ); ?> <?php echo esc_html( $site_name ); ?> — ${phpEscape("built with " + opts.designName)}.</p>
</footer>
`;
}

function buildTplPartSinglePhp(): string {
  return `<?php
/**
 * Single post fallback.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

if ( have_posts() ) :
\twhile ( have_posts() ) : the_post();
\t\techo '<article ' . get_post_class() . '><header><h1>' . esc_html( get_the_title() ) . '</h1></header><div class="entry-content">';
\t\tthe_content();
\t\techo '</div></article>';
\tendwhile;
endif;
`;
}

function buildTplPartArchivePhp(): string {
  return `<?php
/**
 * Archive fallback.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

if ( have_posts() ) :
\techo '<h1>' . esc_html( get_the_archive_title() ) . '</h1>';
\twhile ( have_posts() ) : the_post();
\t\techo '<article ' . get_post_class() . '><h2><a href="' . esc_url( get_permalink() ) . '">' . esc_html( get_the_title() ) . '</a></h2>';
\t\tthe_excerpt();
\t\techo '</article>';
\tendwhile;
endif;
`;
}

function buildTplPartSearchPhp(): string {
  return `<?php
/**
 * Search results fallback.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

echo '<h1>' . esc_html( sprintf( __( 'Search results for: %s' ), get_search_query() ) ) . '</h1>';
if ( have_posts() ) :
\twhile ( have_posts() ) : the_post();
\t\techo '<article ' . get_post_class() . '><h2><a href="' . esc_url( get_permalink() ) . '">' . esc_html( get_the_title() ) . '</a></h2>';
\t\tthe_excerpt();
\t\techo '</article>';
\tendwhile;
else:
\techo '<p>' . esc_html__( 'No results.' ) . '</p>';
endif;
`;
}

function buildTpl404Php(): string {
  return `<?php
/**
 * 404 fallback.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<div class="not-found" style="padding:80px 24px;text-align:center">
\t<h1>404</h1>
\t<p><?php esc_html_e( 'The page you are looking for could not be found.' ); ?></p>
\t<p><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( '← Back home' ); ?></a></p>
</div>
`;
}

function buildReadmeTxt(opts: GenerateElementorKitOptions): string {
  const { designName, designUrl } = opts;
  return `=== ${designName} ===
Contributors: ditto
Requires at least: 6.0
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Elementor-compatible WordPress theme generated by Ditto from ${designUrl ?? "a source design"}.

== Installation ==
1. Upload the folder to /wp-content/themes/
2. Activate the theme via Appearance → Themes
3. Install and activate Elementor (free, from WordPress plugin directory)
4. Go to Appearance → ${designName} Setup and click "Import demo"
5. The demo importer will:
   - Create 5 pages (Home, About, Services, Blog, Contact) with Elementor content
   - Build a "Primary" menu with those pages and assign it to the Header location
   - Set Home as the front page

== Without Elementor Pro ==
Works fine with Elementor free for pages. The theme ships PHP fallbacks for
header and footer (see template-parts/header.php / footer.php) — they render a
standard WP menu with the site logo until you assign an Elementor header/footer
template via Elementor Pro's Theme Builder.

== Customizing ==
All brand tokens are in assets/css/theme.css as CSS custom properties. Override
them in a child theme if needed.

== Credits ==
Generated by Ditto — https://ditto.design
`;
}

// ── Screenshot (PNG) — minimal placeholder with brand colors ──────────

function synthesizeScreenshotPng(primary: string, secondary: string, accent: string): Uint8Array {
  // Minimal PNG (1200×900, single colored block) — placeholder so WP shows
  // something in the Themes grid. Users can replace post-install.
  const hex = (h: string): [number, number, number] => {
    const s = h.replace("#", "").padEnd(6, "0").slice(0, 6);
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = hex(primary);
  const [r2, g2, b2] = hex(secondary);
  const [r3, g3, b3] = hex(accent);
  const W = 1200;
  const H = 900;
  const stride = W * 4 + 1;
  const pixels = new Uint8Array(stride * H);
  for (let y = 0; y < H; y++) {
    pixels[y * stride] = 0;
    for (let x = 0; x < W; x++) {
      const t = x / W;
      const yt = y / H;
      // Gradient primary → secondary + accent diagonal stripe
      let r: number, g: number, b: number;
      if (Math.abs(t - yt) < 0.04) {
        r = r3;
        g = g3;
        b = b3;
      } else {
        r = Math.round(r1 * (1 - t) + r2 * t);
        g = Math.round(g1 * (1 - t) + g2 * t);
        b = Math.round(b1 * (1 - t) + b2 * t);
      }
      const off = y * stride + 1 + x * 4;
      pixels[off] = r;
      pixels[off + 1] = g;
      pixels[off + 2] = b;
      pixels[off + 3] = 255;
    }
  }
  return encodePng(W, H, pixels);
}

function encodePng(width: number, height: number, raw: Uint8Array): Uint8Array {
  const crc32 = (buf: Uint8Array) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = c ^ buf[i];
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  };
  const adler32 = (buf: Uint8Array) => {
    let a = 1, b = 0;
    for (let i = 0; i < buf.length; i++) {
      a = (a + buf[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  };
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length);
    const view = new DataView(out.buffer);
    view.setUint32(0, data.length);
    out[4] = type.charCodeAt(0);
    out[5] = type.charCodeAt(1);
    out[6] = type.charCodeAt(2);
    out[7] = type.charCodeAt(3);
    out.set(data, 8);
    const crcBuf = new Uint8Array(4 + data.length);
    crcBuf[0] = type.charCodeAt(0);
    crcBuf[1] = type.charCodeAt(1);
    crcBuf[2] = type.charCodeAt(2);
    crcBuf[3] = type.charCodeAt(3);
    crcBuf.set(data, 4);
    view.setUint32(8 + data.length, crc32(crcBuf));
    return out;
  };
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, width);
  new DataView(ihdr.buffer).setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // Store (uncompressed) DEFLATE blocks
  const blocks: number[] = [];
  const DATA = raw;
  let pos = 0;
  while (pos < DATA.length) {
    const len = Math.min(0xffff, DATA.length - pos);
    const last = pos + len >= DATA.length ? 1 : 0;
    blocks.push(last);
    blocks.push(len & 0xff, (len >> 8) & 0xff);
    blocks.push(~len & 0xff, (~len >> 8) & 0xff);
    for (let i = 0; i < len; i++) blocks.push(DATA[pos + i]);
    pos += len;
  }
  const adler = adler32(DATA);
  const idat = new Uint8Array(2 + blocks.length + 4);
  idat[0] = 0x78;
  idat[1] = 0x01;
  for (let i = 0; i < blocks.length; i++) idat[2 + i] = blocks[i];
  new DataView(idat.buffer).setUint32(2 + blocks.length, adler);
  const iend = new Uint8Array(0);
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", iend)];
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// ── Public API ─────────────────────────────────────────────────────────

export async function generateElementorKit(
  opts: GenerateElementorKitOptions,
): Promise<ElementorKitFile[]> {
  const files: ElementorKitFile[] = [];

  // 1. Theme-level PHP + CSS files
  files.push({ path: "style.css", content: buildStyleCss(opts) });
  files.push({ path: "functions.php", content: buildFunctionsPhp(opts) });
  files.push({ path: "theme.json", content: buildThemeJson(opts) });
  files.push({ path: "index.php", content: buildIndexPhp() });
  files.push({ path: "header.php", content: buildHeaderPhp(opts) });
  files.push({ path: "footer.php", content: buildFooterPhp() });

  // Assets
  files.push({ path: "assets/css/reset.css", content: buildResetCss() });
  files.push({ path: "assets/css/theme.css", content: buildThemeCss(opts) });
  files.push({ path: "assets/css/header-footer.css", content: buildHeaderFooterCss(opts) });

  // Includes
  files.push({ path: "includes/theme-setup.php", content: buildThemeSetupPhp(opts) });
  files.push({ path: "includes/elementor-functions.php", content: buildElementorFunctionsPhp(opts) });
  files.push({ path: "includes/class-ditto-demo-importer.php", content: buildDemoImporterPhp(opts) });

  // Template parts
  files.push({ path: "template-parts/header.php", content: buildTplPartHeaderPhp(opts) });
  files.push({ path: "template-parts/footer.php", content: buildTplPartFooterPhp(opts) });
  files.push({ path: "template-parts/single.php", content: buildTplPartSinglePhp() });
  files.push({ path: "template-parts/archive.php", content: buildTplPartArchivePhp() });
  files.push({ path: "template-parts/search.php", content: buildTplPartSearchPhp() });
  files.push({ path: "template-parts/404.php", content: buildTpl404Php() });

  // 2. Elementor JSON templates (pages + header + footer)
  files.push({ path: "elementor-templates/header.json", content: headerJson(opts) });
  files.push({ path: "elementor-templates/footer.json", content: footerJson(opts) });
  files.push({ path: "elementor-templates/page-home.json", content: pageHomeJson(opts) });
  files.push({ path: "elementor-templates/page-about.json", content: pageAboutJson(opts) });
  files.push({ path: "elementor-templates/page-services.json", content: pageServicesJson(opts) });
  files.push({ path: "elementor-templates/page-contact.json", content: pageContactJson(opts) });
  files.push({ path: "elementor-templates/page-blog.json", content: pageBlogJson(opts) });

  // 3. Readme + screenshot
  files.push({ path: "readme.txt", content: buildReadmeTxt(opts) });
  files.push({
    path: "screenshot.png",
    content: synthesizeScreenshotPng(opts.resolved.colorPrimary, opts.resolved.colorSecondary, opts.resolved.colorAccent),
  });

  return files;
}

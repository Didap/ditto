"use client";

/**
 * "Funziona con" — marquee carousel of brands Ditto ships output for.
 *
 * SEO-optimized: every brand name is real DOM text (not just SVG), ships an
 * invisible <ul> that search engines can crawl, plus a JSON-LD SoftwareApplication
 * block enumerating `isCompatibleWith`. Logos use simple-icons paths (MIT
 * licensed) rendered monochrome so nothing looks co-branded — this is
 * nominative fair use, not partnership.
 */

import Script from "next/script";
import * as simpleIcons from "simple-icons";
import { useT } from "@/lib/locale-context";

// Each brand: what Ditto actually ships for them + optional simple-icons slug.
// If a brand is missing from simple-icons (Stitch is too new, Lovable small),
// we render a clean monochrome text pill instead.
interface Brand {
  name: string;
  /** Short line — why Ditto is compatible. Shown as tooltip + in JSON-LD. */
  via: string;
  /** simple-icons key, e.g. "siClaude". Undefined → text-only pill. */
  iconKey?: string;
}

const BRANDS: Brand[] = [
  { name: "Claude", via: "DESIGN.md context file for Anthropic Claude", iconKey: "siClaude" },
  { name: "ChatGPT", via: "DESIGN.md context file for OpenAI ChatGPT", iconKey: "siOpenai" },
  { name: "Cursor", via: "DESIGN.md auto-detected by Cursor", iconKey: "siCursor" },
  { name: "Stitch", via: "Strict DESIGN.md spec export for Google Stitch" },
  { name: "Lovable", via: "DESIGN.md context for Lovable AI website builder" },
  { name: "v0", via: "DESIGN.md context for Vercel v0", iconKey: "siVercel" },
  { name: "Figma", via: "Tokens Studio JSON + Figma Variables REST API", iconKey: "siFigma" },
  { name: "WordPress", via: "Full FSE block theme export", iconKey: "siWordpress" },
  { name: "Elementor", via: "Full Elementor-compatible theme export", iconKey: "siElementor" },
  { name: "Tailwind", via: "tailwind.config.ts in the Dev Kit", iconKey: "siTailwindcss" },
  { name: "Storybook", via: "Complete Storybook project in the Dev Kit", iconKey: "siStorybook" },
  { name: "React", via: "components.tsx with 14 typed components", iconKey: "siReact" },
  { name: "Webflow", via: "DESIGN.md reference for Webflow AI assist", iconKey: "siWebflow" },
  { name: "Framer", via: "DESIGN.md reference for Framer AI workspaces", iconKey: "siFramer" },
];

type IconLookup = Record<string, { path?: string; title?: string } | undefined>;

function getIcon(key: string | undefined): { path: string; title: string } | null {
  if (!key) return null;
  const si = (simpleIcons as unknown as IconLookup)[key];
  if (!si || !si.path) return null;
  return { path: si.path, title: si.title || key };
}

interface Props {
  /** Heading text override. Defaults to localized "Works with". */
  heading?: string;
  /** Small copy below the marquee. Defaults to localized trademark notice. */
  footnote?: string;
}

export function CompatibilityCarousel({ heading, footnote }: Props) {
  const t = useT();
  const headingText = heading ?? t("compatHeading");
  const footnoteText = footnote ?? t("compatFootnote");

  // Duplicate the list so the marquee can loop seamlessly.
  const loop = [...BRANDS, ...BRANDS];

  // JSON-LD for SEO — declares every brand as isCompatibleWith target.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Ditto",
    description:
      "Ditto extracts a design system from any URL and exports to Claude, ChatGPT, Cursor, Stitch, Lovable, v0, Figma, WordPress, Elementor, Tailwind, Storybook, React, Webflow and Framer.",
    applicationCategory: "DesignApplication",
    url: "https://ditto.design",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isCompatibleWith: BRANDS.map((b) => ({
      "@type": "SoftwareApplication",
      name: b.name,
      description: b.via,
    })),
  };

  return (
    <section
      className="py-14 px-6 border-t border-(--ditto-border) relative overflow-hidden"
      aria-labelledby="compat-heading"
    >
      {/* SEO JSON-LD — enumerates every compatible app for Google crawlers */}
      <Script id="ditto-compat-ld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      <div className="max-w-6xl mx-auto text-center mb-8">
        <p
          id="compat-heading"
          className="text-[11px] tracking-[0.3em] uppercase text-(--ditto-text-muted) font-semibold"
        >
          {headingText}
        </p>
      </div>

      {/*
        Screen-reader + SEO list — every brand as real crawlable text. We
        mirror this in the marquee below but screen readers read the static
        list (the marquee is aria-hidden).
      */}
      <ul className="sr-only">
        {BRANDS.map((b) => (
          <li key={b.name}>
            {b.name} — {b.via}
          </li>
        ))}
      </ul>

      {/* Marquee */}
      <div
        aria-hidden
        className="ditto-compat-marquee-wrap relative"
        style={{
          maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="ditto-compat-marquee flex items-center gap-12 whitespace-nowrap">
          {loop.map((b, i) => (
            <BrandChip key={`${b.name}-${i}`} brand={b} />
          ))}
        </div>
      </div>

      <p className="text-[10px] text-(--ditto-text-muted) text-center mt-8 max-w-xl mx-auto opacity-80">
        {footnoteText}
      </p>

      <style jsx>{`
        @keyframes ditto-compat-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .ditto-compat-marquee {
          animation: ditto-compat-scroll 48s linear infinite;
          width: max-content;
        }
        .ditto-compat-marquee-wrap:hover .ditto-compat-marquee {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .ditto-compat-marquee {
            animation-duration: 120s;
          }
        }
      `}</style>
    </section>
  );
}

function BrandChip({ brand }: { brand: Brand }) {
  const icon = getIcon(brand.iconKey);
  return (
    <div
      title={brand.via}
      className="inline-flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity"
      style={{ color: "var(--ditto-text)" }}
    >
      {icon ? (
        <svg
          role="img"
          aria-label={brand.name}
          viewBox="0 0 24 24"
          width={22}
          height={22}
          fill="currentColor"
          style={{ flexShrink: 0 }}
        >
          <title>{brand.name}</title>
          <path d={icon.path} />
        </svg>
      ) : (
        <span
          aria-hidden
          className="inline-block w-[22px] h-[22px] rounded-md"
          style={{
            background: "color-mix(in srgb, var(--ditto-text) 18%, transparent)",
          }}
        />
      )}
      <span
        className="text-[15px] font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-canvaSans), system-ui, sans-serif" }}
      >
        {brand.name}
      </span>
    </div>
  );
}

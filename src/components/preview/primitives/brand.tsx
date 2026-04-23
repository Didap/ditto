"use client";

import React, { createContext, useContext } from "react";
import type { HeaderVariant } from "@/lib/types";
import { Button } from "./index";

// ── Brand context ─────────────────────────────────────────────────────────
// PreviewShell wraps the tree with BrandProvider so every preview page (and
// every exported Nav) can resolve the brand without prop drilling.

export interface BrandContextValue {
  /** URL of the user's logo. Absent → Ditto placeholder. */
  logoUrl?: string;
  /** Display name shown next to the logo / in footer. */
  name: string;
  /** Which header variant to render. */
  headerVariant: HeaderVariant;
  /** Nav labels (override default Home/Features/Pricing/Blog). */
  navLinks?: string[];
}

const DEFAULT_CONTEXT: BrandContextValue = {
  name: "Brand",
  headerVariant: "classic",
};

const BrandContext = createContext<BrandContextValue>(DEFAULT_CONTEXT);

export function BrandProvider({
  value,
  children,
}: {
  value: Partial<BrandContextValue>;
  children: React.ReactNode;
}) {
  const resolved: BrandContextValue = {
    ...DEFAULT_CONTEXT,
    ...value,
    headerVariant: value.headerVariant || DEFAULT_CONTEXT.headerVariant,
    name: value.name || DEFAULT_CONTEXT.name,
  };
  return <BrandContext.Provider value={resolved}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  return useContext(BrandContext);
}

// ── Logo placeholder ──────────────────────────────────────────────────────
// Two semicircles in --d-primary and --d-secondary forming a full circle.
// Renders when the user hasn't uploaded a custom logo.

export function LogoPlaceholder({
  size = 28,
  title = "Brand mark",
}: {
  size?: number;
  title?: string;
}) {
  return (
    <svg
      role="img"
      aria-label={title}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path d="M16 0 A16 16 0 0 1 16 32 Z" fill="var(--d-primary)" />
      <path d="M16 0 A16 16 0 0 0 16 32 Z" fill="var(--d-secondary)" />
    </svg>
  );
}

// ── Brand mark (logo + name) ──────────────────────────────────────────────

export function BrandMark({
  size = 28,
  showName = true,
  nameSize = "1rem",
  nameWeight = 700,
}: {
  size?: number;
  showName?: boolean;
  nameSize?: string;
  nameWeight?: number;
}) {
  const { logoUrl, name } = useBrand();
  return (
    <span className="inline-flex items-center gap-2">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          style={{
            height: size,
            width: "auto",
            maxWidth: size * 3,
            objectFit: "contain",
            display: "block",
          }}
        />
      ) : (
        <LogoPlaceholder size={size} title={name} />
      )}
      {showName && (
        <span
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
            fontWeight: nameWeight,
            fontSize: nameSize,
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </span>
      )}
    </span>
  );
}

// ── 4 Header variants ─────────────────────────────────────────────────────

interface HeaderProps {
  links?: string[];
  cta?: string;
}

const DEFAULT_LINKS = ["Home", "Features", "Pricing", "Blog"];

/** Classic — logo left, inline links, CTA right. Neutral, refined baseline. */
function NavClassic({ links = DEFAULT_LINKS, cta = "Get Started" }: HeaderProps) {
  return (
    <nav
      className="flex items-center justify-between px-6 py-3"
      style={{
        backgroundColor: "var(--d-bg)",
        borderBottom: "1px solid var(--d-border)",
      }}
    >
      <BrandMark />
      <div className="flex items-center gap-6">
        {links.map((link) => (
          <span
            key={link}
            className="text-[0.875rem] cursor-pointer transition-colors"
            style={{ color: "var(--d-text-secondary)" }}
          >
            {link}
          </span>
        ))}
        <Button size="sm">{cta}</Button>
      </div>
    </nav>
  );
}

/** Elegante — logo centered above, nav below with wide tracking, thin dividers. */
function NavElegante({ links = DEFAULT_LINKS, cta = "Get Started" }: HeaderProps) {
  return (
    <nav
      className="flex flex-col items-center px-6 pt-6 pb-0"
      style={{ backgroundColor: "var(--d-bg)" }}
    >
      {/* Top row — logo centered, CTA far right */}
      <div className="w-full flex items-center justify-between mb-5">
        <span className="w-24" />
        <BrandMark size={32} nameSize="1.25rem" nameWeight={500} />
        <div className="w-24 flex justify-end">
          <button
            className="text-[0.75rem] tracking-[0.2em] uppercase cursor-pointer transition-colors"
            style={{ color: "var(--d-text-secondary)" }}
          >
            {cta}
          </button>
        </div>
      </div>
      {/* Divider */}
      <div
        className="w-full h-px mb-0"
        style={{ backgroundColor: "var(--d-border)" }}
      />
      {/* Nav row */}
      <div className="flex items-center justify-center gap-10 py-3">
        {links.map((link) => (
          <span
            key={link}
            className="text-[0.75rem] tracking-[0.22em] uppercase cursor-pointer transition-colors"
            style={{ color: "var(--d-text-secondary)" }}
          >
            {link}
          </span>
        ))}
      </div>
      <div
        className="w-full h-px"
        style={{ backgroundColor: "var(--d-border)" }}
      />
    </nav>
  );
}

/** Artistico — asymmetric: logo with accent halo, floating pill nav, oversized CTA. */
function NavArtistico({ links = DEFAULT_LINKS, cta = "Get Started" }: HeaderProps) {
  return (
    <nav
      className="relative flex items-center justify-between px-6 py-5"
      style={{ backgroundColor: "var(--d-bg)" }}
    >
      {/* Logo with accent halo */}
      <div className="relative">
        <span
          aria-hidden
          className="absolute -left-2 -top-2 w-10 h-10 rounded-full"
          style={{
            backgroundColor: "var(--d-accent)",
            opacity: 0.25,
            filter: "blur(2px)",
          }}
        />
        <span className="relative">
          <BrandMark size={32} nameSize="1.125rem" nameWeight={800} />
        </span>
      </div>

      {/* Floating pill nav with backdrop-blur */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--d-surface) 80%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--d-border)",
          borderRadius: "var(--d-radius-full)",
          boxShadow: "var(--d-shadow-sm)",
        }}
      >
        {links.map((link, i) => (
          <span
            key={link}
            className="px-3 py-1 text-[0.8125rem] cursor-pointer transition-colors"
            style={{
              color: i === 0 ? "var(--d-text-primary)" : "var(--d-text-secondary)",
              backgroundColor:
                i === 0
                  ? "color-mix(in srgb, var(--d-primary) 12%, transparent)"
                  : "transparent",
              borderRadius: "var(--d-radius-full)",
              fontWeight: i === 0 ? 600 : 400,
            }}
          >
            {link}
          </span>
        ))}
      </div>

      {/* Outlined artistic CTA */}
      <button
        className="relative inline-flex items-center gap-2 px-5 py-2 text-[0.875rem] font-semibold cursor-pointer transition-all"
        style={{
          color: "var(--d-text-primary)",
          backgroundColor: "transparent",
          border: "2px solid var(--d-text-primary)",
          borderRadius: "var(--d-radius-full)",
        }}
      >
        {cta}
        <span aria-hidden style={{ color: "var(--d-accent)" }}>
          ✦
        </span>
      </button>
    </nav>
  );
}

/** Fresco — compact sticky pill shell, icons before links, gradient CTA. */
function NavFresco({ links = DEFAULT_LINKS, cta = "Start free" }: HeaderProps) {
  const dots = ["●", "◆", "■", "▲", "★", "◉"];
  return (
    <nav className="px-4 pt-4" style={{ backgroundColor: "var(--d-bg)" }}>
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          backgroundColor: "var(--d-surface)",
          border: "1px solid var(--d-border)",
          borderRadius: "var(--d-radius-full)",
          boxShadow: "var(--d-shadow-sm)",
        }}
      >
        <BrandMark size={26} nameSize="0.9375rem" nameWeight={700} />
        <div className="flex items-center gap-1">
          {links.map((link, i) => (
            <span
              key={link}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.8125rem] cursor-pointer transition-colors"
              style={{
                color: "var(--d-text-secondary)",
                borderRadius: "var(--d-radius-full)",
              }}
            >
              <span
                aria-hidden
                className="text-[0.625rem]"
                style={{ color: "var(--d-primary)" }}
              >
                {dots[i % dots.length]}
              </span>
              {link}
            </span>
          ))}
        </div>
        <button
          className="inline-flex items-center px-4 py-1.5 text-[0.8125rem] font-semibold cursor-pointer transition-all"
          style={{
            color: "var(--d-on-primary)",
            background:
              "linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%)",
            borderRadius: "var(--d-radius-full)",
            boxShadow: "var(--d-shadow-sm)",
          }}
        >
          {cta}
        </button>
      </div>
    </nav>
  );
}

/** Variant router — picks the right header based on the Brand context. */
export function Nav({ links }: { links?: string[] }) {
  const { headerVariant, navLinks } = useBrand();
  const effectiveLinks = links || navLinks;
  switch (headerVariant) {
    case "elegante":
      return <NavElegante links={effectiveLinks} />;
    case "artistico":
      return <NavArtistico links={effectiveLinks} />;
    case "fresco":
      return <NavFresco links={effectiveLinks} />;
    case "classic":
    default:
      return <NavClassic links={effectiveLinks} />;
  }
}

/** Copy used by DESIGN.md + editor. Keep synced with the variant implementations. */
export const HEADER_VARIANT_DESCRIPTIONS: Record<
  HeaderVariant,
  { label: string; tagline: string; description: string }
> = {
  classic: {
    label: "Classic",
    tagline: "Timeless and refined",
    description:
      "Logo on the left, inline navigation links, primary CTA on the right. A neutral baseline that fits most B2B and productivity brands.",
  },
  elegante: {
    label: "Elegante",
    tagline: "Editorial and quiet",
    description:
      "Logo centered above a thin divider, nav labels below in wide-tracked uppercase. Reads like a magazine masthead — great for fashion, editorial, and luxury brands.",
  },
  artistico: {
    label: "Artistico",
    tagline: "Asymmetric and expressive",
    description:
      "Logo with an accent-color halo, a floating pill-shaped navigation with backdrop blur, and an outlined CTA with a decorative accent mark. For creative studios and bold brands.",
  },
  fresco: {
    label: "Fresco",
    tagline: "Compact and playful",
    description:
      "Full pill-shaped header with a soft shadow, colored dot indicators before each link, and a gradient CTA using the primary and secondary colors. Friendly, modern SaaS vibe.",
  },
};

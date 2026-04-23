"use client";

/**
 * Landing section primitives — 4 variants × 6 sections (Hero, Features, Stats,
 * Reviews, CTA, Footer). Each public component (`<Hero/>`, `<Features/>`, etc.)
 * reads its variant from the Brand context so LandingPreview and every export
 * just drop in `<Hero/>` and get whatever style the user picked.
 *
 * Variant vocabulary is shared with the header:
 *   - classic    — neutral, refined baseline
 *   - elegante   — editorial, wide tracking, hairlines
 *   - artistico  — asymmetric, accent halos, backdrop blur
 *   - fresco     — compact, pill shapes, gradients
 */

import React from "react";
import { Zap, Shield, Link2, Quote } from "lucide-react";
import { Button, Card, Input, Badge, Avatar } from "./index";
import { useBrand, BrandMark } from "./brand";
import type { SectionVariant } from "@/lib/types";

// ════════════════════════════════════════════════════════════════════════
// HERO
// ════════════════════════════════════════════════════════════════════════

interface HeroProps {
  title?: string;
  subtitle?: string;
  cta?: string;
  secondaryCta?: string;
  badge?: string;
}

function HeroClassic({
  title = "Build beautiful products\nfaster than ever",
  subtitle = "The modern platform for teams who want to ship great experiences. Design, develop, and deploy — all in one place.",
  cta = "Get Started Free",
  secondaryCta = "View Demo",
  badge = "New Release v2.0",
}: HeroProps) {
  return (
    <section className="px-8 py-20 text-center">
      <Badge>{badge}</Badge>
      <h1
        className="mt-4 text-[2.5rem] leading-tight tracking-tight whitespace-pre-line"
        style={{
          color: "var(--d-text-primary)",
          fontFamily: "var(--d-font-heading)",
          fontWeight: "var(--d-weight-heading)",
        }}
      >
        {title}
      </h1>
      <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: "var(--d-text-secondary)" }}>
        {subtitle}
      </p>
      <div className="mt-8 flex gap-3 justify-center">
        <Button size="lg">{cta}</Button>
        <Button variant="secondary" size="lg">{secondaryCta}</Button>
      </div>
    </section>
  );
}

function HeroElegante({
  title = "Build beautiful products\nfaster than ever",
  subtitle = "The modern platform for teams who want to ship great experiences.",
  cta = "Begin the journey",
  badge = "New Collection",
}: HeroProps) {
  return (
    <section className="px-8 py-24 text-center" style={{ backgroundColor: "var(--d-bg)" }}>
      <div className="max-w-3xl mx-auto">
        <div
          className="mb-8 text-[0.6875rem] tracking-[0.3em] uppercase"
          style={{ color: "var(--d-text-muted)" }}
        >
          — {badge} —
        </div>
        <h1
          className="text-[3.5rem] leading-[1.05] tracking-[-0.02em] whitespace-pre-line"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
            fontWeight: 400,
          }}
        >
          {title}
        </h1>
        <div
          className="mx-auto my-10 h-px w-24"
          style={{ backgroundColor: "var(--d-text-muted)" }}
        />
        <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: "var(--d-text-secondary)" }}>
          {subtitle}
        </p>
        <button
          className="mt-10 inline-flex items-center gap-3 px-8 py-3 text-[0.75rem] tracking-[0.22em] uppercase cursor-pointer transition-colors"
          style={{
            color: "var(--d-text-primary)",
            backgroundColor: "transparent",
            border: "1px solid var(--d-text-primary)",
            borderRadius: 0,
          }}
        >
          {cta}
          <span style={{ fontSize: "0.875rem" }}>→</span>
        </button>
      </div>
    </section>
  );
}

function HeroArtistico({
  title = "Build beautiful products\nfaster than ever",
  subtitle = "The modern platform for teams who want to ship great experiences. Design, develop, and deploy — all in one place.",
  cta = "Get Started",
  secondaryCta = "View Demo",
  badge = "✦ New Release",
}: HeroProps) {
  return (
    <section className="relative overflow-hidden px-8 py-20">
      {/* Decorative accent shapes */}
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-72 h-72 rounded-full"
        style={{
          backgroundColor: "var(--d-accent)",
          opacity: 0.18,
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="absolute top-32 right-24 w-32 h-32 rounded-full"
        style={{
          backgroundColor: "var(--d-primary)",
          opacity: 0.35,
        }}
      />
      <div
        aria-hidden
        className="absolute top-44 right-48 w-20 h-20 rounded-full"
        style={{
          backgroundColor: "var(--d-secondary)",
          opacity: 0.6,
        }}
      />

      <div className="relative grid grid-cols-[1.3fr_1fr] gap-10 items-center max-w-6xl mx-auto">
        <div>
          <span
            className="inline-block px-3 py-1 text-[0.75rem] font-semibold transform -rotate-2"
            style={{
              backgroundColor: "var(--d-accent)",
              color: "var(--d-text-primary)",
              borderRadius: "var(--d-radius-sm)",
            }}
          >
            {badge}
          </span>
          <h1
            className="mt-6 text-[3.25rem] leading-[1.05] tracking-[-0.03em] whitespace-pre-line"
            style={{
              color: "var(--d-text-primary)",
              fontFamily: "var(--d-font-heading)",
              fontWeight: 800,
            }}
          >
            {title}
          </h1>
          <p className="mt-5 text-lg max-w-lg" style={{ color: "var(--d-text-secondary)" }}>
            {subtitle}
          </p>
          <div className="mt-8 flex gap-3">
            <button
              className="inline-flex items-center gap-2 px-6 py-3 text-[0.9375rem] font-semibold cursor-pointer transition-all"
              style={{
                backgroundColor: "var(--d-text-primary)",
                color: "var(--d-bg)",
                borderRadius: "var(--d-radius-full)",
              }}
            >
              {cta}
              <span aria-hidden style={{ color: "var(--d-accent)" }}>✦</span>
            </button>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 text-[0.9375rem] font-medium cursor-pointer"
              style={{
                backgroundColor: "transparent",
                color: "var(--d-text-primary)",
                border: "2px solid var(--d-text-primary)",
                borderRadius: "var(--d-radius-full)",
              }}
            >
              {secondaryCta}
            </button>
          </div>
        </div>
        {/* Right: nested decorative card */}
        <div
          className="relative aspect-square rounded-[var(--d-radius-lg)] overflow-hidden"
          style={{
            backgroundColor: "var(--d-surface)",
            border: "1px solid var(--d-border)",
          }}
        >
          <div
            className="absolute inset-6 rounded-[var(--d-radius-md)]"
            style={{
              background:
                "linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%)",
              opacity: 0.9,
            }}
          />
          <div
            className="absolute bottom-10 right-10 w-16 h-16 rounded-full"
            style={{ backgroundColor: "var(--d-accent)" }}
          />
        </div>
      </div>
    </section>
  );
}

function HeroFresco({
  title = "Build beautiful products\nfaster than ever",
  subtitle = "The modern platform for teams who want to ship great experiences.",
  cta = "Start free",
  secondaryCta = "See how",
  badge = "🎉 Now live",
}: HeroProps) {
  return (
    <section className="px-6 py-12">
      <div
        className="relative mx-auto max-w-5xl overflow-hidden text-center"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--d-primary) 10%, var(--d-surface)) 0%, color-mix(in srgb, var(--d-secondary) 12%, var(--d-surface)) 100%)",
          borderRadius: "var(--d-radius-lg)",
          padding: "4rem 2rem",
          border: "1px solid var(--d-border)",
        }}
      >
        {/* Pill badge with emoji */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 text-[0.75rem] font-semibold"
          style={{
            backgroundColor: "var(--d-bg)",
            color: "var(--d-text-primary)",
            borderRadius: "var(--d-radius-full)",
            border: "1px solid var(--d-border)",
          }}
        >
          {badge}
        </span>
        <h1
          className="mt-5 text-[2.75rem] leading-[1.08] tracking-tight whitespace-pre-line"
          style={{
            fontFamily: "var(--d-font-heading)",
            fontWeight: 800,
            backgroundImage:
              "linear-gradient(135deg, var(--d-primary), var(--d-secondary))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </h1>
        <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: "var(--d-text-secondary)" }}>
          {subtitle}
        </p>
        <div className="mt-7 flex gap-3 justify-center flex-wrap">
          <button
            className="inline-flex items-center gap-2 px-6 py-2.5 text-[0.9375rem] font-semibold cursor-pointer"
            style={{
              color: "var(--d-on-primary)",
              background:
                "linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%)",
              borderRadius: "var(--d-radius-full)",
              boxShadow: "var(--d-shadow-md)",
              border: "none",
            }}
          >
            {cta}
            <span aria-hidden>→</span>
          </button>
          <button
            className="inline-flex items-center gap-2 px-6 py-2.5 text-[0.9375rem] font-medium cursor-pointer"
            style={{
              backgroundColor: "var(--d-bg)",
              color: "var(--d-text-primary)",
              borderRadius: "var(--d-radius-full)",
              border: "1px solid var(--d-border)",
            }}
          >
            {secondaryCta}
          </button>
        </div>
      </div>
    </section>
  );
}

export function Hero(props?: HeroProps) {
  const { heroVariant } = useBrand();
  switch (heroVariant) {
    case "elegante": return <HeroElegante {...props} />;
    case "artistico": return <HeroArtistico {...props} />;
    case "fresco": return <HeroFresco {...props} />;
    case "classic":
    default: return <HeroClassic {...props} />;
  }
}

// ════════════════════════════════════════════════════════════════════════
// FEATURES
// ════════════════════════════════════════════════════════════════════════

interface FeatureItem {
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
}

const DEFAULT_FEATURES: FeatureItem[] = [
  { title: "Lightning Fast", desc: "Built for speed with optimized rendering and smart caching.", Icon: Zap },
  { title: "Fully Secure", desc: "Enterprise-grade security with end-to-end encryption.", Icon: Shield },
  { title: "Easy Integration", desc: "Connect with your favorite tools in just a few clicks.", Icon: Link2 },
];

interface FeaturesProps {
  title?: string;
  items?: FeatureItem[];
}

function FeaturesClassic({ title = "Everything you need", items = DEFAULT_FEATURES }: FeaturesProps) {
  return (
    <section className="px-8 py-16" style={{ backgroundColor: "var(--d-surface)" }}>
      <h2
        className="text-2xl font-bold text-center mb-10"
        style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
        {items.map((feature) => (
          <Card key={feature.title} className="p-6" hover>
            <div className="mb-3">
              <feature.Icon className="w-6 h-6" style={{ color: "var(--d-primary)" }} strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold mb-2" style={{ color: "var(--d-text-primary)" }}>
              {feature.title}
            </h3>
            <p className="text-sm" style={{ color: "var(--d-text-secondary)" }}>{feature.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FeaturesElegante({ title = "What sets us apart", items = DEFAULT_FEATURES }: FeaturesProps) {
  return (
    <section className="px-8 py-20" style={{ backgroundColor: "var(--d-bg)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div
            className="text-[0.6875rem] tracking-[0.3em] uppercase mb-3"
            style={{ color: "var(--d-text-muted)" }}
          >
            — Features —
          </div>
          <h2
            className="text-3xl tracking-tight"
            style={{
              color: "var(--d-text-primary)",
              fontFamily: "var(--d-font-heading)",
              fontWeight: 400,
            }}
          >
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-3">
          {items.map((item, i) => (
            <div
              key={item.title}
              className="px-8 py-2"
              style={{
                borderRight: i < items.length - 1 ? "1px solid var(--d-border)" : undefined,
              }}
            >
              <div
                className="text-[2rem] tracking-tight mb-4"
                style={{
                  fontFamily: "var(--d-font-heading)",
                  fontWeight: 300,
                  color: "var(--d-text-muted)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                className="text-[0.6875rem] tracking-[0.22em] uppercase mb-3"
                style={{ color: "var(--d-text-muted)" }}
              >
                {item.title}
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--d-text-secondary)" }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesArtistico({ title = "Everything you need", items = DEFAULT_FEATURES }: FeaturesProps) {
  const tints = ["var(--d-primary)", "var(--d-secondary)", "var(--d-accent)"];
  return (
    <section className="relative overflow-hidden px-8 py-20">
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-[2.25rem] tracking-[-0.02em] mb-12 text-center"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
            fontWeight: 800,
          }}
        >
          {title}
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {items.map((item, i) => {
            const rotate = i === 0 ? "-rotate-1" : i === 1 ? "rotate-1" : "-rotate-1";
            return (
              <div
                key={item.title}
                className={`relative p-6 ${rotate} transition-transform hover:rotate-0`}
                style={{
                  backgroundColor: "var(--d-surface)",
                  border: "2px solid var(--d-text-primary)",
                  borderRadius: "var(--d-radius-lg)",
                }}
              >
                <div
                  aria-hidden
                  className="absolute -top-3 -left-3 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: tints[i % tints.length] }}
                >
                  <item.Icon
                    className="w-5 h-5"
                    style={{ color: "var(--d-bg)" }}
                    strokeWidth={2}
                  />
                </div>
                <h3
                  className="mt-6 text-lg mb-2"
                  style={{
                    color: "var(--d-text-primary)",
                    fontFamily: "var(--d-font-heading)",
                    fontWeight: 700,
                  }}
                >
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--d-text-secondary)" }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesFresco({ title = "Everything you need", items = DEFAULT_FEATURES }: FeaturesProps) {
  return (
    <section className="px-6 py-16" style={{ backgroundColor: "var(--d-bg)" }}>
      <h2
        className="text-[1.75rem] font-bold text-center mb-8"
        style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
        {items.map((item) => (
          <div
            key={item.title}
            className="relative p-5"
            style={{
              backgroundColor: "var(--d-surface)",
              borderRadius: "var(--d-radius-lg)",
              border: "1px solid var(--d-border)",
              boxShadow: "var(--d-shadow-sm)",
            }}
          >
            <div
              aria-hidden
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: "linear-gradient(90deg, var(--d-primary), var(--d-secondary))",
                borderTopLeftRadius: "var(--d-radius-lg)",
                borderTopRightRadius: "var(--d-radius-lg)",
              }}
            />
            <div
              className="inline-flex items-center justify-center w-10 h-10 mb-3"
              style={{
                borderRadius: "var(--d-radius-full)",
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--d-primary) 15%, transparent), color-mix(in srgb, var(--d-secondary) 15%, transparent))",
              }}
            >
              <item.Icon className="w-5 h-5" style={{ color: "var(--d-primary)" }} strokeWidth={2} />
            </div>
            <h3
              className="text-base font-bold mb-1.5"
              style={{ color: "var(--d-text-primary)" }}
            >
              {item.title}
            </h3>
            <p className="text-sm" style={{ color: "var(--d-text-secondary)" }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Features(props?: FeaturesProps) {
  const { featuresVariant } = useBrand();
  switch (featuresVariant) {
    case "elegante": return <FeaturesElegante {...props} />;
    case "artistico": return <FeaturesArtistico {...props} />;
    case "fresco": return <FeaturesFresco {...props} />;
    case "classic":
    default: return <FeaturesClassic {...props} />;
  }
}

// ════════════════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════════════════

interface StatsProps {
  items?: Array<{ label: string; value: string }>;
}

const DEFAULT_STATS = [
  { label: "Active Users", value: "12,000+" },
  { label: "Uptime", value: "99.99%" },
  { label: "Countries", value: "40+" },
];

function StatsClassic({ items = DEFAULT_STATS }: StatsProps) {
  return (
    <section className="px-8 pb-16">
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
        {items.map((stat) => (
          <div key={stat.label} className="text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
            >
              {stat.value}
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--d-text-muted)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsElegante({ items = DEFAULT_STATS }: StatsProps) {
  return (
    <section className="px-8 py-16" style={{ backgroundColor: "var(--d-bg)" }}>
      <div className="grid grid-cols-3 max-w-4xl mx-auto">
        {items.map((stat, i) => (
          <div
            key={stat.label}
            className="text-center px-6"
            style={{
              borderRight: i < items.length - 1 ? "1px solid var(--d-border)" : undefined,
            }}
          >
            <div
              className="text-[3rem] tracking-tight"
              style={{
                color: "var(--d-text-primary)",
                fontFamily: "var(--d-font-heading)",
                fontWeight: 300,
              }}
            >
              {stat.value}
            </div>
            <div
              className="mt-3 text-[0.6875rem] tracking-[0.22em] uppercase"
              style={{ color: "var(--d-text-muted)" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsArtistico({ items = DEFAULT_STATS }: StatsProps) {
  const tints = ["var(--d-primary)", "var(--d-secondary)", "var(--d-accent)"];
  return (
    <section className="relative px-8 pb-16 pt-4">
      <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
        {items.map((stat, i) => (
          <div
            key={stat.label}
            className="relative p-6"
            style={{
              backgroundColor: "var(--d-surface)",
              border: "2px solid var(--d-text-primary)",
              borderRadius: "var(--d-radius-lg)",
              transform: i === 1 ? "translateY(-12px)" : i === 2 ? "translateY(4px)" : "none",
            }}
          >
            <div
              aria-hidden
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full"
              style={{ backgroundColor: tints[i % tints.length] }}
            />
            <div
              className="relative text-[2.25rem] leading-none tracking-[-0.02em]"
              style={{
                color: "var(--d-text-primary)",
                fontFamily: "var(--d-font-heading)",
                fontWeight: 800,
              }}
            >
              {stat.value}
            </div>
            <div
              className="relative mt-2 text-sm font-medium"
              style={{ color: "var(--d-text-secondary)" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsFresco({ items = DEFAULT_STATS }: StatsProps) {
  return (
    <section className="px-6 pb-12 pt-2">
      <div className="flex gap-3 justify-center flex-wrap max-w-4xl mx-auto">
        {items.map((stat) => (
          <div
            key={stat.label}
            className="flex items-baseline gap-2 px-5 py-3"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--d-primary) 10%, var(--d-surface)) 0%, color-mix(in srgb, var(--d-secondary) 10%, var(--d-surface)) 100%)",
              border: "1px solid var(--d-border)",
              borderRadius: "var(--d-radius-full)",
              boxShadow: "var(--d-shadow-sm)",
            }}
          >
            <span
              className="text-[1.375rem] font-bold"
              style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
            >
              {stat.value}
            </span>
            <span className="text-xs" style={{ color: "var(--d-text-muted)" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Stats(props?: StatsProps) {
  const { statsVariant } = useBrand();
  switch (statsVariant) {
    case "elegante": return <StatsElegante {...props} />;
    case "artistico": return <StatsArtistico {...props} />;
    case "fresco": return <StatsFresco {...props} />;
    case "classic":
    default: return <StatsClassic {...props} />;
  }
}

// ════════════════════════════════════════════════════════════════════════
// REVIEWS
// ════════════════════════════════════════════════════════════════════════

interface ReviewItem {
  name: string;
  role: string;
  initials: string;
  text: string;
  rating: number;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  { name: "Sarah Chen", role: "Product Designer", initials: "SC", text: "This tool has completely changed how we approach design systems. The extraction is incredibly accurate and saves us weeks of work.", rating: 5 },
  { name: "James Wilson", role: "Frontend Lead", initials: "JW", text: "We've tried many design tools but nothing comes close. The generated components work perfectly with our existing codebase.", rating: 5 },
  { name: "Maria Lopez", role: "CTO at StartupXYZ", initials: "ML", text: "The ability to blend multiple design inspirations into a cohesive system is a game changer. Highly recommended.", rating: 4 },
];

interface ReviewsProps {
  items?: ReviewItem[];
  title?: string;
}

function ReviewsClassic({ items = DEFAULT_REVIEWS, title = "What Our Users Say" }: ReviewsProps) {
  return (
    <section className="px-8 py-16">
      <h2
        className="text-xl font-bold mb-8 text-center"
        style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-5 max-w-5xl mx-auto">
        {items.map((item) => (
          <div
            key={item.name}
            className="p-5"
            style={{
              backgroundColor: "var(--d-surface)",
              border: "1px solid var(--d-border)",
              borderRadius: "var(--d-radius-lg)",
            }}
          >
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-sm" style={{ color: i < item.rating ? "var(--d-warning)" : "var(--d-border)" }}>
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--d-text-secondary)" }}>
              &ldquo;{item.text}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <Avatar name={item.initials} size={32} />
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--d-text-primary)" }}>{item.name}</div>
                <div className="text-xs" style={{ color: "var(--d-text-muted)" }}>{item.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsElegante({ items = DEFAULT_REVIEWS }: ReviewsProps) {
  const top = items[0];
  return (
    <section className="px-8 py-24" style={{ backgroundColor: "var(--d-bg)" }}>
      <div className="max-w-3xl mx-auto text-center">
        <div
          className="text-[0.6875rem] tracking-[0.3em] uppercase mb-6"
          style={{ color: "var(--d-text-muted)" }}
        >
          — Testimonial —
        </div>
        <div
          className="text-[5rem] leading-none mb-4"
          style={{
            color: "var(--d-text-muted)",
            fontFamily: "var(--d-font-heading)",
            fontWeight: 300,
          }}
        >
          &ldquo;
        </div>
        <p
          className="text-2xl leading-[1.5]"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
            fontWeight: 400,
          }}
        >
          {top.text}
        </p>
        <div className="mx-auto my-10 h-px w-16" style={{ backgroundColor: "var(--d-text-muted)" }} />
        <div
          className="text-[0.8125rem] tracking-[0.15em] uppercase"
          style={{ color: "var(--d-text-secondary)" }}
        >
          {top.name} <span style={{ color: "var(--d-text-muted)" }}>·</span> {top.role}
        </div>
      </div>
    </section>
  );
}

function ReviewsArtistico({ items = DEFAULT_REVIEWS, title = "What Our Users Say" }: ReviewsProps) {
  const tints = ["var(--d-primary)", "var(--d-secondary)", "var(--d-accent)"];
  return (
    <section className="relative px-8 py-20 overflow-hidden">
      <h2
        className="text-[2.25rem] tracking-[-0.02em] mb-12 text-center"
        style={{
          color: "var(--d-text-primary)",
          fontFamily: "var(--d-font-heading)",
          fontWeight: 800,
        }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
        {items.map((item, i) => {
          const offset = i === 0 ? "translate-y-0" : i === 1 ? "translate-y-8" : "-translate-y-3";
          return (
            <div
              key={item.name}
              className={`relative p-6 ${offset}`}
              style={{
                backgroundColor: "var(--d-surface)",
                border: "2px solid var(--d-text-primary)",
                borderRadius: "var(--d-radius-lg)",
              }}
            >
              <Quote
                aria-hidden
                className="absolute -top-4 -left-2 w-10 h-10"
                style={{ color: tints[i % tints.length], fill: tints[i % tints.length] }}
                strokeWidth={0}
              />
              <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--d-text-secondary)" }}>
                {item.text}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="inline-flex items-center justify-center w-10 h-10 text-xs font-bold"
                  style={{
                    backgroundColor: tints[i % tints.length],
                    color: "var(--d-bg)",
                    borderRadius: "var(--d-radius-full)",
                  }}
                >
                  {item.initials}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--d-text-primary)" }}>{item.name}</div>
                  <div className="text-xs" style={{ color: "var(--d-text-muted)" }}>{item.role}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReviewsFresco({ items = DEFAULT_REVIEWS, title = "Loved by teams" }: ReviewsProps) {
  return (
    <section className="px-6 py-16" style={{ backgroundColor: "var(--d-surface)" }}>
      <h2
        className="text-[1.75rem] font-bold mb-8 text-center"
        style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto">
        {items.map((item) => (
          <div
            key={item.name}
            className="relative p-5"
            style={{
              backgroundColor: "var(--d-bg)",
              borderRadius: "var(--d-radius-lg)",
              border: "1px solid var(--d-border)",
              boxShadow: "var(--d-shadow-sm)",
            }}
          >
            <div className="mb-3 text-sm">
              {Array.from({ length: item.rating }).map((_, i) => (
                <span key={i} style={{ color: "var(--d-warning)" }}>★</span>
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--d-text-secondary)" }}>
              {item.text}
            </p>
            <div className="flex items-center gap-2.5">
              <div
                className="inline-flex items-center justify-center w-9 h-9 text-[0.75rem] font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--d-primary), var(--d-secondary))",
                  color: "var(--d-on-primary)",
                  borderRadius: "var(--d-radius-full)",
                }}
              >
                {item.initials}
              </div>
              <div>
                <div className="text-[0.8125rem] font-semibold" style={{ color: "var(--d-text-primary)" }}>{item.name}</div>
                <div className="text-[0.6875rem]" style={{ color: "var(--d-text-muted)" }}>{item.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Reviews(props?: ReviewsProps) {
  const { reviewsVariant } = useBrand();
  switch (reviewsVariant) {
    case "elegante": return <ReviewsElegante {...props} />;
    case "artistico": return <ReviewsArtistico {...props} />;
    case "fresco": return <ReviewsFresco {...props} />;
    case "classic":
    default: return <ReviewsClassic {...props} />;
  }
}

// ════════════════════════════════════════════════════════════════════════
// CTA (final call-to-action with email signup)
// ════════════════════════════════════════════════════════════════════════

interface CTAProps {
  title?: string;
  subtitle?: string;
  cta?: string;
  placeholder?: string;
}

function CTAClassic({
  title = "Ready to get started?",
  subtitle = "Join thousands of teams already building with us.",
  cta = "Subscribe",
  placeholder = "Enter your email",
}: CTAProps) {
  return (
    <section className="px-8 py-16 text-center">
      <h2
        className="text-2xl font-bold mb-3"
        style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
      >
        {title}
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--d-text-secondary)" }}>{subtitle}</p>
      <div className="flex gap-3 justify-center max-w-md mx-auto">
        <div className="flex-1"><Input placeholder={placeholder} /></div>
        <Button>{cta}</Button>
      </div>
    </section>
  );
}

function CTAElegante({
  title = "Begin the journey",
  subtitle = "Join a community of makers shipping remarkable work.",
  cta = "Subscribe",
  placeholder = "your@email.com",
}: CTAProps) {
  return (
    <section className="px-8 py-24 text-center" style={{ backgroundColor: "var(--d-bg)" }}>
      <div className="max-w-xl mx-auto">
        <div
          className="text-[0.6875rem] tracking-[0.3em] uppercase mb-6"
          style={{ color: "var(--d-text-muted)" }}
        >
          — Join us —
        </div>
        <h2
          className="text-[2.5rem] leading-tight tracking-[-0.01em]"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
            fontWeight: 400,
          }}
        >
          {title}
        </h2>
        <p className="mt-6 text-base" style={{ color: "var(--d-text-secondary)" }}>{subtitle}</p>
        <div
          className="mt-10 flex items-center justify-center gap-4 pb-2"
          style={{ borderBottom: "1px solid var(--d-text-primary)" }}
        >
          <input
            type="email"
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-sm py-1"
            style={{ color: "var(--d-text-primary)" }}
          />
          <button
            className="text-[0.75rem] tracking-[0.22em] uppercase cursor-pointer"
            style={{ color: "var(--d-text-primary)", background: "none", border: "none" }}
          >
            {cta} →
          </button>
        </div>
      </div>
    </section>
  );
}

function CTAArtistico({
  title = "Ready to get started?",
  subtitle = "Join thousands of teams already building with us.",
  cta = "Get Started",
}: CTAProps) {
  return (
    <section
      className="relative overflow-hidden px-8 py-20 text-center"
      style={{
        background:
          "linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute -top-20 -left-20 w-80 h-80 rounded-full"
        style={{ backgroundColor: "var(--d-accent)", opacity: 0.25, filter: "blur(60px)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full"
        style={{ backgroundColor: "var(--d-bg)", opacity: 0.1, filter: "blur(60px)" }}
      />
      <div className="relative max-w-2xl mx-auto">
        <h2
          className="text-[2.75rem] leading-[1.05] tracking-[-0.02em]"
          style={{ color: "var(--d-on-primary)", fontFamily: "var(--d-font-heading)", fontWeight: 800 }}
        >
          {title}
        </h2>
        <p className="mt-5 text-lg" style={{ color: "var(--d-on-primary)", opacity: 0.9 }}>
          {subtitle}
        </p>
        <button
          className="mt-10 inline-flex items-center gap-2 px-8 py-3.5 text-[1rem] font-semibold cursor-pointer"
          style={{
            backgroundColor: "var(--d-text-primary)",
            color: "var(--d-bg)",
            borderRadius: "var(--d-radius-full)",
            border: "none",
          }}
        >
          {cta}
          <span aria-hidden style={{ color: "var(--d-accent)" }}>✦</span>
        </button>
      </div>
    </section>
  );
}

function CTAFresco({
  title = "Start free today 🚀",
  subtitle = "No credit card, no tricks. Just free forever.",
  cta = "Start free",
  placeholder = "Enter your email",
}: CTAProps) {
  return (
    <section className="px-6 py-12">
      <div
        className="relative mx-auto max-w-3xl px-8 py-12 text-center overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%)",
          borderRadius: "var(--d-radius-lg)",
          boxShadow: "var(--d-shadow-lg)",
        }}
      >
        <h2
          className="text-[1.875rem] font-bold"
          style={{ color: "var(--d-on-primary)", fontFamily: "var(--d-font-heading)" }}
        >
          {title}
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--d-on-primary)", opacity: 0.9 }}>
          {subtitle}
        </p>
        <div
          className="mt-6 mx-auto max-w-md flex items-center gap-2 p-1.5"
          style={{
            backgroundColor: "var(--d-bg)",
            borderRadius: "var(--d-radius-full)",
            boxShadow: "var(--d-shadow-md)",
          }}
        >
          <input
            type="email"
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none px-3 text-sm"
            style={{ color: "var(--d-text-primary)" }}
          />
          <button
            className="px-4 py-1.5 text-[0.8125rem] font-semibold cursor-pointer"
            style={{
              color: "var(--d-on-primary)",
              background:
                "linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%)",
              borderRadius: "var(--d-radius-full)",
              border: "none",
            }}
          >
            {cta}
          </button>
        </div>
      </div>
    </section>
  );
}

export function CTA(props?: CTAProps) {
  const { ctaVariant } = useBrand();
  switch (ctaVariant) {
    case "elegante": return <CTAElegante {...props} />;
    case "artistico": return <CTAArtistico {...props} />;
    case "fresco": return <CTAFresco {...props} />;
    case "classic":
    default: return <CTAClassic {...props} />;
  }
}

// ════════════════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════════════════

interface FooterProps {
  sections?: Array<{ title: string; links: string[] }>;
  tagline?: string;
}

const DEFAULT_FOOTER_SECTIONS = [
  { title: "Product", links: ["Features", "Pricing", "Changelog"] },
  { title: "Company", links: ["About", "Blog", "Careers"] },
  { title: "Legal", links: ["Privacy", "Terms", "Cookies"] },
];

function FooterClassic({
  sections = DEFAULT_FOOTER_SECTIONS,
  tagline = "Building the future, one pixel at a time.",
}: FooterProps) {
  return (
    <footer
      className="px-6 py-8 mt-auto"
      style={{
        backgroundColor: "var(--d-surface)",
        borderTop: "1px solid var(--d-border)",
      }}
    >
      <div className="flex justify-between max-w-6xl mx-auto">
        <div>
          <div className="mb-2"><BrandMark size={20} nameSize="0.9375rem" /></div>
          <div className="text-[0.8125rem]" style={{ color: "var(--d-text-muted)" }}>{tagline}</div>
        </div>
        <div className="flex gap-12">
          {sections.map((s) => (
            <div key={s.title}>
              <div className="text-[0.8125rem] font-semibold mb-3" style={{ color: "var(--d-text-primary)" }}>{s.title}</div>
              <div className="flex flex-col gap-2">
                {s.links.map((link) => (
                  <span key={link} className="text-[0.8125rem] cursor-pointer" style={{ color: "var(--d-text-muted)" }}>{link}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterElegante({
  sections = DEFAULT_FOOTER_SECTIONS,
  tagline = "Crafted with care, since 2024.",
}: FooterProps) {
  return (
    <footer
      className="px-8 pt-16 pb-8 mt-auto"
      style={{ backgroundColor: "var(--d-bg)" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6 flex justify-center"><BrandMark size={28} nameSize="1.125rem" nameWeight={400} /></div>
        <div className="text-[0.6875rem] tracking-[0.22em] uppercase" style={{ color: "var(--d-text-muted)" }}>
          {tagline}
        </div>
        <div className="mx-auto my-8 h-px w-24" style={{ backgroundColor: "var(--d-border)" }} />
        <div className="flex justify-center gap-10 flex-wrap">
          {sections.flatMap((s) => s.links).map((link) => (
            <span
              key={link}
              className="text-[0.6875rem] tracking-[0.22em] uppercase cursor-pointer"
              style={{ color: "var(--d-text-secondary)" }}
            >
              {link}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterArtistico({
  sections = DEFAULT_FOOTER_SECTIONS,
  tagline = "We ship beautiful things.",
}: FooterProps) {
  return (
    <footer
      className="relative px-8 pt-16 pb-8 mt-auto overflow-hidden"
      style={{ backgroundColor: "var(--d-text-primary)" }}
    >
      <div
        aria-hidden
        className="absolute -bottom-24 -right-12 w-80 h-80 rounded-full"
        style={{ backgroundColor: "var(--d-accent)", opacity: 0.15, filter: "blur(60px)" }}
      />
      <div className="relative max-w-6xl mx-auto grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-8">
        <div>
          {/* On dark bg, invert mark colors via opacity */}
          <div style={{ filter: "invert(1) hue-rotate(180deg)" }}>
            <BrandMark size={32} nameSize="1.25rem" nameWeight={800} />
          </div>
          <p className="mt-3 text-sm max-w-xs" style={{ color: "var(--d-bg)", opacity: 0.7 }}>{tagline}</p>
          <div className="mt-4 flex gap-2">
            <span
              className="inline-block w-8 h-8 rounded-full"
              style={{ backgroundColor: "var(--d-primary)" }}
              aria-hidden
            />
            <span
              className="inline-block w-8 h-8 rounded-full"
              style={{ backgroundColor: "var(--d-secondary)" }}
              aria-hidden
            />
            <span
              className="inline-block w-8 h-8 rounded-full"
              style={{ backgroundColor: "var(--d-accent)" }}
              aria-hidden
            />
          </div>
        </div>
        {sections.map((s) => (
          <div key={s.title}>
            <div
              className="text-[0.6875rem] tracking-[0.22em] uppercase mb-3 font-bold"
              style={{ color: "var(--d-accent)" }}
            >
              {s.title}
            </div>
            <div className="flex flex-col gap-2">
              {s.links.map((link) => (
                <span key={link} className="text-sm cursor-pointer" style={{ color: "var(--d-bg)", opacity: 0.8 }}>{link}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}

function FooterFresco({
  sections = DEFAULT_FOOTER_SECTIONS,
  tagline = "Made with ❤️ for teams that ship.",
}: FooterProps) {
  return (
    <footer className="px-6 pt-6 pb-8 mt-auto" style={{ backgroundColor: "var(--d-bg)" }}>
      <div
        className="relative mx-auto max-w-6xl px-8 py-8"
        style={{
          backgroundColor: "var(--d-surface)",
          borderRadius: "var(--d-radius-lg)",
          border: "1px solid var(--d-border)",
          boxShadow: "var(--d-shadow-sm)",
        }}
      >
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: "linear-gradient(90deg, var(--d-primary), var(--d-secondary))",
            borderTopLeftRadius: "var(--d-radius-lg)",
            borderTopRightRadius: "var(--d-radius-lg)",
          }}
        />
        <div className="flex justify-between items-start flex-wrap gap-8">
          <div>
            <div className="mb-2"><BrandMark size={22} nameSize="0.9375rem" /></div>
            <div className="text-[0.8125rem]" style={{ color: "var(--d-text-muted)" }}>{tagline}</div>
          </div>
          <div className="flex gap-8 flex-wrap">
            {sections.map((s) => (
              <div key={s.title}>
                <div
                  className="text-[0.75rem] font-bold mb-3 inline-flex items-center gap-1.5"
                  style={{ color: "var(--d-text-primary)" }}
                >
                  <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--d-primary)" }} />
                  {s.title}
                </div>
                <div className="flex flex-col gap-1.5">
                  {s.links.map((link) => (
                    <span key={link} className="text-[0.8125rem] cursor-pointer" style={{ color: "var(--d-text-muted)" }}>{link}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Landing footer — variant-aware wrapper. Kept separate from the legacy
 * `Footer` primitive in `./index.tsx` so existing non-landing callers keep
 * their layout untouched.
 */
export function LandingFooter(props?: FooterProps) {
  const { footerVariant } = useBrand();
  switch (footerVariant) {
    case "elegante": return <FooterElegante {...props} />;
    case "artistico": return <FooterArtistico {...props} />;
    case "fresco": return <FooterFresco {...props} />;
    case "classic":
    default: return <FooterClassic {...props} />;
  }
}

// ════════════════════════════════════════════════════════════════════════
// Variant copy — used by DESIGN.md + exports to describe the choices.
// ════════════════════════════════════════════════════════════════════════

export const SECTION_VARIANT_COPY: Record<
  SectionVariant,
  { label: string; tagline: string }
> = {
  classic: { label: "Classic", tagline: "Timeless and refined" },
  elegante: { label: "Elegante", tagline: "Editorial and quiet" },
  artistico: { label: "Artistico", tagline: "Asymmetric and expressive" },
  fresco: { label: "Fresco", tagline: "Compact and playful" },
};

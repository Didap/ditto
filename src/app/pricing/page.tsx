"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { t, LOCALES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Check } from "lucide-react";

export default function PricingPage() {
  const { data: session } = useSession();
  const [locale, setLocale] = useState<Locale>("en");
  const [annual, setAnnual] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("ditto-locale") as Locale | null;
    if (stored && LOCALES.some((l) => l.code === stored)) {
      setLocale(stored);
      return;
    }
    const browserLang = navigator.language.slice(0, 2);
    const match = LOCALES.find((l) => l.code === browserLang);
    if (match) setLocale(match.code);
  }, []);

  const T = (key: Parameters<typeof t>[1]) => t(locale, key);

  const tiers = [
    {
      name: T("pricingFree"),
      price: T("pricingFreePrice"),
      period: "",
      desc: T("pricingFreeDesc"),
      cta: T("pricingFreeCta"),
      features: [
        T("pricingFreeF1"),
        T("pricingFreeF2"),
        T("pricingFreeF3"),
        T("pricingFreeF4"),
      ],
      recommended: false,
      href: session ? "/inspire" : "/register",
    },
    {
      name: T("pricingPro"),
      price: annual ? T("pricingProPrice") : "$24",
      period: T("pricingProPeriod"),
      desc: T("pricingProDesc"),
      cta: T("pricingProCta"),
      features: [
        T("pricingProF1"),
        T("pricingProF2"),
        T("pricingProF3"),
        T("pricingProF4"),
        T("pricingProF5"),
      ],
      recommended: true,
      href: session ? "/inspire" : "/register",
    },
    {
      name: T("pricingTeam"),
      price: annual ? T("pricingTeamPrice") : "$59",
      period: T("pricingTeamPeriod"),
      desc: T("pricingTeamDesc"),
      cta: T("pricingTeamCta"),
      features: [
        T("pricingTeamF1"),
        T("pricingTeamF2"),
        T("pricingTeamF3"),
        T("pricingTeamF4"),
        T("pricingTeamF5"),
      ],
      recommended: false,
      href: session ? "/inspire" : "/register",
    },
  ];

  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Ditto Pricing",
    description: "Pricing plans for Ditto design system extractor",
    mainEntity: {
      "@type": "SoftwareApplication",
      name: "Ditto",
      applicationCategory: "DesignApplication",
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description: "3 extractions/month, 1 project, DESIGN.md + CSS export",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: annual ? "19" : "24",
          priceCurrency: "USD",
          description: "Unlimited extractions, React export, Figma push",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: annual ? "19" : "24",
            priceCurrency: "USD",
            billingDuration: "P1M",
          },
        },
        {
          "@type": "Offer",
          name: "Team",
          price: annual ? "49" : "59",
          priceCurrency: "USD",
          description: "5 team members, shared library, priority support",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: annual ? "49" : "59",
            priceCurrency: "USD",
            billingDuration: "P1M",
          },
        },
      ],
    },
  };

  return (
    <div className="-mx-6 -mt-8" style={{ marginBottom: "-2rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--ditto-text)] mb-4">
            {T("pricingTitle")}
          </h1>
          <p className="text-lg text-[var(--ditto-text-muted)] mb-10">
            {T("pricingSubtitle")}
          </p>

          {/* Annual/Monthly toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span
              className={`text-sm ${!annual ? "text-[var(--ditto-text)]" : "text-[var(--ditto-text-muted)]"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                annual
                  ? "bg-[var(--ditto-primary)]"
                  : "bg-[var(--ditto-border)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  annual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm ${annual ? "text-[var(--ditto-text)]" : "text-[var(--ditto-text-muted)]"}`}
            >
              Annual
            </span>
            {annual && (
              <span className="text-xs bg-[var(--ditto-primary)]/15 text-[var(--ditto-primary)] px-2 py-0.5 rounded-full font-medium">
                {T("pricingAnnualSave")}
              </span>
            )}
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-xl border p-8 text-left transition-all ${
                  tier.recommended
                    ? "border-[var(--ditto-primary)] bg-[var(--ditto-surface)] scale-[1.02] shadow-lg shadow-[var(--ditto-primary)]/10"
                    : "border-[var(--ditto-border)] bg-[var(--ditto-surface)]"
                }`}
              >
                {tier.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--ditto-primary)] text-[#0a0a0a] text-xs font-bold px-3 py-1 rounded-full">
                    {T("pricingRecommended")}
                  </span>
                )}

                <h2 className="text-lg font-semibold text-[var(--ditto-text)] mb-1">
                  {tier.name}
                </h2>
                <p className="text-sm text-[var(--ditto-text-muted)] mb-4">
                  {tier.desc}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-[var(--ditto-text)]">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm text-[var(--ditto-text-muted)]">
                      {tier.period}
                    </span>
                  )}
                </div>

                <a
                  href={tier.href}
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 mb-6 ${
                    tier.recommended
                      ? "bg-[var(--ditto-primary)] text-[#0a0a0a]"
                      : "bg-[var(--ditto-surface-hover)] text-[var(--ditto-text)] border border-[var(--ditto-border)]"
                  }`}
                >
                  {tier.cta}
                </a>

                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-[var(--ditto-text-secondary)]"
                    >
                      <Check
                        className="w-4 h-4 text-[var(--ditto-primary)] mt-0.5 shrink-0"
                        strokeWidth={2}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { useLocalePath, useLocale, useT } from "@/lib/locale-context";
import { ScrambleText } from "@/components/ScrambleText";
import type { TranslationKey } from "@/lib/i18n";
import type { PricingData, PricingRow } from "@/lib/pricing";

const PLAN_FEATURE_KEYS: Record<string, TranslationKey[]> = {
  free: ["pricingFreeF1", "pricingFreeF2", "pricingFreeF3", "pricingFreeF4"],
  pro: ["pricingProF1", "pricingProF2", "pricingProF3", "pricingProF4", "pricingProF5", "pricingProF6"],
  team: ["pricingTeamF1", "pricingTeamF2", "pricingTeamF3", "pricingTeamF4", "pricingTeamF5", "pricingTeamF6"],
};

const PLAN_DESC_KEY: Record<string, TranslationKey> = {
  free: "pricingFreeDesc",
  pro: "pricingProDesc",
  team: "pricingTeamDesc",
};

function formatPrice(cents: number, currency: string): string {
  const value = cents / 100;
  if (currency === "eur") {
    return `€${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}`;
  }
  return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}`;
}

export function PricingClient({ data, isAuthenticated }: { data: PricingData; isAuthenticated: boolean }) {
  const locale = useLocale();
  const t = useT();
  const lp = useLocalePath();
  const [loading, setLoading] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  const { plans, packs, isLaunch } = data;
  const currency = plans.find((p) => p.price > 0)?.currency ?? packs[0]?.currency ?? "usd";
  const currencySymbol = currency === "eur" ? "€" : "$";

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/credits")
        .then((r) => r.json())
        .then((d) => setUserPlan(d.plan || "free"))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const checkout = async (priceId: string, mode: "subscription" | "payment") => {
    if (!isAuthenticated) {
      window.location.href = lp("/register");
      return;
    }
    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode, locale }),
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
    } catch {
      /* network error */
    } finally {
      setLoading(null);
    }
  };

  const manageSubscription = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
    } catch {
      /* network error */
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="-mx-6 -mt-8" style={{ marginBottom: "-2rem" }}>
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {isLaunch && (
            <div className="inline-flex items-center gap-2 bg-(--ditto-primary)/10 text-(--ditto-primary) text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <ScrambleText text={t("pricingLaunchBanner")} delay={0} />
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-extrabold text-(--ditto-text) mb-4">
            <ScrambleText text={t("pricingTitle")} delay={30} />
          </h1>
          <p className="text-lg text-(--ditto-text-muted) mb-12">
            100 <ScrambleText text={t("pricingCreditsLabel")} delay={60} /> = {currencySymbol}1 · <ScrambleText text={t("pricingSubtitle")} delay={90} />
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={userPlan === plan.id}
                loading={loading}
                session={isAuthenticated}
                t={t}
                lp={lp}
                checkout={checkout}
                manageSubscription={manageSubscription}
              />
            ))}
          </div>

          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-(--ditto-text) mb-2"><ScrambleText text={t("pricingPacksTitle")} delay={300} /></h2>
            <p className="text-sm text-(--ditto-text-muted) mb-8"><ScrambleText text={t("pricingPacksSubtitle")} delay={330} /></p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packs.map((pack) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  loading={loading}
                  session={isAuthenticated}
                  locale={locale}
                  t={t}
                  checkout={checkout}
                />
              ))}
            </div>
          </div>

          <div className="mt-12 text-xs text-(--ditto-text-muted)">
            <ScrambleText text={t("pricingCostRef")} delay={400} />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Plan Card ─────────────────────────────────────────────── */

function PlanCard({
  plan, isCurrent, loading, session, t, lp, checkout, manageSubscription,
}: {
  plan: PricingRow;
  isCurrent: boolean;
  loading: string | null;
  session: boolean;
  t: (key: TranslationKey) => string;
  lp: (path: string) => string;
  checkout: (priceId: string, mode: "subscription" | "payment") => void;
  manageSubscription: () => void;
}) {
  const recommended = plan.id === "pro";
  const featureKeys = PLAN_FEATURE_KEYS[plan.id] || [];
  const descKey = PLAN_DESC_KEY[plan.id];
  const hasLaunchPrice = plan.isLaunch && plan.launchPrice > 0 && plan.launchPrice < plan.price;
  const isPaid = plan.stripePriceId !== null;

  return (
    <div
      className={`relative rounded-xl border p-8 text-left transition-all ${
        recommended
          ? "border-(--ditto-primary) bg-(--ditto-surface) scale-[1.02] shadow-lg shadow-(--ditto-primary)/10"
          : "border-(--ditto-border) bg-(--ditto-surface)"
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-(--ditto-primary) text-[#0a0a0a] text-xs font-bold px-3 py-1 rounded-full">
          <ScrambleText text={t("pricingRecommended")} delay={120} />
        </span>
      )}

      <h2 className="text-lg font-semibold text-(--ditto-text) mb-1">{plan.name}</h2>
      <p className="text-sm text-(--ditto-text-muted) mb-4">{descKey ? <ScrambleText text={t(descKey)} delay={150} /> : ""}</p>

      <div className="mb-6">
        {hasLaunchPrice ? (
          <>
            <span className="text-lg line-through text-(--ditto-text-muted) mr-2">
              {formatPrice(plan.price, plan.currency)}
            </span>
            <span className="text-4xl font-extrabold text-(--ditto-text)">
              {formatPrice(plan.launchPrice, plan.currency)}
            </span>
            <span className="block text-xs text-(--ditto-text-muted) mt-1">
              <ScrambleText text={t("pricingFirstMonth")} delay={180} /> {formatPrice(plan.price, plan.currency)}<ScrambleText text={t("pricingPerMonth")} delay={180} />
            </span>
          </>
        ) : (
          <span className="text-4xl font-extrabold text-(--ditto-text)">
            {formatPrice(plan.price, plan.currency)}
          </span>
        )}
        {isPaid && !hasLaunchPrice && <span className="text-sm text-(--ditto-text-muted)"><ScrambleText text={t("pricingPerMonth")} delay={180} /></span>}
      </div>

      {isCurrent ? (
        <button
          onClick={manageSubscription}
          disabled={plan.id === "free" || loading === "portal"}
          className="block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm bg-(--ditto-surface-hover) text-(--ditto-text) border border-(--ditto-border) disabled:opacity-50"
        >
          {plan.id === "free" ? <ScrambleText text={t("pricingCurrentPlan")} delay={210} /> : loading === "portal" ? "..." : <ScrambleText text={t("pricingManage")} delay={210} />}
        </button>
      ) : (
        <button
          onClick={() =>
            plan.stripePriceId
              ? checkout(plan.stripePriceId, "subscription")
              : (window.location.href = session ? lp("/dashboard") : lp("/register"))
          }
          disabled={!!loading}
          className={`block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 ${
            recommended
              ? "bg-(--ditto-primary) text-[#0a0a0a]"
              : "bg-(--ditto-surface-hover) text-(--ditto-text) border border-(--ditto-border)"
          } disabled:opacity-50`}
        >
          {loading === plan.stripePriceId ? "..." : plan.id === "free" ? <ScrambleText text={t("pricingGetStarted")} delay={210} /> : <ScrambleText text={t("pricingSubscribe")} delay={210} />}
        </button>
      )}

      <ul className="space-y-3 mt-6">
        {featureKeys.map((key, i) => (
          <li key={key} className="flex items-start gap-2 text-sm text-(--ditto-text-secondary)">
            <Check className="w-4 h-4 text-(--ditto-primary) mt-0.5 shrink-0" strokeWidth={2} />
            <ScrambleText text={t(key)} delay={240 + i * 30} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Pack Card ─────────────────────────────────────────────── */

function PackCard({
  pack, loading, session, locale, t, checkout,
}: {
  pack: PricingRow;
  loading: string | null;
  session: boolean;
  locale: string;
  t: (key: TranslationKey) => string;
  checkout: (priceId: string, mode: "subscription" | "payment") => void;
}) {
  const hasLaunch = pack.isLaunch && pack.launchPrice > 0 && pack.launchPrice < pack.price;

  return (
    <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6 text-center">
      <div className="text-2xl font-bold text-(--ditto-text) mb-1">
        {pack.credits.toLocaleString(locale)}
      </div>
      <div className="text-xs text-(--ditto-text-muted) mb-3"><ScrambleText text={t("pricingCreditsLabel")} delay={360} /></div>
      <div className="mb-4">
        {hasLaunch ? (
          <>
            <span className="text-sm line-through text-(--ditto-text-muted) mr-1">
              {formatPrice(pack.price, pack.currency)}
            </span>
            <span className="text-xl font-bold text-(--ditto-text)">
              {formatPrice(pack.launchPrice, pack.currency)}
            </span>
          </>
        ) : (
          <span className="text-xl font-bold text-(--ditto-text)">
            {formatPrice(pack.price, pack.currency)}
          </span>
        )}
      </div>
      <button
        onClick={() => pack.stripePriceId && checkout(pack.stripePriceId, "payment")}
        disabled={!session || !!loading}
        className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-(--ditto-surface-hover) text-(--ditto-text) border border-(--ditto-border) hover:border-(--ditto-text-muted) transition-colors disabled:opacity-50"
      >
        {loading === pack.stripePriceId ? "..." : session ? <ScrambleText text={t("pricingBuyCredits")} delay={390} /> : <ScrambleText text={t("pricingSignUpFirst")} delay={390} />}
      </button>
    </div>
  );
}

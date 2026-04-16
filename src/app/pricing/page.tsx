"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Check } from "lucide-react";

interface PricingRow {
  id: string;
  type: string;
  name: string;
  credits: number;
  priceUsd: number;
  launchPriceUsd: number;
  stripePriceId: string | null;
  sortOrder: number;
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["300 credits/month", "3 design extractions", "1 hybrid generation", "DESIGN.md + CSS export"],
  pro: ["1,500 credits/month", "15 design extractions", "5 hybrid generations", "Dev Kit + Complete Kit export", "Quality boost", "Figma push"],
  team: ["5,000 credits/month", "50 design extractions", "16 hybrid generations", "Everything in Pro", "Priority support", "Team collaboration (soon)"],
};

const PLAN_DESC: Record<string, string> = {
  free: "Try Ditto — no credit card required",
  pro: "For freelancers and individual designers",
  team: "For teams and agencies",
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [plans, setPlans] = useState<PricingRow[]>([]);
  const [packs, setPacks] = useState<PricingRow[]>([]);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans || []);
        setPacks(data.packs || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session) {
      fetch("/api/credits")
        .then((r) => r.json())
        .then((d) => setUserPlan(d.plan || "free"))
        .catch(() => {});
    }
  }, [session]);

  const checkout = async (priceId: string, mode: "subscription" | "payment") => {
    if (!session) {
      window.location.href = "/register";
      return;
    }
    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Error creating checkout");
    } catch {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  };

  const manageSubscription = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Error opening portal");
    } catch {
      alert("Network error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="-mx-6 -mt-8" style={{ marginBottom: "-2rem" }}>
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Launch banner */}
          <div className="inline-flex items-center gap-2 bg-(--ditto-primary)/10 text-(--ditto-primary) text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            🚀 Launch Sale — 30% off everything
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-(--ditto-text) mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-(--ditto-text-muted) mb-12">
            100 credits = $1 · Pay for what you use, upgrade anytime
          </p>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isCurrent = userPlan === plan.id;
              const recommended = plan.id === "pro";
              const features = PLAN_FEATURES[plan.id] || [];
              const desc = PLAN_DESC[plan.id] || "";
              const hasLaunchPrice = plan.launchPriceUsd > 0 && plan.launchPriceUsd < plan.priceUsd;
              const isPaid = plan.stripePriceId !== null;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-8 text-left transition-all ${
                    recommended
                      ? "border-(--ditto-primary) bg-(--ditto-surface) scale-[1.02] shadow-lg shadow-(--ditto-primary)/10"
                      : "border-(--ditto-border) bg-(--ditto-surface)"
                  }`}
                >
                  {recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-(--ditto-primary) text-[#0a0a0a] text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}

                  <h2 className="text-lg font-semibold text-(--ditto-text) mb-1">{plan.name}</h2>
                  <p className="text-sm text-(--ditto-text-muted) mb-4">{desc}</p>

                  <div className="mb-6">
                    {hasLaunchPrice ? (
                      <>
                        <span className="text-lg line-through text-(--ditto-text-muted) mr-2">
                          {formatPrice(plan.priceUsd)}
                        </span>
                        <span className="text-4xl font-extrabold text-(--ditto-text)">
                          {formatPrice(plan.launchPriceUsd)}
                        </span>
                      </>
                    ) : (
                      <span className="text-4xl font-extrabold text-(--ditto-text)">
                        {formatPrice(plan.priceUsd)}
                      </span>
                    )}
                    {isPaid && <span className="text-sm text-(--ditto-text-muted)">/mo</span>}
                  </div>

                  {isCurrent ? (
                    <button
                      onClick={manageSubscription}
                      disabled={plan.id === "free" || loading === "portal"}
                      className="block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm bg-(--ditto-surface-hover) text-(--ditto-text) border border-(--ditto-border) disabled:opacity-50"
                    >
                      {plan.id === "free" ? "Current Plan" : loading === "portal" ? "Loading..." : "Manage Subscription"}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        plan.stripePriceId
                          ? checkout(plan.stripePriceId, "subscription")
                          : (window.location.href = session ? "/dashboard" : "/register")
                      }
                      disabled={!!loading}
                      className={`block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 ${
                        recommended
                          ? "bg-(--ditto-primary) text-[#0a0a0a]"
                          : "bg-(--ditto-surface-hover) text-(--ditto-text) border border-(--ditto-border)"
                      } disabled:opacity-50`}
                    >
                      {loading === plan.stripePriceId ? "Loading..." : plan.id === "free" ? "Get Started" : "Subscribe"}
                    </button>
                  )}

                  <ul className="space-y-3 mt-6">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-(--ditto-text-secondary)">
                        <Check className="w-4 h-4 text-(--ditto-primary) mt-0.5 shrink-0" strokeWidth={2} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Credit Packs */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-(--ditto-text) mb-2">Need more credits?</h2>
            <p className="text-sm text-(--ditto-text-muted) mb-8">Top up anytime — credits never expire</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packs.map((pack) => {
                const hasLaunch = pack.launchPriceUsd > 0 && pack.launchPriceUsd < pack.priceUsd;
                return (
                  <div
                    key={pack.id}
                    className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6 text-center"
                  >
                    <div className="text-2xl font-bold text-(--ditto-text) mb-1">
                      {pack.credits.toLocaleString("en-US")}
                    </div>
                    <div className="text-xs text-(--ditto-text-muted) mb-3">credits</div>
                    <div className="mb-4">
                      {hasLaunch ? (
                        <>
                          <span className="text-sm line-through text-(--ditto-text-muted) mr-1">
                            {formatPrice(pack.priceUsd)}
                          </span>
                          <span className="text-xl font-bold text-(--ditto-text)">
                            {formatPrice(pack.launchPriceUsd)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-(--ditto-text)">
                          {formatPrice(pack.priceUsd)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => pack.stripePriceId && checkout(pack.stripePriceId, "payment")}
                      disabled={!session || !!loading}
                      className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-(--ditto-surface-hover) text-(--ditto-text) border border-(--ditto-border) hover:border-(--ditto-text-muted) transition-colors disabled:opacity-50"
                    >
                      {loading === pack.stripePriceId ? "Loading..." : session ? "Buy Credits" : "Sign up first"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost reference */}
          <div className="mt-12 text-xs text-(--ditto-text-muted)">
            Extract a design: 100 credits · Generate hybrid mix: 300 credits · Boost quality: 200+ credits
          </div>
        </div>
      </section>
    </div>
  );
}

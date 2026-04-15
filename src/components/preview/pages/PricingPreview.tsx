"use client";

import React from "react";
import { Button, Card, Badge, Nav, Footer, FAQ } from "../primitives";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Perfect for trying out",
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1 GB storage",
    ],
    cta: "Get Started",
    variant: "secondary" as const,
    badge: null,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Best for professionals",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "100 GB storage",
      "Custom domains",
      "Team collaboration",
    ],
    cta: "Start Free Trial",
    variant: "primary" as const,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "SSO & SAML",
      "Dedicated support",
      "SLA guarantee",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    variant: "secondary" as const,
    badge: null,
  },
];

export function PricingPreview() {
  return (
    <div className="flex flex-col min-h-[800px]">
      <Nav />

      <section className="px-8 py-16 text-center">
        <Badge>Pricing</Badge>
        <h1
          className="mt-4 text-[2.25rem] font-bold tracking-tight"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
          }}
        >
          Simple, transparent pricing
        </h1>
        <p
          className="mt-3 text-base max-w-lg mx-auto"
          style={{ color: "var(--d-text-secondary)" }}
        >
          Choose the plan that fits your needs. Upgrade or downgrade at any time.
        </p>
      </section>

      <section className="px-8 pb-20">
        <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-6 relative ${plan.badge ? "ring-2" : ""}`}
              hover
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default">{plan.badge}</Badge>
                </div>
              )}
              <div className="text-center mb-6">
                <h3
                  className="text-lg font-semibold mb-1"
                  style={{ color: "var(--d-text-primary)" }}
                >
                  {plan.name}
                </h3>
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--d-text-muted)" }}
                >
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span
                    className="text-4xl font-bold"
                    style={{
                      color: "var(--d-text-primary)",
                      fontFamily: "var(--d-font-heading)",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--d-text-muted)" }}
                  >
                    {plan.period}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mb-6">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: "var(--d-text-secondary)" }}
                  >
                    <span style={{ color: "var(--d-success)" }}>✓</span>
                    {feature}
                  </div>
                ))}
              </div>

              <Button variant={plan.variant} size="md">
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-8 py-16 max-w-2xl mx-auto">
        <FAQ />
      </section>

      <Footer />
    </div>
  );
}

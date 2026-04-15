"use client";

import React from "react";
import { Button, Card, Badge, Nav, Footer, Input, Reviews, FAQ } from "../primitives";
import { Zap, Shield, Link2 } from "lucide-react";

export function LandingPreview() {
  return (
    <div className="flex flex-col min-h-[800px]">
      <Nav />

      {/* Hero */}
      <section className="px-8 py-20 text-center">
        <Badge variant="default">New Release v2.0</Badge>
        <h1
          className="mt-4 text-[2.5rem] leading-tight tracking-tight"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
            fontWeight: "var(--d-weight-heading)",
          }}
        >
          Build beautiful products
          <br />
          faster than ever
        </h1>
        <p
          className="mt-4 text-lg max-w-xl mx-auto"
          style={{ color: "var(--d-text-secondary)" }}
        >
          The modern platform for teams who want to ship great experiences.
          Design, develop, and deploy — all in one place.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Button size="lg">Get Started Free</Button>
          <Button variant="secondary" size="lg">
            View Demo
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="px-8 pb-16">
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { label: "Active Users", value: "12,000+" },
            { label: "Uptime", value: "99.99%" },
            { label: "Countries", value: "40+" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-3xl font-bold"
                style={{
                  color: "var(--d-text-primary)",
                  fontFamily: "var(--d-font-heading)",
                }}
              >
                {stat.value}
              </div>
              <div
                className="text-sm mt-1"
                style={{ color: "var(--d-text-muted)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-16" style={{ backgroundColor: "var(--d-surface)" }}>
        <h2
          className="text-2xl font-bold text-center mb-10"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
          }}
        >
          Everything you need
        </h2>
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              title: "Lightning Fast",
              desc: "Built for speed with optimized rendering and smart caching.",
              Icon: Zap,
            },
            {
              title: "Fully Secure",
              desc: "Enterprise-grade security with end-to-end encryption.",
              Icon: Shield,
            },
            {
              title: "Easy Integration",
              desc: "Connect with your favorite tools in just a few clicks.",
              Icon: Link2,
            },
          ].map((feature) => (
            <Card key={feature.title} className="p-6" hover>
              <div className="mb-3"><feature.Icon className="w-6 h-6" style={{ color: "var(--d-primary)" }} strokeWidth={1.5} /></div>
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: "var(--d-text-primary)" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--d-text-secondary)" }}
              >
                {feature.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="px-8 py-16">
        <Reviews />
      </section>

      {/* FAQ */}
      <section className="px-8 py-16 max-w-2xl mx-auto" style={{ backgroundColor: "var(--d-surface)" }}>
        <FAQ />
      </section>

      {/* CTA */}
      <section className="px-8 py-16 text-center">
        <h2
          className="text-2xl font-bold mb-3"
          style={{
            color: "var(--d-text-primary)",
            fontFamily: "var(--d-font-heading)",
          }}
        >
          Ready to get started?
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--d-text-secondary)" }}>
          Join thousands of teams already building with us.
        </p>
        <div className="flex gap-3 justify-center max-w-md mx-auto">
          <div className="flex-1">
            <Input placeholder="Enter your email" />
          </div>
          <Button>Subscribe</Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

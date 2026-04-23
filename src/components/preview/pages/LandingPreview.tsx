"use client";

import { Nav, FAQ } from "../primitives";
import { Hero, Features, Stats, Reviews, CTA, LandingFooter } from "../primitives/sections";

export function LandingPreview() {
  return (
    <div className="flex flex-col min-h-[800px]">
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <Reviews />
      <section className="px-8 py-16 max-w-2xl mx-auto" style={{ backgroundColor: "var(--d-surface)" }}>
        <FAQ />
      </section>
      <CTA />
      <LandingFooter />
    </div>
  );
}

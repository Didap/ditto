import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works",
};

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-6 text-center">
      <span className="w-16 h-16 ditto-blob inline-block mb-6" />
      <h1 className="text-3xl font-bold tracking-tight text-(--ditto-text) mb-4">
        How Ditto works
      </h1>
      <p className="text-lg text-(--ditto-text-secondary) mb-12 max-w-xl mx-auto">
        Extract, mix, and ship design systems — powered by pure CSS reverse-engineering, zero AI tokens.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
          <div className="text-2xl mb-3">1</div>
          <h3 className="text-base font-semibold text-(--ditto-text) mb-2">Extract</h3>
          <p className="text-sm text-(--ditto-text-muted) leading-relaxed">
            Paste any URL. Ditto launches a headless browser, analyzes every CSS rule, and extracts colors, fonts, spacing, shadows, and components into a structured design system.
          </p>
        </div>

        <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
          <div className="text-2xl mb-3">2</div>
          <h3 className="text-base font-semibold text-(--ditto-text) mb-2">Mix</h3>
          <p className="text-sm text-(--ditto-text-muted) leading-relaxed">
            Select multiple designs from your library or the curated catalog. Ditto blends their tokens into a brand-new hybrid design system that combines the best of each inspiration.
          </p>
        </div>

        <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
          <div className="text-2xl mb-3">3</div>
          <h3 className="text-base font-semibold text-(--ditto-text) mb-2">Ship</h3>
          <p className="text-sm text-(--ditto-text-muted) leading-relaxed">
            Download a complete kit with CSS tokens, React components, HTML pages, or a full Storybook project. Push variables directly to Figma. Your design system is ready to use.
          </p>
        </div>
      </div>

      <div className="mt-16">
        <a
          href="/register"
          className="btn-blob inline-block px-8 py-3 text-base"
        >
          Get started for free
        </a>
      </div>
    </div>
  );
}

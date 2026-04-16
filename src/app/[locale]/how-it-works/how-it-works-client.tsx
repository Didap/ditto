"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { useLocalePath } from "@/lib/locale-context";
import { ScrambleText } from "@/components/ScrambleText";

export function HowItWorksClient({ locale }: { locale: Locale }) {
  const lp = useLocalePath();
  const T = (key: Parameters<typeof t>[1]) => t(locale, key);

  return (
    <div className="max-w-3xl mx-auto py-16 px-6 text-center">
      <span className="w-16 h-16 ditto-blob inline-block mb-6" />
      <h1 className="text-3xl font-bold tracking-tight text-(--ditto-text) mb-4">
        <ScrambleText text={T("howPageTitle")} delay={0} />
      </h1>
      <p className="text-lg text-(--ditto-text-secondary) mb-12 max-w-xl mx-auto">
        <ScrambleText text={T("howPageSubtitle")} delay={30} />
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
          <div className="text-2xl mb-3">1</div>
          <h3 className="text-base font-semibold text-(--ditto-text) mb-2">
            <ScrambleText text={T("howPageExtractTitle")} delay={60} />
          </h3>
          <p className="text-sm text-(--ditto-text-muted) leading-relaxed">
            <ScrambleText text={T("howPageExtractDesc")} delay={90} />
          </p>
        </div>

        <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
          <div className="text-2xl mb-3">2</div>
          <h3 className="text-base font-semibold text-(--ditto-text) mb-2">
            <ScrambleText text={T("howPageMixTitle")} delay={120} />
          </h3>
          <p className="text-sm text-(--ditto-text-muted) leading-relaxed">
            <ScrambleText text={T("howPageMixDesc")} delay={150} />
          </p>
        </div>

        <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
          <div className="text-2xl mb-3">3</div>
          <h3 className="text-base font-semibold text-(--ditto-text) mb-2">
            <ScrambleText text={T("howPageShipTitle")} delay={180} />
          </h3>
          <p className="text-sm text-(--ditto-text-muted) leading-relaxed">
            <ScrambleText text={T("howPageShipDesc")} delay={210} />
          </p>
        </div>
      </div>

      <div className="mt-16">
        <Link
          href={lp("/register")}
          className="btn-blob inline-block px-8 py-3 text-base"
        >
          <ScrambleText text={T("howPageCta")} delay={240} />
        </Link>
      </div>
    </div>
  );
}

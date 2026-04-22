"use client";

/**
 * Minimal GDPR consent banner — appears bottom-center until the user picks
 * "accept" or "refuse". Stores the choice in localStorage (see
 * `src/lib/analytics/consent.ts`). Kept intentionally small and themed with
 * Ditto's tokens so it doesn't look like a hijacked third-party modal.
 */

import { useT } from "@/lib/locale-context";
import { setConsent, useConsent } from "@/lib/analytics/consent";

export function ConsentBanner() {
  const consent = useConsent();
  const t = useT();

  if (consent !== "pending") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Analytics consent"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] w-[min(560px,92vw)] rounded-xl border border-(--ditto-border) bg-(--ditto-surface) shadow-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
    >
      <div className="flex-1 text-xs text-(--ditto-text-secondary) leading-relaxed">
        <p>
          <span className="font-semibold text-(--ditto-text)">
            {t("consentTitle")}
          </span>{" "}
          {t("consentBody")}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setConsent("denied")}
          className="rounded-lg border border-(--ditto-border) px-3 py-1.5 text-xs font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
        >
          {t("consentDeny")}
        </button>
        <button
          onClick={() => setConsent("granted")}
          className="rounded-lg bg-(--ditto-primary) px-3 py-1.5 text-xs font-semibold text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
        >
          {t("consentAccept")}
        </button>
      </div>
    </div>
  );
}

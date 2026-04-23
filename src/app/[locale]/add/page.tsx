"use client";

import { useState, useEffect, useRef } from "react";
import { useCredits } from "@/lib/credits-context";
import { useLocalePath, usePathnameLocale, useT } from "@/lib/locale-context";
import { useOnborda } from "onborda";
import { hasSeenTour } from "@/lib/onboarding";

type ExtractionState = "idle" | "extracting" | "done" | "error";
type BookmarkletState = "idle" | "loading" | "ready" | "error";

interface ExtractionProgress {
  step: string;
  progress: number;
}

interface SpecialQuota {
  usedThisMonth: number;
  freeRemaining: number;
  isFree: boolean;
  freePerMonth: number;
  extraCost: number;
}

export default function AddDesignPage() {
  const t = useT();
  const lp = useLocalePath();
  const locale = usePathnameLocale();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<ExtractionState>("idle");
  const [progress, setProgress] = useState<ExtractionProgress>({
    step: "",
    progress: 0,
  });
  const [error, setError] = useState("");
  const [resultSlug, setResultSlug] = useState("");
  const [wafBlocked, setWafBlocked] = useState(false);
  const [bookmarkletState, setBookmarkletState] = useState<BookmarkletState>("idle");
  const [bookmarkletHref, setBookmarkletHref] = useState("");
  const [specialQuota, setSpecialQuota] = useState<SpecialQuota | null>(null);
  const [specialCharged, setSpecialCharged] = useState(0);
  const bookmarkletAnchorRef = useRef<HTMLAnchorElement>(null);
  const { credits, deduct, refresh } = useCredits();

  // React strips `javascript:` hrefs set via JSX (XSS protection). Set it via
  // the DOM after render so the drag-to-bookmarks behavior still works.
  useEffect(() => {
    if (bookmarkletAnchorRef.current && bookmarkletHref) {
      bookmarkletAnchorRef.current.setAttribute("href", bookmarkletHref);
    }
  }, [bookmarkletHref, bookmarkletState]);

  const canAdd = credits !== null && credits >= 100;
  const { startOnborda } = useOnborda();

  useEffect(() => {
    if (!hasSeenTour("add-design")) {
      const timer = setTimeout(() => startOnborda("add-design"), 400);
      return () => clearTimeout(timer);
    }
  }, [startOnborda]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/extract/quota")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSpecialQuota(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshQuota = () => {
    fetch("/api/extract/quota")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSpecialQuota(data);
      })
      .catch(() => {});
  };

  const handleExtract = async () => {
    if (!url) return;

    setState("extracting");
    setError("");
    setWafBlocked(false);
    setBookmarkletState("idle");
    setBookmarkletHref("");
    setSpecialCharged(0);

    // Simulate progress steps
    const steps = [
      t("addStepLaunchBrowser"),
      t("addStepLoadingPage"),
      t("addStepExtractingColors"),
      t("addStepAnalyzingTypography"),
      t("addStepDetectingComponents"),
      t("addStepGeneratingMd"),
      t("addStepSaving"),
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress({
          step: steps[stepIndex],
          progress: ((stepIndex + 1) / steps.length) * 100,
        });
        stepIndex++;
      }
    }, 800);

    try {
      const derivedName =
        name ||
        new URL(url.startsWith("http") ? url : `https://${url}`).hostname
          .replace("www.", "")
          .split(".")[0];

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.startsWith("http") ? url : `https://${url}`,
          name: derivedName,
        }),
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = await res.json();
        if (data.waf) setWafBlocked(true);
        throw new Error(data.error || t("addErrorExtractionFailed"));
      }

      const data = await res.json();
      setResultSlug(data.slug);
      setSpecialCharged(data.specialExtractionCharged || 0);
      setState("done");
      setProgress({ step: t("addStepComplete"), progress: 100 });
      deduct(100 + (data.specialExtractionCharged || 0));
      refresh();
      refreshQuota();
    } catch (err) {
      clearInterval(progressInterval);
      setState("error");
      setError(err instanceof Error ? err.message : t("addErrorUnknown"));
      // Refresh credits — the server refunds on extraction failure (WAF, errors)
      refresh();
    }
  };

  const generateBookmarklet = async () => {
    setBookmarkletState("loading");
    try {
      const res = await fetch(`/api/bookmarklet/token?locale=${encodeURIComponent(locale)}`);
      if (!res.ok) throw new Error("Failed to issue token");
      const { bookmarkletBody, originPlaceholder } = (await res.json()) as {
        bookmarkletBody: string;
        originPlaceholder: string;
      };
      if (!bookmarkletBody || !originPlaceholder) {
        throw new Error("Missing bookmarklet body");
      }
      const withOrigin = bookmarkletBody.split(originPlaceholder).join(window.location.origin);
      const href = `javascript:${encodeURIComponent(withOrigin)}`;
      setBookmarkletHref(href);
      setBookmarkletState("ready");
    } catch {
      setBookmarkletState("error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text) mb-2">
        {t("addTitle")}
      </h1>
      <p className="text-sm text-(--ditto-text-secondary) mb-8">
        {t("addSubtitle")}
      </p>

      <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
        <div className="flex flex-col gap-4">
          {/* URL Input */}
          <div id="tour-url-input">
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              {t("addUrlLabel")}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("addUrlPlaceholder")}
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary) transition-colors"
              disabled={state === "extracting"}
            />
          </div>

          {/* Name Input */}
          <div id="tour-name-input">
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              {t("addNameLabel")}{" "}
              <span className="font-normal text-(--ditto-text-muted)">
                {t("addNameOptional")}
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("addNamePlaceholder")}
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary) transition-colors"
              disabled={state === "extracting"}
            />
          </div>

          {/* Extract Button */}
          {!canAdd && credits !== null && (
            <div className="rounded-lg border border-(--ditto-warning)/30 bg-(--ditto-warning)/10 px-4 py-2.5">
              <p className="text-sm text-(--ditto-warning)">{t("addCreditsWarning").replace("{credits}", String(credits))}</p>
            </div>
          )}
          <button
            id="tour-extract-btn"
            onClick={handleExtract}
            disabled={!url || state === "extracting" || !canAdd}
            className="w-full rounded-lg bg-(--ditto-primary) px-4 py-2.5 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state === "extracting" ? t("addExtractingBtn") : t("addExtractBtn")}
          </button>

          {/* Special-extraction quota hint */}
          {specialQuota && (
            <p className="text-[11px] text-(--ditto-text-muted) leading-relaxed">
              {t("addSpecialIntro")}
              {specialQuota.isFree ? (
                <> {t("addSpecialFreePart1")} <strong className="text-(--ditto-text-secondary)">{specialQuota.freeRemaining}</strong> {t("addSpecialFreePart2")}</>
              ) : (
                <> {t("addSpecialPaidPart1")} <strong className="text-(--ditto-text-secondary)">+{specialQuota.extraCost}</strong> {t("addSpecialPaidPart2")}</>
              )}
            </p>
          )}
        </div>

        {/* Progress */}
        {state === "extracting" && (
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-(--ditto-text-secondary)">
                {progress.step}
              </span>
              <span className="text-(--ditto-text-muted)">
                {Math.round(progress.progress)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-(--ditto-bg) overflow-hidden">
              <div
                className="h-full rounded-full bg-(--ditto-primary) transition-all duration-500"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setState("idle")}
              className="mt-2 text-xs text-red-300 underline"
            >
              {t("addTryAgain")}
            </button>
          </div>
        )}

        {/* Fallback 2 — manual extraction from the user's own browser via bookmarklet.
            Shown only when BOTH local Puppeteer AND the ScraperAPI proxy retry fail. */}
        {state === "error" && wafBlocked && (
          <div className="mt-6 rounded-xl border border-(--ditto-border) bg-(--ditto-bg) p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 w-6 h-6 rounded-full bg-(--ditto-primary)/20 text-(--ditto-primary) text-xs font-bold flex items-center justify-center shrink-0">
                !
              </div>
              <div>
                <h3 className="text-sm font-semibold text-(--ditto-text) mb-1">
                  {t("addWafTitle")}
                </h3>
                <p className="text-xs text-(--ditto-text-secondary) leading-relaxed">
                  {t("addWafDesc")}
                </p>
              </div>
            </div>

            {bookmarkletState === "idle" && (
              <button
                onClick={generateBookmarklet}
                className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
              >
                {t("addWafProceedBtn")}
              </button>
            )}

            {bookmarkletState === "loading" && (
              <p className="text-xs text-(--ditto-text-muted)">{t("addWafPreparingLink")}</p>
            )}

            {bookmarkletState === "error" && (
              <p className="text-xs text-red-400">
                {t("addWafLinkError")}
              </p>
            )}

            {bookmarkletState === "ready" && bookmarkletHref && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-(--ditto-text-secondary)">
                  {t("addWafStepsIntro")}
                </p>

                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-(--ditto-text) mb-1">
                      {t("addWafStep1Title")}
                    </p>
                    <p className="text-xs text-(--ditto-text-secondary) leading-relaxed">
                      {t("addWafStep1DescPart1")}{" "}
                      <kbd className="px-1.5 py-0.5 rounded border border-(--ditto-border) bg-(--ditto-surface) text-[11px] font-mono">
                        ⌘ Cmd
                      </kbd>{" "}
                      +{" "}
                      <kbd className="px-1.5 py-0.5 rounded border border-(--ditto-border) bg-(--ditto-surface) text-[11px] font-mono">
                        Shift
                      </kbd>{" "}
                      +{" "}
                      <kbd className="px-1.5 py-0.5 rounded border border-(--ditto-border) bg-(--ditto-surface) text-[11px] font-mono">
                        B
                      </kbd>{" "}
                      {t("addWafStep1DescOn")}{" "}
                      <kbd className="px-1.5 py-0.5 rounded border border-(--ditto-border) bg-(--ditto-surface) text-[11px] font-mono">
                        Ctrl
                      </kbd>{" "}
                      +{" "}
                      <kbd className="px-1.5 py-0.5 rounded border border-(--ditto-border) bg-(--ditto-surface) text-[11px] font-mono">
                        Shift
                      </kbd>{" "}
                      +{" "}
                      <kbd className="px-1.5 py-0.5 rounded border border-(--ditto-border) bg-(--ditto-surface) text-[11px] font-mono">
                        B
                      </kbd>{" "}
                      {t("addWafStep1DescSuffix")}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-(--ditto-text) mb-1">
                      {t("addWafStep2Title")}
                    </p>
                    <p className="text-xs text-(--ditto-text-secondary) leading-relaxed mb-2">
                      {t("addWafStep2Desc")}
                    </p>
                    <a
                      ref={bookmarkletAnchorRef}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(t("addWafDragAlert"));
                      }}
                      draggable
                      title={t("addWafDragTitle")}
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-(--ditto-primary) bg-(--ditto-primary)/10 hover:bg-(--ditto-primary)/15 px-4 py-2.5 text-sm font-semibold text-(--ditto-primary) cursor-grab active:cursor-grabbing select-none transition-colors"
                    >
                      <span className="text-base leading-none">↥</span>
                      {t("addWafDragLabel")}
                    </a>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-(--ditto-text) mb-1">
                      {t("addWafStep3Title")}
                    </p>
                    <p className="text-xs text-(--ditto-text-secondary) leading-relaxed">
                      {t("addWafStep3DescPart1")}{" "}
                      <code className="px-1.5 py-0.5 rounded bg-(--ditto-surface) text-(--ditto-text) text-[11px] font-mono break-all">
                        {url || t("addWafStep3Fallback")}
                      </code>{" "}
                      {t("addWafStep3DescPart2")}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-(--ditto-primary) text-(--ditto-bg) text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-(--ditto-text) mb-1">
                      {t("addWafStep4Title")}
                    </p>
                    <p className="text-xs text-(--ditto-text-secondary) leading-relaxed">
                      {t("addWafStep4Desc")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success */}
        {state === "done" && (
          <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <p className="text-sm text-green-400 mb-2">
              {t("addSuccessMsg")}
            </p>
            {specialCharged > 0 && (
              <p className="text-xs text-(--ditto-text-secondary) mb-3">
                {t("addSuccessSpecialPart1")} <strong>+{specialCharged}</strong> {t("addSuccessSpecialPart2")}
              </p>
            )}
            {specialCharged === 0 && state === "done" && (
              // Was it a free special extraction? We can't tell reliably without another call;
              // showing nothing when extraCost === 0 keeps the UI clean for normal successes too.
              null
            )}
            <div className="flex gap-3">
              <a
                href={`/design/${resultSlug}`}
                className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg)"
              >
                {t("addViewDesign")}
              </a>
              <button
                onClick={() => {
                  setState("idle");
                  setUrl("");
                  setName("");
                }}
                className="rounded-lg border border-(--ditto-border) px-4 py-2 text-sm text-(--ditto-text-secondary)"
              >
                {t("addAnother")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Catalog Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">
          {t("addCatalogTitle")}
        </h2>
        <p className="text-sm text-(--ditto-text-muted) mb-4">
          {t("addCatalogSubtitle")}
        </p>
        <a
          id="tour-catalog-link"
          href={lp("/catalog")}
          className="inline-flex items-center gap-2 rounded-lg border border-(--ditto-border) px-4 py-2 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
        >
          {t("addCatalogBtn")}
        </a>
      </div>
    </div>
  );
}

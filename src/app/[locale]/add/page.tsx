"use client";

import { useState, useEffect } from "react";
import { useCredits } from "@/lib/credits-context";
import { useLocalePath } from "@/lib/locale-context";
import { useOnborda } from "onborda";
import { hasSeenTour } from "@/lib/onboarding";

type ExtractionState = "idle" | "extracting" | "done" | "error";

interface ExtractionProgress {
  step: string;
  progress: number;
}

export default function AddDesignPage() {
  const lp = useLocalePath();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<ExtractionState>("idle");
  const [progress, setProgress] = useState<ExtractionProgress>({
    step: "",
    progress: 0,
  });
  const [error, setError] = useState("");
  const [resultSlug, setResultSlug] = useState("");
  const { credits, deduct, refresh } = useCredits();

  const canAdd = credits !== null && credits >= 100;
  const { startOnborda } = useOnborda();

  useEffect(() => {
    if (!hasSeenTour("add-design")) {
      const timer = setTimeout(() => startOnborda("add-design"), 400);
      return () => clearTimeout(timer);
    }
  }, [startOnborda]);

  const handleExtract = async () => {
    if (!url) return;

    setState("extracting");
    setError("");

    // Simulate progress steps
    const steps = [
      "Launching browser...",
      "Loading page...",
      "Extracting colors...",
      "Analyzing typography...",
      "Detecting components...",
      "Generating DESIGN.md...",
      "Saving...",
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
        throw new Error(data.error || "Extraction failed");
      }

      const data = await res.json();
      setResultSlug(data.slug);
      setState("done");
      setProgress({ step: "Complete!", progress: 100 });
      deduct(100);
      refresh();
    } catch (err) {
      clearInterval(progressInterval);
      setState("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text) mb-2">
        Add Design
      </h1>
      <p className="text-sm text-(--ditto-text-secondary) mb-8">
        Enter a website URL and Ditto will reverse-engineer its design system.
      </p>

      <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
        <div className="flex flex-col gap-4">
          {/* URL Input */}
          <div id="tour-url-input">
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              Website URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://stripe.com"
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary) transition-colors"
              disabled={state === "extracting"}
            />
          </div>

          {/* Name Input */}
          <div id="tour-name-input">
            <label className="block text-sm font-medium text-(--ditto-text) mb-1.5">
              Design Name{" "}
              <span className="font-normal text-(--ditto-text-muted)">
                (optional, auto-derived from URL)
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Stripe"
              className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary) transition-colors"
              disabled={state === "extracting"}
            />
          </div>

          {/* Extract Button */}
          {!canAdd && credits !== null && (
            <div className="rounded-lg border border-(--ditto-warning)/30 bg-(--ditto-warning)/10 px-4 py-2.5">
              <p className="text-sm text-(--ditto-warning)">Crediti insufficienti. Servono 100 crediti, ne hai {credits}.</p>
            </div>
          )}
          <button
            id="tour-extract-btn"
            onClick={handleExtract}
            disabled={!url || state === "extracting" || !canAdd}
            className="w-full rounded-lg bg-(--ditto-primary) px-4 py-2.5 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state === "extracting" ? "Extracting..." : `Extract Design System (100 crediti)`}
          </button>
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
              Try again
            </button>
          </div>
        )}

        {/* Success */}
        {state === "done" && (
          <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <p className="text-sm text-green-400 mb-3">
              Design system extracted successfully!
            </p>
            <div className="flex gap-3">
              <a
                href={`/design/${resultSlug}`}
                className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg)"
              >
                View Design
              </a>
              <button
                onClick={() => {
                  setState("idle");
                  setUrl("");
                  setName("");
                }}
                className="rounded-lg border border-(--ditto-border) px-4 py-2 text-sm text-(--ditto-text-secondary)"
              >
                Add Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Catalog Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">
          Or browse the catalog
        </h2>
        <p className="text-sm text-(--ditto-text-muted) mb-4">
          Unlock curated design systems from our collection of 70+ styles for 50 credits each.
        </p>
        <a
          id="tour-catalog-link"
          href={lp("/catalog")}
          className="inline-flex items-center gap-2 rounded-lg border border-(--ditto-border) px-4 py-2 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
        >
          Browse Catalog
        </a>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCredits } from "@/lib/credits-context";
import { useOnborda } from "onborda";
import { hasSeenTour } from "@/lib/onboarding";
import {
  MOOD_QUESTIONS,
  MOOD_DIMENSIONS,
  createEmptyProfile,
  autoDetectMood,
} from "@/lib/mood";
import type { MoodProfile, AutoDetectedAnswer } from "@/lib/mood";
import type { DesignTokens, ResolvedDesign, StoredDesign } from "@/lib/types";
import { PreviewShell } from "@/components/preview/PreviewShell";
import { LandingPreview } from "@/components/preview/pages/LandingPreview";
import { DashboardPreview } from "@/components/preview/pages/DashboardPreview";
import { AuthPreview } from "@/components/preview/pages/AuthPreview";
import { PricingPreview } from "@/components/preview/pages/PricingPreview";
import { BlogPreview } from "@/components/preview/pages/BlogPreview";
import { ComponentsPreview } from "@/components/preview/pages/ComponentsPreview";
import { FloatingEditor } from "@/components/FloatingEditor";
import {
  Smile,
  Briefcase,
  Landmark,
  Wind,
  Zap,
  Rocket,
  Sun,
  Cloud,
  Snowflake,
  Circle,
  Square,
  Diamond,
  Palette,
  Ruler,
  LayoutGrid,
  X,
  Crosshair,
  type LucideIcon,
} from "lucide-react";
import { LottieLoader } from "@/components/LottieLoader";

const ICON_MAP: Record<string, LucideIcon> = {
  smile: Smile,
  briefcase: Briefcase,
  landmark: Landmark,
  wind: Wind,
  zap: Zap,
  rocket: Rocket,
  sun: Sun,
  cloud: Cloud,
  snowflake: Snowflake,
  circle: Circle,
  square: Square,
  diamond: Diamond,
  palette: Palette,
  ruler: Ruler,
  "layout-grid": LayoutGrid,
};

function MoodIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} strokeWidth={1.5} />;
}

// ── Types ──

interface Inspiration {
  url: string;
  name: string;
  tokens: DesignTokens;
  resolved: ResolvedDesign;
  screenshot: string;
  fonts: string[];
  moodProfile: MoodProfile;
  weight: number;
  status: "pending" | "extracting" | "ready" | "error";
  error?: string;
  source: "url" | "catalog";
}

const PREVIEW_PAGES = [
  { id: "landing", label: "Landing", Component: LandingPreview },
  { id: "dashboard", label: "Dashboard", Component: DashboardPreview },
  { id: "auth", label: "Auth", Component: AuthPreview },
  { id: "pricing", label: "Pricing", Component: PricingPreview },
  { id: "blog", label: "Blog", Component: BlogPreview },
  { id: "components", label: "Components", Component: ComponentsPreview },
];

// ── Main Component ──

export default function InspirePage() {
  return (
    <Suspense>
      <InspireContent />
    </Suspense>
  );
}

function InspireContent() {
  // State
  const [urls, setUrls] = useState<string[]>(["", "", ""]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [phase, setPhase] = useState<"urls" | "flow" | "result">("urls");
  const [mode, setMode] = useState<"auto" | "precisa" | null>(null);
  const {
    credits,
    deduct: deductCredits,
    refresh: refreshCredits,
  } = useCredits();

  const canGenerate = credits !== null && credits >= 300;
  const { startOnborda } = useOnborda();

  useEffect(() => {
    if (!hasSeenTour("inspire")) {
      const timer = setTimeout(() => startOnborda("inspire"), 400);
      return () => clearTimeout(timer);
    }
  }, [startOnborda]);

  // Catalog state
  const [catalogDesigns, setCatalogDesigns] = useState<StoredDesign[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<StoredDesign[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const searchParams = useSearchParams();

  // Pre-select designs from ?from= param (sent by dashboard bulk action)
  useEffect(() => {
    const fromParam = searchParams.get("from");
    if (!fromParam) return;
    const slugs = fromParam.split(",").filter(Boolean);
    if (slugs.length === 0) return;

    fetch("/api/designs")
      .then((r) => r.json())
      .then((data: StoredDesign[]) => {
        if (!Array.isArray(data)) return;
        setCatalogDesigns(data);
        setCatalogLoaded(true);
        const matched = data.filter((d) => slugs.includes(d.slug));
        if (matched.length > 0) {
          setSelectedCatalog(matched);
          setShowCatalog(true);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // Auto-detect state: per-inspiration answers
  const [autoAnswers, setAutoAnswers] = useState<
    Record<number, AutoDetectedAnswer[]>
  >({});

  // Save state (for result phase)
  const [saveState, setSaveState] = useState<"unsaved" | "saving" | "saved">(
    "unsaved"
  );
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  // Questionnaire state
  const [qInspIdx, setQInspIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [questionnaireDone, setQuestionnaireDone] = useState(false);

  // Result state
  const [result, setResult] = useState<{
    slug: string;
    name: string;
    url: string;
    tokens: DesignTokens;
    resolved: ResolvedDesign;
    designMd: string;
  } | null>(null);
  const [editResolved, setEditResolved] = useState<ResolvedDesign | null>(null);
  const [activePreview, setActivePreview] = useState("landing");
  const [generating, setGenerating] = useState(false);

  // All unique fonts from all inspirations
  const allFonts = [
    ...new Set(inspirations.flatMap((i) => i.fonts || [])),
  ].filter(Boolean);

  // Collect all unique colors from all inspirations (for the palette picker)
  const allInspirationColors = (() => {
    const colorMap = new Map<string, { hex: string; source: string }>();
    for (const insp of inspirations) {
      if (insp.status !== "ready" || !insp.resolved) continue;
      const name = insp.name || "?";
      for (const [, val] of Object.entries(insp.resolved)) {
        if (
          typeof val === "string" &&
          val.startsWith("#") &&
          val.length === 7
        ) {
          if (!colorMap.has(val)) colorMap.set(val, { hex: val, source: name });
        }
      }
      // Also from raw tokens
      if (insp.tokens?.colors) {
        for (const c of insp.tokens.colors.slice(0, 15)) {
          if (!colorMap.has(c.hex))
            colorMap.set(c.hex, { hex: c.hex, source: name });
        }
      }
    }
    return Array.from(colorMap.values());
  })();

  // Collect all font sources + font faces for preview loading
  const allFontSources = inspirations
    .filter((i) => i.status === "ready" && i.tokens?.fontSources)
    .flatMap((i) => i.tokens.fontSources);
  const allFontFaces = inspirations
    .filter((i) => i.status === "ready" && i.tokens?.fontFaces)
    .flatMap((i) => i.tokens.fontFaces);
  const allDownloadedFonts = inspirations
    .filter((i) => i.status === "ready" && i.tokens?.downloadedFonts)
    .flatMap((i) => i.tokens.downloadedFonts);

  // Extraction queue
  const extractionStarted = useRef(false);

  const modeRef = useRef<"auto" | "precisa" | null>(null);

  const extractOne = async (url: string, index: number) => {
    setInspirations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: "extracting" };
      return updated;
    });

    try {
      const res = await fetch("/api/inspire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract-one", url }),
      });

      if (!res.ok) throw new Error("Extraction failed");
      const data = await res.json();

      // In auto mode, run auto-detection immediately
      let detectedProfile = createEmptyProfile();
      if (modeRef.current === "auto" && data.resolved && data.tokens) {
        const result = autoDetectMood(data.resolved, data.tokens);
        detectedProfile = result.profile;
        setAutoAnswers((prev) => ({ ...prev, [index]: result.answers }));
      }

      setInspirations((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          ...data,
          moodProfile:
            modeRef.current === "auto" ? detectedProfile : createEmptyProfile(),
          weight: 1 / prev.length,
          status: "ready",
          fonts: data.fonts || [],
        };
        return updated;
      });
    } catch (err) {
      setInspirations((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: "error",
          error: err instanceof Error ? err.message : "Failed",
        };
        return updated;
      });
    }
  };

  // Load catalog on demand
  const loadCatalog = async () => {
    if (catalogLoaded) return;
    try {
      const res = await fetch("/api/designs");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCatalogDesigns(data);
      }
    } catch {
      /* ignore */
    }
    setCatalogLoaded(true);
  };

  const toggleCatalogDesign = (design: StoredDesign) => {
    setSelectedCatalog((prev) => {
      const exists = prev.find((d) => d.id === design.id);
      if (exists) return prev.filter((d) => d.id !== design.id);
      return [...prev, design];
    });
  };

  const totalSelected =
    urls.filter((u) => u.trim()).length + selectedCatalog.length;

  // Start extraction flow
  const handleStart = (chosenMode: "auto" | "precisa") => {
    const validUrls = urls.filter((u) => u.trim());
    if (validUrls.length + selectedCatalog.length < 2) return;

    setMode(chosenMode);
    modeRef.current = chosenMode;

    // Build inspirations from URLs
    const urlInspirations: Inspiration[] = validUrls.map((url) => ({
      url: url.startsWith("http") ? url : `https://${url}`,
      name: "",
      tokens: null as unknown as DesignTokens,
      resolved: null as unknown as ResolvedDesign,
      screenshot: "",
      fonts: [],
      moodProfile: createEmptyProfile(),
      weight: 1 / (validUrls.length + selectedCatalog.length),
      status: "pending" as const,
      source: "url" as const,
    }));

    // Build inspirations from catalog selections (already ready)
    const catalogAutoAnswers: Record<number, AutoDetectedAnswer[]> = {};
    const catalogInspirations: Inspiration[] = selectedCatalog.map((d, idx) => {
      let profile = createEmptyProfile();
      if (chosenMode === "auto") {
        const detected = autoDetectMood(d.resolved, d.tokens);
        profile = detected.profile;
        catalogAutoAnswers[validUrls.length + idx] = detected.answers;
      }
      return {
        url: d.url,
        name: d.name,
        tokens: d.tokens,
        resolved: d.resolved,
        screenshot: d.tokens.meta.screenshot || "",
        fonts:
          d.tokens.typography?.map(
            (t: { fontFamily: string }) => t.fontFamily
          ) || [],
        moodProfile: profile,
        weight: 1 / (validUrls.length + selectedCatalog.length),
        status: "ready" as const,
        source: "catalog" as const,
      };
    });

    const initial = [...urlInspirations, ...catalogInspirations];

    setInspirations(initial);
    setAutoAnswers(catalogAutoAnswers);
    setSaveState("unsaved");
    setSavedSlug(null);
    setPhase("flow");
    setQInspIdx(0);
    setQIdx(0);
    // In auto mode, questionnaire is "done" immediately — we auto-detect
    setQuestionnaireDone(chosenMode === "auto");
    extractionStarted.current = false;
  };

  // Kick off sequential extraction when flow starts
  useEffect(() => {
    if (phase !== "flow" || extractionStarted.current) return;
    extractionStarted.current = true;

    // Extract all URLs sequentially (but questionnaire starts as soon as first is ready)
    (async () => {
      for (let i = 0; i < inspirations.length; i++) {
        if (inspirations[i].status === "pending") {
          await extractOne(inspirations[i].url, i);
        }
      }
    })();
  }, [phase, inspirations, extractOne]);

  // Current inspiration for questions
  const currentInsp = inspirations[qInspIdx];
  const currentReady = currentInsp?.status === "ready";
  const readyCount = inspirations.filter((i) => i.status === "ready").length;
  const extractingCount = inspirations.filter(
    (i) => i.status === "extracting" || i.status === "pending"
  ).length;

  // Answer a question
  const handleAnswer = (optionIdx: number) => {
    const question = MOOD_QUESTIONS[qIdx];
    const option = question.options[optionIdx];

    // Update mood profile
    setInspirations((prev) => {
      const updated = [...prev];
      const profile = { ...updated[qInspIdx].moodProfile };
      const scores = { ...profile.scores };
      for (const [dimId, score] of Object.entries(option.scores)) {
        scores[dimId] = score;
      }
      updated[qInspIdx] = { ...updated[qInspIdx], moodProfile: { scores } };
      return updated;
    });

    // Advance
    if (qIdx < MOOD_QUESTIONS.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      // Done with this inspiration, find next ready one
      let nextIdx = -1;
      for (let i = qInspIdx + 1; i < inspirations.length; i++) {
        if (inspirations[i].status === "ready") {
          nextIdx = i;
          break;
        }
      }
      if (nextIdx >= 0) {
        setQInspIdx(nextIdx);
        setQIdx(0);
      } else {
        setQuestionnaireDone(true);
      }
    }
  };

  function hasAnswered(idx: number): boolean {
    const profile = inspirations[idx]?.moodProfile;
    if (!profile) return false;
    return Object.values(profile.scores).some((s) => s !== 0);
  }

  // Check if questionnaire can continue (next inspiration became ready) — only in precisa mode
  useEffect(() => {
    if (modeRef.current === "auto") return;
    if (!questionnaireDone || phase !== "flow") return;
    // Check if there are newly ready inspirations we haven't questioned
    for (let i = qInspIdx + 1; i < inspirations.length; i++) {
      if (inspirations[i].status === "ready" && !hasAnswered(i)) {
        setQInspIdx(i);
        setQIdx(0);
        setQuestionnaireDone(false);
        return;
      }
    }
  }, [inspirations, questionnaireDone, phase, qInspIdx, hasAnswered]);

  // Generate hybrid
  const handleGenerate = async () => {
    setGenerating(true);
    const ready = inspirations.filter(
      (i) => i.status === "ready" && hasAnswered(inspirations.indexOf(i))
    );

    try {
      const res = await fetch("/api/inspire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          inspirations: ready.map((i) => ({
            name: i.name,
            url: i.url,
            tokens: i.tokens,
            resolved: i.resolved,
            moodProfile: i.moodProfile,
            weight: i.weight,
          })),
        }),
      });

      const data = await res.json();
      setResult(data);
      setEditResolved(data.resolved);
      setSaveName(data.name || "");
      setSaveDescription("");
      setSaveState("unsaved");
      setShowSaveModal(true);
      setPhase("result");
      deductCredits(300);
      refreshCredits();
    } catch {
      // Stay on map
    }
    setGenerating(false);
  };

  const ActivePreviewComponent =
    PREVIEW_PAGES.find((p) => p.id === activePreview)?.Component ||
    LandingPreview;

  // ── RENDER ──

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <a
          href="/dashboard"
          className="text-sm text-(--ditto-text-muted) hover:text-(--ditto-text)">
          ← Library
        </a>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text)">
          Genera un Design Ispirato
        </h1>
        <p className="text-sm text-(--ditto-text-muted) mt-1">
          Passa le tue ispirazioni, rispondi a qualche domanda, Ditto le fonde
          nel tuo stile
        </p>
      </div>

      {/* ═══ URL INPUT ═══ */}
      {phase === "urls" && (
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">
            Scegli le tue ispirazioni
          </h2>
          <p className="text-sm text-(--ditto-text-muted) mb-6">
            Inserisci 2-10 URL di siti che ti piacciono. Ditto assorbirà il
            design di ognuno.
          </p>
          <div id="tour-inspire-urls" className="flex flex-col gap-3">
            {urls.map((url, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-sm text-(--ditto-text-muted) w-6">
                  {i + 1}.
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const u = [...urls];
                    u[i] = e.target.value;
                    setUrls(u);
                  }}
                  placeholder={`https://example${i + 1}.com`}
                  className="flex-1 rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
                />
                {urls.length > 2 && (
                  <button
                    onClick={() => setUrls(urls.filter((_, j) => j !== i))}
                    className="text-(--ditto-text-muted) hover:text-(--ditto-error) text-sm px-2">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {urls.length < 10 && (
            <button
              onClick={() => setUrls([...urls, ""])}
              className="mt-3 text-sm text-(--ditto-primary) hover:text-(--ditto-primary-hover)">
              + Aggiungi ispirazione
            </button>
          )}

          {/* Catalog picker */}
          <div id="tour-inspire-catalog" className="mt-6 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-4">
            <button
              onClick={() => {
                setShowCatalog(!showCatalog);
                loadCatalog();
              }}
              className="flex items-center justify-between w-full text-left">
              <div>
                <h3 className="text-sm font-semibold text-(--ditto-text)">
                  Oppure scegli dalla tua libreria
                </h3>
                <p className="text-xs text-(--ditto-text-muted) mt-0.5">
                  {selectedCatalog.length > 0
                    ? `${selectedCatalog.length} design selezionat${
                        selectedCatalog.length === 1 ? "o" : "i"
                      }`
                    : "Usa design che hai gia salvato come ispirazioni"}
                </p>
              </div>
              <span className="text-(--ditto-text-muted) text-sm">
                {showCatalog ? "▲" : "▼"}
              </span>
            </button>

            {showCatalog && (
              <div className="mt-4">
                {!catalogLoaded ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-(--ditto-primary) border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : catalogDesigns.length === 0 ? (
                  <p className="text-sm text-(--ditto-text-muted) py-4 text-center">
                    Nessun design nella tua libreria. Aggiungine uno dalla
                    pagina Add Design.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {catalogDesigns.map((design) => {
                      const isSelected = selectedCatalog.some(
                        (d) => d.id === design.id
                      );
                      return (
                        <button
                          key={design.id}
                          onClick={() => toggleCatalogDesign(design)}
                          className="flex items-center gap-3 p-3 rounded-lg border text-left transition-all"
                          style={{
                            borderColor: isSelected
                              ? "var(--ditto-primary)"
                              : "var(--ditto-border)",
                            backgroundColor: isSelected
                              ? "var(--ditto-primary)"
                              : "transparent",
                          }}>
                          <div className="flex gap-1 shrink-0">
                            {[
                              design.resolved.colorPrimary,
                              design.resolved.colorSecondary,
                            ].map((c, ci) => (
                              <div
                                key={ci}
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <div className="min-w-0">
                            <span
                              className="text-sm font-medium truncate block"
                              style={{
                                color: isSelected
                                  ? "var(--ditto-bg)"
                                  : "var(--ditto-text)",
                              }}>
                              {design.name}
                            </span>
                            <span
                              className="text-[10px] truncate block"
                              style={{
                                color: isSelected
                                  ? "var(--ditto-bg)"
                                  : "var(--ditto-text-muted)",
                              }}>
                              {design.url}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected summary */}
          {(urls.filter((u) => u.trim()).length > 0 ||
            selectedCatalog.length > 0) && (
            <div className="mt-4 text-xs text-(--ditto-text-muted)">
              Totale ispirazioni: {totalSelected} (minimo 2)
            </div>
          )}

          {/* Mode selection */}
          <div id="tour-inspire-mode" className="mt-6 mb-2">
            <h3 className="text-sm font-semibold text-(--ditto-text) mb-3">
              Scegli la modalità
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStart("auto")}
                disabled={totalSelected < 2}
                className="group relative rounded-xl border-2 border-(--ditto-border) bg-(--ditto-surface) p-5 text-left hover:border-(--ditto-primary) transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <div className="flex items-center gap-2 mb-2">
                  <Zap
                    className="w-5 h-5 text-(--ditto-primary)"
                    strokeWidth={1.5}
                  />
                  <span className="text-base font-semibold text-(--ditto-text) group-hover:text-(--ditto-primary)">
                    Auto
                  </span>
                </div>
                <p className="text-xs text-(--ditto-text-muted) leading-relaxed">
                  Ditto analizza i siti e rileva automaticamente tono, energia,
                  colori, forme e densità. Vedrai un riepilogo per verificare
                  prima di generare.
                </p>
              </button>
              <button
                onClick={() => handleStart("precisa")}
                disabled={totalSelected < 2}
                className="group relative rounded-xl border-2 border-(--ditto-border) bg-(--ditto-surface) p-5 text-left hover:border-(--ditto-primary) transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <div className="flex items-center gap-2 mb-2">
                  <Crosshair
                    className="w-5 h-5 text-(--ditto-primary)"
                    strokeWidth={1.5}
                  />
                  <span className="text-base font-semibold text-(--ditto-text) group-hover:text-(--ditto-primary)">
                    Precisa
                  </span>
                </div>
                <p className="text-xs text-(--ditto-text-muted) leading-relaxed">
                  Rispondi a 5 domande per ogni ispirazione per guidare la
                  fusione con precisione. Più controllo, risultato più
                  personalizzato.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FLOW: EXTRACTION + QUESTIONNAIRE ═══ */}
      {phase === "flow" && (
        <div>
          {/* Status bar */}
          <div className="flex items-center gap-3 mb-6 rounded-lg border border-(--ditto-border) bg-(--ditto-surface) p-3">
            <div className="flex gap-1.5">
              {inspirations.map((insp, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full transition-colors"
                  title={`${insp.url} — ${insp.status}`}
                  style={{
                    backgroundColor:
                      insp.status === "ready"
                        ? "var(--ditto-success)"
                        : insp.status === "extracting"
                        ? "var(--ditto-warning)"
                        : insp.status === "error"
                        ? "var(--ditto-error)"
                        : "var(--ditto-border)",
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-(--ditto-text-muted)">
              {extractingCount > 0
                ? `Ditto sta assorbendo... (${readyCount}/${inspirations.length} pronte)`
                : `Tutte le ${readyCount} ispirazioni pronte`}
            </span>
            {extractingCount > 0 && (
              <div className="ml-auto w-4 h-4 border-2 border-(--ditto-primary) border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Waiting for first extraction (only in precisa mode) */}
          {mode === "precisa" && !currentReady && !questionnaireDone && (
            <div className="flex flex-col items-center py-20">
              <span className="inline-block mb-4">
                <LottieLoader size={200} />
              </span>
              <p className="text-lg font-semibold text-(--ditto-text)">
                Ditto sta assorbendo il primo design...
              </p>
              <p className="text-sm text-(--ditto-text-muted) mt-1">
                Appena pronto, iniziamo con le domande
              </p>
            </div>
          )}

          {/* Auto mode: waiting for all extractions */}
          {mode === "auto" && extractingCount > 0 && (
            <div className="flex flex-col items-center py-20">
              <span className="inline-block mb-4">
                <LottieLoader size={200} />
              </span>
              <p className="text-lg font-semibold text-(--ditto-text)">
                Ditto sta analizzando automaticamente...
              </p>
              <p className="text-sm text-(--ditto-text-muted) mt-1">
                {readyCount}/{inspirations.length} ispirazioni analizzate
              </p>
            </div>
          )}

          {/* Auto mode: show summary of auto-detected answers */}
          {mode === "auto" &&
            extractingCount === 0 &&
            readyCount > 0 &&
            !generating &&
            !result && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-(--ditto-text) mb-1">
                    Analisi Automatica Completata
                  </h2>
                  <p className="text-sm text-(--ditto-text-muted)">
                    Ecco cosa Ditto ha rilevato da ogni ispirazione. Verifica le
                    risposte prima di generare.
                  </p>
                </div>

                {/* Per-inspiration auto-detected answers */}
                <div className="space-y-4 mb-8">
                  {inspirations
                    .filter((insp) => insp.status === "ready")
                    .map((insp) => {
                      const realIdx = inspirations.indexOf(insp);
                      const answers = autoAnswers[realIdx] || [];
                      return (
                        <div
                          key={realIdx}
                          className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) overflow-hidden">
                          {/* Inspiration header */}
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-(--ditto-border)">
                            {insp.screenshot && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={insp.screenshot}
                                alt={insp.name}
                                className="w-10 h-10 rounded-md object-cover border border-(--ditto-border)"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-(--ditto-text) truncate">
                                {insp.name || insp.url}
                              </h3>
                              <p className="text-[11px] text-(--ditto-text-muted) truncate">
                                {insp.url}
                              </p>
                            </div>
                            {insp.resolved && (
                              <div className="flex gap-1 shrink-0">
                                {[
                                  insp.resolved.colorPrimary,
                                  insp.resolved.colorSecondary,
                                  insp.resolved.colorAccent,
                                ].map((c, ci) => (
                                  <div
                                    key={ci}
                                    className="w-5 h-5 rounded border border-(--ditto-border)"
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Auto-detected answers grid */}
                          <div className="grid grid-cols-5 divide-x divide-(--ditto-border)">
                            {answers.map((answer) => (
                              <div
                                key={answer.questionId}
                                className="px-3 py-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <MoodIcon
                                    name={answer.chosenIcon}
                                    className="w-4 h-4 text-(--ditto-primary)"
                                  />
                                  <span className="text-xs font-semibold text-(--ditto-text)">
                                    {answer.chosenOption}
                                  </span>
                                </div>
                                <p className="text-[10px] text-(--ditto-text-muted) leading-snug mb-1.5">
                                  {answer.chosenDescription}
                                </p>
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                                      answer.confidence === "high"
                                        ? "bg-green-500"
                                        : answer.confidence === "medium"
                                        ? "bg-yellow-500"
                                        : "bg-red-400"
                                    }`}
                                  />
                                  <span className="text-[9px] text-(--ditto-text-muted)">
                                    {answer.reason}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          {/* Questionnaire (only in precisa mode) */}
          {mode === "precisa" && currentReady && !questionnaireDone && (
            <div className="grid grid-cols-5 gap-6">
              {/* Left: context from inspiration */}
              <div className="col-span-2">
                <div className="sticky top-20 space-y-4">
                  {/* Screenshot */}
                  {currentInsp.screenshot && (
                    <div className="rounded-lg border border-(--ditto-border) overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentInsp.screenshot}
                        alt={currentInsp.name}
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="rounded-lg border border-(--ditto-border) bg-(--ditto-surface) p-4">
                    <span className="text-[10px] uppercase tracking-wider text-(--ditto-text-muted)">
                      Ispirazione {qInspIdx + 1} di {inspirations.length}
                    </span>
                    <h3 className="text-base font-semibold text-(--ditto-text) mt-1">
                      {currentInsp.name || currentInsp.url}
                    </h3>

                    {/* Color swatches */}
                    {currentInsp.resolved && (
                      <div className="flex gap-1.5 mt-3">
                        {[
                          currentInsp.resolved.colorPrimary,
                          currentInsp.resolved.colorSecondary,
                          currentInsp.resolved.colorAccent,
                          currentInsp.resolved.colorBackground,
                          currentInsp.resolved.colorTextPrimary,
                        ].map((c, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-md border border-(--ditto-border)"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    )}

                    {/* Font info */}
                    {currentInsp.resolved && (
                      <div className="mt-3 text-xs text-(--ditto-text-muted)">
                        <span className="font-medium text-(--ditto-text-secondary)">
                          Font:
                        </span>{" "}
                        {currentInsp.resolved.fontHeading}
                        {currentInsp.resolved.fontHeading !==
                          currentInsp.resolved.fontBody &&
                          ` / ${currentInsp.resolved.fontBody}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: questions */}
              <div className="col-span-3">
                <div className="mb-4">
                  <span className="text-xs text-(--ditto-text-muted)">
                    Domanda {qIdx + 1} di {MOOD_QUESTIONS.length}
                  </span>
                  <h2 className="text-xl font-bold text-(--ditto-text) mt-1">
                    {MOOD_QUESTIONS[qIdx].question}
                  </h2>
                  <p className="text-sm text-(--ditto-text-muted) mt-1">
                    {MOOD_QUESTIONS[qIdx].subtitle}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {MOOD_QUESTIONS[qIdx].options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className="group flex items-center gap-4 p-5 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) hover:border-(--ditto-primary) hover:bg-(--ditto-surface) transition-all text-left">
                      <MoodIcon
                        name={option.icon}
                        className="w-6 h-6 text-(--ditto-primary)"
                      />
                      <div>
                        <span className="text-base font-semibold text-(--ditto-text) group-hover:text-(--ditto-primary)">
                          {option.label}
                        </span>
                        <span className="block text-xs text-(--ditto-text-muted) mt-0.5">
                          {option.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Map + weights + generate (both modes, after questionnaire/auto-detect is done) */}
          {questionnaireDone && extractingCount === 0 && readyCount > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-(--ditto-text) mb-2">
                Mappa delle Ispirazioni
              </h2>
              <p className="text-sm text-(--ditto-text-muted) mb-6">
                {mode === "auto"
                  ? "Regola i pesi se vuoi, poi genera il design ibrido."
                  : "Regola il peso di ogni ispirazione, poi genera il design ibrido."}
              </p>

              {/* 2D Map */}
              <div className="relative w-full h-72 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) mb-6 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-px h-full bg-(--ditto-border) opacity-50" />
                </div>
                <div className="absolute inset-0 flex items-center">
                  <div className="h-px w-full bg-(--ditto-border) opacity-50" />
                </div>
                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-(--ditto-text-muted)">
                  Serio
                </span>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-(--ditto-text-muted)">
                  Giocoso
                </span>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-(--ditto-text-muted)">
                  Calmo
                </span>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-(--ditto-text-muted)">
                  Audace
                </span>

                {inspirations
                  .filter((i) => i.status === "ready")
                  .map((insp, idx) => {
                    const x = ((insp.moodProfile.scores.energy || 0) + 1) / 2;
                    const y = 1 - ((insp.moodProfile.scores.tone || 0) + 1) / 2;
                    return (
                      <div
                        key={idx}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                        style={{
                          left: `${x * 80 + 10}%`,
                          top: `${y * 80 + 10}%`,
                        }}>
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            backgroundColor:
                              insp.resolved?.colorPrimary || "#666",
                          }}>
                          {idx + 1}
                        </div>
                        <span className="text-[10px] text-(--ditto-text-secondary) mt-1 bg-(--ditto-surface) px-1 rounded whitespace-nowrap max-w-[80px] truncate">
                          {insp.name}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Weight sliders */}
              <div className="space-y-3 mb-6">
                {inspirations
                  .filter((ins) => ins.status === "ready")
                  .map((insp) => {
                    const realIdx = inspirations.indexOf(insp);
                    return (
                      <div key={realIdx} className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{
                            backgroundColor: insp.resolved?.colorPrimary,
                          }}
                        />
                        <span className="text-sm text-(--ditto-text-secondary) w-28 truncate">
                          {insp.name}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(insp.weight * 100)}
                          onChange={(e) => {
                            const updated = [...inspirations];
                            updated[realIdx] = {
                              ...updated[realIdx],
                              weight: parseInt(e.target.value) / 100,
                            };
                            setInspirations(updated);
                          }}
                          className="flex-1 accent-(--ditto-primary)"
                        />
                        <span className="text-sm text-(--ditto-text-muted) w-10 text-right">
                          {Math.round(insp.weight * 100)}%
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Mood summary */}
              <div className="rounded-lg border border-(--ditto-border) bg-(--ditto-surface) p-4 mb-6">
                <h3 className="text-sm font-semibold text-(--ditto-text) mb-3">
                  Profilo
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {MOOD_DIMENSIONS.map((dim) => {
                    const ready = inspirations.filter(
                      (i) => i.status === "ready"
                    );
                    const totalW = ready.reduce((s, i) => s + i.weight, 0);
                    const avg =
                      totalW > 0
                        ? ready.reduce(
                            (s, i) =>
                              s +
                              (i.moodProfile.scores[dim.id] || 0) * i.weight,
                            0
                          ) / totalW
                        : 0;
                    return (
                      <div key={dim.id} className="flex items-center gap-2">
                        <span className="text-[11px] text-(--ditto-text-muted) w-20 shrink-0">
                          {dim.label}
                        </span>
                        <div className="flex-1 h-1.5 bg-(--ditto-bg) rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-(--ditto-primary) transition-all"
                            style={{ width: `${((avg + 1) / 2) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-(--ditto-text-muted) w-20 text-right">
                          {avg < -0.3
                            ? dim.poles[0]
                            : avg > 0.3
                            ? dim.poles[1]
                            : "Bilanciato"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!canGenerate && credits !== null && (
                <div className="rounded-lg border border-(--ditto-warning)/30 bg-(--ditto-warning)/10 px-4 py-2.5 mb-3">
                  <p className="text-sm text-(--ditto-warning)">
                    Crediti insufficienti. Servono 300 crediti, ne hai {credits}
                    .
                  </p>
                </div>
              )}
              <button
                id="tour-inspire-generate"
                onClick={handleGenerate}
                disabled={generating || !canGenerate}
                className="w-full rounded-lg bg-(--ditto-primary) px-4 py-3 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) disabled:opacity-50">
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-(--ditto-bg) border-t-transparent rounded-full animate-spin" />
                    Ditto si sta trasformando...
                  </span>
                ) : (
                  "Genera il Design Ibrido (300 crediti)"
                )}
              </button>
            </div>
          )}

          {/* Still extracting and questionnaire done for available ones (precisa mode) */}
          {mode === "precisa" && questionnaireDone && extractingCount > 0 && (
            <div className="flex flex-col items-center py-16">
              <span className="inline-block mb-4">
                <LottieLoader size={180} />
              </span>
              <p className="text-base font-semibold text-(--ditto-text)">
                Aspettando le altre ispirazioni...
              </p>
              <p className="text-sm text-(--ditto-text-muted) mt-1">
                {readyCount} pronte, {extractingCount} in arrivo
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ RESULT: FULL-WIDTH PREVIEW + FLOATING EDITOR ═══ */}
      {phase === "result" && editResolved && result && (
        <div>
          {/* Save Modal */}
          {showSaveModal && saveState !== "saved" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-(--ditto-text) mb-1">
                  Salvare questo design?
                </h3>
                <p className="text-sm text-(--ditto-text-muted) mb-5">
                  Il design sara aggiunto alla tua libreria personale.
                </p>

                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-(--ditto-text) mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) outline-none focus:border-(--ditto-primary)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-(--ditto-text) mb-1">
                      Descrizione{" "}
                      <span className="font-normal text-(--ditto-text-muted)">
                        (opzionale)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={saveDescription}
                      onChange={(e) => setSaveDescription(e.target.value)}
                      placeholder="Es. Design per il progetto X"
                      className="w-full rounded-lg border border-(--ditto-border) bg-(--ditto-bg) px-4 py-2.5 text-sm text-(--ditto-text) placeholder-(--ditto-text-muted) outline-none focus:border-(--ditto-primary)"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 rounded-lg border border-(--ditto-border) px-4 py-2.5 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors">
                    Non salvare
                  </button>
                  <button
                    onClick={async () => {
                      if (!saveName.trim()) return;
                      setSaveState("saving");
                      try {
                        const res = await fetch("/api/designs/save", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: saveName.trim(),
                            url: result.url,
                            description: saveDescription,
                            tokens: result.tokens,
                            resolved: editResolved,
                            designMd: result.designMd,
                            source: "extracted",
                          }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setSavedSlug(data.slug);
                          setSaveState("saved");
                          setShowSaveModal(false);
                        } else {
                          setSaveState("unsaved");
                        }
                      } catch {
                        setSaveState("unsaved");
                      }
                    }}
                    disabled={saveState === "saving" || !saveName.trim()}
                    className="flex-1 rounded-lg bg-(--ditto-primary) px-4 py-2.5 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) disabled:opacity-50 transition-colors">
                    {saveState === "saving"
                      ? "Salvataggio..."
                      : "Salva nella libreria"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-(--ditto-text)">
              Il tuo Design Ibrido
            </h2>
            <div className="flex items-center gap-3">
              {saveState === "saved" && savedSlug ? (
                <a
                  href={`/design/${savedSlug}`}
                  className="text-sm text-(--ditto-primary) hover:text-(--ditto-primary-hover)">
                  Apri nel dettaglio →
                </a>
              ) : (
                saveState !== "saving" && (
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="text-sm text-(--ditto-primary) hover:text-(--ditto-primary-hover)">
                    Salva nella libreria
                  </button>
                )
              )}
              {saveState === "saved" && (
                <span className="text-xs text-green-500">Salvato</span>
              )}
            </div>
          </div>

          {/* Page selector */}
          <div className="flex gap-2 mb-4">
            {PREVIEW_PAGES.map((page) => (
              <button
                key={page.id}
                onClick={() => setActivePreview(page.id)}
                className="rounded-lg px-3 py-1.5 text-sm transition-colors"
                style={{
                  backgroundColor:
                    activePreview === page.id
                      ? "var(--ditto-primary)"
                      : "var(--ditto-surface)",
                  color:
                    activePreview === page.id
                      ? "var(--ditto-bg)"
                      : "var(--ditto-text-secondary)",
                  border:
                    activePreview === page.id
                      ? "none"
                      : "1px solid var(--ditto-border)",
                }}>
                {page.label}
              </button>
            ))}
          </div>

          {/* Full-width preview */}
          <PreviewShell
            resolved={editResolved}
            fontSources={allFontSources}
            fontFaces={allFontFaces}
            downloadedFonts={allDownloadedFonts}>
            <ActivePreviewComponent />
          </PreviewShell>

          {/* Floating editor */}
          <FloatingEditor
            resolved={editResolved}
            onChange={setEditResolved}
            allFonts={allFonts}
            inspirationColors={allInspirationColors}
            showGuide={true}
            onDownloadKit={async () => {
              const { generateComponentsCode, generateCssVariables } =
                await import("@/lib/generator/components-code");
              const r = editResolved;
              const code = generateComponentsCode(r);
              const css = generateCssVariables(r);
              for (const f of [
                {
                  name: "DESIGN.md",
                  content: result.designMd,
                  type: "text/markdown",
                },
                { name: "tokens.css", content: css, type: "text/css" },
                {
                  name: "components.tsx",
                  content: code,
                  type: "text/typescript",
                },
              ]) {
                const blob = new Blob([f.content], { type: f.type });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = f.name;
                a.click();
                URL.revokeObjectURL(url);
                await new Promise((res) => setTimeout(res, 200));
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ResolvedDesign, HeaderVariant, SectionVariant, SectionKey } from "@/lib/types";
import { HEADER_VARIANTS, SECTION_KEYS, SECTION_LABELS } from "@/lib/types";
import { HEADER_VARIANT_DESCRIPTIONS } from "@/components/preview/primitives/brand";
import { Paintbrush, X as XIcon, Sparkles, Upload, Trash2, Dices, RotateCcw, ChevronDown } from "lucide-react";
import { useT } from "@/lib/locale-context";

/** Each section's variant lives in a different field on resolved. */
const SECTION_VARIANT_FIELD: Record<SectionKey, keyof ResolvedDesign> = {
  hero: "heroVariant",
  features: "featuresVariant",
  stats: "statsVariant",
  reviews: "reviewsVariant",
  cta: "ctaVariant",
  footer: "footerVariant",
};

function readVariant(resolved: ResolvedDesign, key: SectionKey): SectionVariant {
  const v = resolved[SECTION_VARIANT_FIELD[key]] as SectionVariant | undefined;
  return v || "classic";
}

const COLOR_FIELDS: Array<{ key: keyof ResolvedDesign; label: string; group: string }> = [
  { key: "colorPrimary", label: "Primary", group: "Brand" },
  { key: "colorSecondary", label: "Secondary", group: "Brand" },
  { key: "colorAccent", label: "Accent", group: "Brand" },
  { key: "colorBackground", label: "Background", group: "Surface" },
  { key: "colorSurface", label: "Surface", group: "Surface" },
  { key: "colorBorder", label: "Border", group: "Surface" },
  { key: "colorTextPrimary", label: "Text", group: "Text" },
  { key: "colorTextSecondary", label: "Text 2nd", group: "Text" },
  { key: "colorTextMuted", label: "Muted", group: "Text" },
  { key: "colorSuccess", label: "Success", group: "Semantic" },
  { key: "colorWarning", label: "Warning", group: "Semantic" },
  { key: "colorError", label: "Error", group: "Semantic" },
];

interface FloatingEditorProps {
  resolved: ResolvedDesign;
  onChange: (resolved: ResolvedDesign) => void;
  allFonts?: string[];
  inspirationColors?: Array<{ hex: string; source: string }>;
  onDownloadKit?: () => void;
  showGuide?: boolean; // Show Ditto peek animation on first load
  /** Design slug — required for brand uploads (POST /api/designs/[slug]/logo). */
  slug?: string;
  /** Default brand name shown if the design doesn't have one yet. */
  defaultBrandName?: string;
}

export function FloatingEditor({
  resolved,
  onChange,
  allFonts = [],
  inspirationColors = [],
  onDownloadKit,
  showGuide = false,
  slug,
  defaultBrandName,
}: FloatingEditorProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"colors" | "fonts" | "shape" | "brand" | "figma">("colors");
  const [brandBusy, setBrandBusy] = useState<"upload" | "remove" | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [sectionOverridesOpen, setSectionOverridesOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [guideVisible, setGuideVisible] = useState(false);
  const [guideDismissed, setGuideDismissed] = useState(false);
  const [figmaGuide, setFigmaGuide] = useState(false);
  const [figmaToken, setFigmaToken] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("ditto_figma_token") || "";
    return "";
  });
  const [figmaFileUrl, setFigmaFileUrl] = useState("");
  const [figmaPushing, setFigmaPushing] = useState(false);
  const [figmaPushResult, setFigmaPushResult] = useState("");

  // Show guide after a short delay
  useEffect(() => {
    if (!showGuide || guideDismissed || open) return;
    const timer = setTimeout(() => setGuideVisible(true), 800);
    return () => clearTimeout(timer);
  }, [showGuide, guideDismissed, open]);

  // Auto-hide guide after 8s
  useEffect(() => {
    if (!guideVisible) return;
    const timer = setTimeout(() => setGuideVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [guideVisible]);

  const handleOpen = () => {
    setOpen(!open);
    setGuideVisible(false);
    setGuideDismissed(true);
  };

  const updateColor = (key: keyof ResolvedDesign, value: string) => {
    onChange({ ...resolved, [key]: value });
  };

  const updateFont = (key: "fontHeading" | "fontBody" | "fontMono", value: string) => {
    onChange({ ...resolved, [key]: value });
  };

  const uploadLogo = async (file: File) => {
    if (!slug) return;
    setBrandBusy("upload");
    setBrandError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/designs/${slug}/logo`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail ? `${data.error}: ${data.detail}` : data.error || "Upload failed";
        throw new Error(msg);
      }
      onChange({ ...resolved, logoUrl: data.logoUrl });
    } catch (err) {
      setBrandError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBrandBusy(null);
    }
  };

  const removeLogo = async () => {
    if (!slug) return;
    setBrandBusy("remove");
    setBrandError(null);
    try {
      const res = await fetch(`/api/designs/${slug}/logo`, { method: "DELETE" });
      if (!res.ok) throw new Error("Remove failed");
      const { logoUrl: _removed, ...rest } = resolved;
      void _removed;
      onChange(rest);
    } catch (err) {
      setBrandError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBrandBusy(null);
    }
  };

  const patchBrand = async (payload: Record<string, unknown>) => {
    if (!slug) return;
    try {
      await fetch(`/api/designs/${slug}/logo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Non-fatal — local state already reflects the choice; backend can retry on next save.
    }
  };

  const pickHeaderVariant = (variant: HeaderVariant) => {
    onChange({ ...resolved, headerVariant: variant });
    patchBrand({ headerVariant: variant });
  };

  const pickSectionVariant = (section: SectionKey, variant: SectionVariant) => {
    const field = SECTION_VARIANT_FIELD[section];
    onChange({ ...resolved, [field]: variant });
    patchBrand({ [field]: variant });
  };

  /** Preset: apply one variant to ALL sections (header + 6 landing sections). */
  const applyPreset = (variant: SectionVariant) => {
    const next = {
      ...resolved,
      headerVariant: variant,
      heroVariant: variant,
      featuresVariant: variant,
      statsVariant: variant,
      reviewsVariant: variant,
      ctaVariant: variant,
      footerVariant: variant,
    };
    onChange(next);
    patchBrand({
      headerVariant: variant,
      heroVariant: variant,
      featuresVariant: variant,
      statsVariant: variant,
      reviewsVariant: variant,
      ctaVariant: variant,
      footerVariant: variant,
    });
  };

  /** Shuffle: pick a random variant for each section independently. */
  const shuffleAll = () => {
    const pick = (): SectionVariant => HEADER_VARIANTS[Math.floor(Math.random() * HEADER_VARIANTS.length)];
    const next = {
      ...resolved,
      headerVariant: pick(),
      heroVariant: pick(),
      featuresVariant: pick(),
      statsVariant: pick(),
      reviewsVariant: pick(),
      ctaVariant: pick(),
      footerVariant: pick(),
    };
    onChange(next);
    patchBrand({
      headerVariant: next.headerVariant,
      heroVariant: next.heroVariant,
      featuresVariant: next.featuresVariant,
      statsVariant: next.statsVariant,
      reviewsVariant: next.reviewsVariant,
      ctaVariant: next.ctaVariant,
      footerVariant: next.footerVariant,
    });
  };

  /** Reset: back to Classic everywhere. */
  const resetAll = () => applyPreset("classic");

  /** True when every section is the same variant → show active preset highlight. */
  const currentPreset = (() => {
    const h = resolved.headerVariant || "classic";
    const keys: SectionKey[] = ["hero", "features", "stats", "reviews", "cta", "footer"];
    const allMatch = keys.every((k) => readVariant(resolved, k) === h);
    return allMatch ? h : null;
  })();

  const setBrandName = (name: string) => {
    onChange({ ...resolved, brandName: name });
  };

  const persistBrandName = async (name: string) => {
    if (!slug) return;
    try {
      await fetch(`/api/designs/${slug}/logo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: name }),
      });
    } catch {
      // Non-fatal.
    }
  };

  return (
    <>
      {/* ── Ditto peek + guide bubble ── */}
      {guideVisible && !open && (
        <div className="fixed bottom-3 right-[4.5rem] z-50 flex items-end gap-2 animate-fade-in">
          {/* Speech bubble */}
          <div
            className="relative rounded-xl px-4 py-3 shadow-lg max-w-[220px] animate-float"
            style={{
              backgroundColor: "var(--ditto-surface)",
              border: "1px solid var(--ditto-border)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--ditto-text)" }}>
              {t("feGuideTitle")}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--ditto-text-muted)" }}>
              {t("feGuideSubtitle")} <Sparkles className="w-3 h-3 inline" />
            </p>
            {/* Arrow pointing right */}
            <div
              className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0"
              style={{
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                borderLeft: "8px solid var(--ditto-border)",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Toggle button ── */}
      <button
        onClick={handleOpen}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        style={{
          backgroundColor: "var(--ditto-primary)",
          color: "var(--ditto-bg)",
          animation: guideVisible && !open ? "pulse-ring 2s ease-in-out infinite" : undefined,
        }}
        title={t("feEditorAria")}
      >
        {open ? <XIcon className="w-5 h-5" /> : <Paintbrush className="w-5 h-5" />}
      </button>

      {/* Pulse animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 var(--ditto-primary); }
          50% { box-shadow: 0 0 0 10px transparent; }
        }
        @keyframes float-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-float { animation: float-drift 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
      `}} />

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 w-80 max-h-[70vh] rounded-xl shadow-2xl border overflow-hidden flex flex-col"
          style={{
            backgroundColor: "var(--ditto-surface)",
            borderColor: "var(--ditto-border)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ borderBottom: "1px solid var(--ditto-border)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--ditto-text)" }}>
              {t("feEditorTitle")}
            </span>
            <div className="flex gap-1.5">
              {onDownloadKit && (
                <button
                  onClick={onDownloadKit}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: "var(--ditto-primary)", color: "var(--ditto-bg)" }}
                >
                  {t("feBtnKit")}
                </button>
              )}
            </div>
          </div>

          {/* Figma Guide Modal */}
          {figmaGuide && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setFigmaGuide(false)}>
              <div
                className="w-[480px] max-h-[80vh] overflow-y-auto rounded-xl p-6 shadow-2xl"
                style={{ backgroundColor: "var(--ditto-surface)", border: "1px solid var(--ditto-border)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold" style={{ color: "var(--ditto-text)" }}>{t("feFigmaGuideTitle")}</h3>
                  <button onClick={() => setFigmaGuide(false)} className="text-lg" style={{ color: "var(--ditto-text-muted)" }}>✕</button>
                </div>

                <div className="space-y-5 text-sm" style={{ color: "var(--ditto-text-secondary)" }}>
                  {/* Method 1 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--ditto-primary)", color: "var(--ditto-bg)" }}>1</span>
                      <span className="font-semibold" style={{ color: "var(--ditto-text)" }}>{t("feFigmaMethod1Title")}</span>
                    </div>
                    <div className="pl-8 space-y-1.5">
                      <p>{t("feFigmaMethod1Intro")} <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--ditto-bg)" }}>figma-tokens.json</code></p>
                      <ol className="list-decimal list-inside space-y-1" style={{ color: "var(--ditto-text-muted)" }}>
                        <li>{t("feFigmaStep1Pre")} <strong style={{ color: "var(--ditto-text)" }}>Tokens Studio for Figma</strong> {t("feFigmaStep1Free")}</li>
                        <li>{t("feFigmaStep2Pre")} <strong style={{ color: "var(--ditto-text)" }}>Tools → Load from file</strong></li>
                        <li>{t("feFigmaStep3")} <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--ditto-bg)" }}>figma-tokens.json</code></li>
                        <li>{t("feFigmaStep4")}</li>
                        <li>{t("feFigmaStep5")}</li>
                      </ol>
                    </div>
                  </div>

                  {/* Method 2 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--ditto-border)", color: "var(--ditto-text-muted)" }}>2</span>
                      <span className="font-semibold" style={{ color: "var(--ditto-text)" }}>{t("feFigmaMethod2Title")}</span>
                    </div>
                    <div className="pl-8 space-y-1.5">
                      <p style={{ color: "var(--ditto-text-muted)" }}>
                        {t("feFigmaMethod2Pre")} <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--ditto-bg)" }}>figma-variables.json</code> {t("feFigmaMethod2Mid")}{" "}
                        <strong style={{ color: "var(--ditto-text)" }}>{t("feFigmaMethod2RestApi")}</strong> {t("feFigmaMethod2Or")} <strong style={{ color: "var(--ditto-text)" }}>Batch Styler</strong> {t("feFigmaMethod2Post")}
                      </p>
                    </div>
                  </div>

                  {/* What's included */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: "var(--ditto-bg)", border: "1px solid var(--ditto-border)" }}>
                    <p className="font-semibold mb-2" style={{ color: "var(--ditto-text)" }}>{t("feFigmaIncludedTitle")}</p>
                    <ul className="space-y-1" style={{ color: "var(--ditto-text-muted)" }}>
                      <li>{t("feFigmaInclude1")}</li>
                      <li>{t("feFigmaInclude2")}</li>
                      <li>{t("feFigmaInclude3")}</li>
                      <li>{t("feFigmaInclude4")}</li>
                      <li>{t("feFigmaInclude5")}</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => setFigmaGuide(false)}
                  className="mt-5 w-full py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "var(--ditto-primary)", color: "var(--ditto-bg)" }}
                >
                  {t("feGotIt")}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--ditto-border)" }}>
            {(["brand", "colors", "fonts", "shape", "figma"] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className="flex-1 py-2 text-xs font-medium transition-colors"
                style={{
                  color: tab === tabKey ? "var(--ditto-primary)" : "var(--ditto-text-muted)",
                  borderBottom: tab === tabKey ? "2px solid var(--ditto-primary)" : "2px solid transparent",
                }}
              >
                {tabKey === "brand"
                  ? t("feTabBrand")
                  : tabKey === "colors"
                    ? t("feTabColors")
                    : tabKey === "fonts"
                      ? t("feTabFonts")
                      : tabKey === "shape"
                        ? t("feTabShape")
                        : t("feTabFigma")}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4 flex-1">
            {/* Brand tab */}
            {tab === "brand" && (
              <div className="space-y-5">
                {/* Brand name */}
                <div>
                  <span className="text-[11px] mb-1.5 block" style={{ color: "var(--ditto-text-muted)" }}>
                    {t("feBrandName")}
                  </span>
                  <input
                    type="text"
                    value={resolved.brandName ?? defaultBrandName ?? ""}
                    onChange={(e) => setBrandName(e.target.value)}
                    onBlur={(e) => persistBrandName(e.target.value)}
                    placeholder={defaultBrandName || t("feBrandNamePlaceholder")}
                    className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
                    style={{
                      borderColor: "var(--ditto-border)",
                      backgroundColor: "var(--ditto-bg)",
                      color: "var(--ditto-text)",
                    }}
                  />
                </div>

                {/* Logo upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px]" style={{ color: "var(--ditto-text-muted)" }}>
                      {t("feBrandLogoLabel")}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--ditto-text-muted)" }}>
                      {t("feBrandLogoTypes")}
                    </span>
                  </div>
                  <div
                    className="rounded-md border border-dashed p-3 flex items-center gap-3"
                    style={{ borderColor: "var(--ditto-border)", backgroundColor: "var(--ditto-bg)" }}
                  >
                    {/* Preview: real logo or Ditto placeholder */}
                    <div
                      className="w-12 h-12 rounded-md overflow-hidden flex items-center justify-center shrink-0"
                      style={{ border: "1px solid var(--ditto-border)", backgroundColor: "var(--ditto-surface)" }}
                    >
                      {resolved.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolved.logoUrl}
                          alt={t("feBrandLogoAlt")}
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        />
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 32 32" aria-label="Ditto placeholder">
                          <path d="M16 0 A16 16 0 0 1 16 32 Z" fill={resolved.colorPrimary} />
                          <path d="M16 0 A16 16 0 0 0 16 32 Z" fill={resolved.colorSecondary} />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5">
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={!slug || brandBusy !== null}
                        className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--ditto-primary)",
                          color: "var(--ditto-bg)",
                        }}
                      >
                        <Upload className="w-3 h-3" strokeWidth={2} />
                        {brandBusy === "upload"
                          ? t("feBrandLogoLoading")
                          : resolved.logoUrl
                            ? t("feBrandLogoReplace")
                            : t("feBrandLogoUpload")}
                      </button>
                      {resolved.logoUrl && (
                        <button
                          onClick={removeLogo}
                          disabled={brandBusy !== null}
                          className="inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1.5 border disabled:opacity-50"
                          style={{
                            borderColor: "var(--ditto-border)",
                            color: "var(--ditto-text-secondary)",
                          }}
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                          {t("feBrandLogoRemove")}
                        </button>
                      )}
                    </div>

                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/svg+xml,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadLogo(f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {!slug && (
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--ditto-text-muted)" }}>
                      {t("feBrandLogoSaveFirst")}
                    </p>
                  )}
                  {brandError && (
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--ditto-error)" }}>
                      {brandError}
                    </p>
                  )}
                </div>

                {/* ── Stile landing — preset unico + shuffle + reset ── */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px]" style={{ color: "var(--ditto-text-muted)" }}>
                      {t("feStyleSection")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={shuffleAll}
                        title={t("feStyleSurpriseTitle")}
                        className="text-[10px] inline-flex items-center gap-1 transition-colors"
                        style={{ color: "var(--ditto-text-muted)" }}
                      >
                        <Dices className="w-3 h-3" strokeWidth={1.5} />
                        {t("feStyleSurprise")}
                      </button>
                      <span className="text-[10px]" style={{ color: "var(--ditto-border)" }}>·</span>
                      <button
                        onClick={resetAll}
                        title={t("feStyleResetTitle")}
                        className="text-[10px] inline-flex items-center gap-1 transition-colors"
                        style={{ color: "var(--ditto-text-muted)" }}
                      >
                        <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                        {t("feStyleReset")}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed mb-2" style={{ color: "var(--ditto-text-muted)" }}>
                    {t("feStyleHint")}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {HEADER_VARIANTS.map((v) => {
                      const meta = HEADER_VARIANT_DESCRIPTIONS[v];
                      const active = currentPreset === v;
                      return (
                        <button
                          key={v}
                          onClick={() => applyPreset(v)}
                          className="text-left rounded-md border p-2.5 transition-all"
                          style={{
                            borderColor: active ? "var(--ditto-primary)" : "var(--ditto-border)",
                            backgroundColor: active
                              ? "color-mix(in srgb, var(--ditto-primary) 8%, var(--ditto-bg))"
                              : "var(--ditto-bg)",
                          }}
                        >
                          <VariantMiniMock variant={v} resolved={resolved} />
                          <div className="text-[11px] font-semibold mt-2" style={{ color: "var(--ditto-text)" }}>
                            {meta.label}
                          </div>
                          <div className="text-[9.5px]" style={{ color: "var(--ditto-text-muted)" }}>
                            {meta.tagline}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {!currentPreset && (
                    <p className="text-[10px] mt-2" style={{ color: "var(--ditto-text-muted)" }}>
                      {t("feStyleMixed")}
                    </p>
                  )}
                </div>

                {/* ── Personalizza per sezione (collassato di default) ── */}
                <div>
                  <button
                    onClick={() => setSectionOverridesOpen((v) => !v)}
                    className="w-full flex items-center justify-between py-1.5 text-[11px] font-medium transition-colors"
                    style={{ color: "var(--ditto-text-secondary)" }}
                  >
                    <span>{t("feCustomizeSection")}</span>
                    <ChevronDown
                      className="w-3 h-3 transition-transform"
                      strokeWidth={1.5}
                      style={{ transform: sectionOverridesOpen ? "rotate(180deg)" : "none" }}
                    />
                  </button>

                  {sectionOverridesOpen && (
                    <div className="space-y-3 mt-2">
                      {/* Header */}
                      <SectionVariantRow
                        label={t("feHeaderLabel")}
                        value={resolved.headerVariant ?? "classic"}
                        onChange={pickHeaderVariant}
                      />
                      {SECTION_KEYS.map((key) => (
                        <SectionVariantRow
                          key={key}
                          label={SECTION_LABELS[key]}
                          value={readVariant(resolved, key)}
                          onChange={(v: SectionVariant) => pickSectionVariant(key, v)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Colors tab */}
            {tab === "colors" && (
              <div className="space-y-3">
                {COLOR_FIELDS.map(({ key, label }) => (
                  <ColorRow
                    key={key}
                    label={label}
                    value={resolved[key] as string}
                    inspirationColors={inspirationColors}
                    onChange={(v) => updateColor(key, v)}
                  />
                ))}
              </div>
            )}

            {/* Fonts tab */}
            {tab === "fonts" && (
              <div className="space-y-4">
                {(["fontHeading", "fontBody", "fontMono"] as const).map((fontKey) => {
                  const label = fontKey === "fontHeading" ? "Heading" : fontKey === "fontBody" ? "Body" : "Mono";
                  return (
                    <div key={fontKey}>
                      <span className="text-[11px] mb-1.5 block" style={{ color: "var(--ditto-text-muted)" }}>
                        {label}
                      </span>
                      <select
                        value={resolved[fontKey]}
                        onChange={(e) => updateFont(fontKey, e.target.value)}
                        className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
                        style={{
                          borderColor: "var(--ditto-border)",
                          backgroundColor: "var(--ditto-bg)",
                          color: "var(--ditto-text)",
                        }}
                      >
                        <option value={resolved[fontKey]}>{resolved[fontKey]} {t("feFontCurrent")}</option>
                        {allFonts
                          .filter((f) => f !== resolved[fontKey])
                          .map((f) => <option key={f} value={f}>{f}</option>)}
                        <option value="system-ui">system-ui</option>
                        <option value="Georgia">Georgia (serif)</option>
                        <option value="ui-monospace">ui-monospace</option>
                      </select>
                      {/* Preview */}
                      <div
                        className="mt-1.5 px-2 py-1.5 rounded text-sm"
                        style={{
                          fontFamily: `'${resolved[fontKey]}', system-ui, sans-serif`,
                          color: "var(--ditto-text)",
                          backgroundColor: "var(--ditto-bg)",
                          fontWeight: fontKey === "fontHeading" ? resolved.fontWeightHeading : 400,
                        }}
                      >
                        {t("feFontPreview")}
                      </div>
                    </div>
                  );
                })}

                {/* Weight controls */}
                <div>
                  <span className="text-[11px] mb-1.5 block" style={{ color: "var(--ditto-text-muted)" }}>
                    {t("feFontHeadingWeight")}: {resolved.fontWeightHeading}
                  </span>
                  <input
                    type="range" min={100} max={900} step={100}
                    value={resolved.fontWeightHeading}
                    onChange={(e) => onChange({ ...resolved, fontWeightHeading: parseInt(e.target.value) })}
                    className="w-full accent-(--ditto-primary)"
                  />
                </div>
              </div>
            )}

            {/* Shape tab */}
            {tab === "shape" && (
              <div className="space-y-5">
                <div>
                  <span className="text-[11px] mb-1.5 block" style={{ color: "var(--ditto-text-muted)" }}>
                    {t("feShapeBorderRadius")}: {resolved.radiusMd}
                  </span>
                  <input
                    type="range" min={0} max={24}
                    value={parseInt(resolved.radiusMd)}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      onChange({
                        ...resolved,
                        radiusSm: `${Math.max(2, Math.round(v * 0.5))}px`,
                        radiusMd: `${v}px`,
                        radiusLg: `${Math.round(v * 1.5)}px`,
                      });
                    }}
                    className="w-full accent-(--ditto-primary)"
                  />
                  {/* Shape preview */}
                  <div className="flex gap-2 mt-2">
                    {[resolved.radiusSm, resolved.radiusMd, resolved.radiusLg].map((r, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 h-10 border-2"
                          style={{ borderRadius: r, borderColor: "var(--ditto-primary)" }}
                        />
                        <span className="text-[9px]" style={{ color: "var(--ditto-text-muted)" }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shadow preview */}
                <div>
                  <span className="text-[11px] mb-2 block" style={{ color: "var(--ditto-text-muted)" }}>
                    {t("feShapeShadows")}
                  </span>
                  <div className="flex gap-3">
                    {[
                      { label: "SM", shadow: resolved.shadowSm },
                      { label: "MD", shadow: resolved.shadowMd },
                      { label: "LG", shadow: resolved.shadowLg },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col items-center gap-1">
                        <div
                          className="w-12 h-12 rounded-md"
                          style={{
                            backgroundColor: "var(--ditto-bg)",
                            boxShadow: s.shadow,
                          }}
                        />
                        <span className="text-[9px]" style={{ color: "var(--ditto-text-muted)" }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Figma tab */}
            {tab === "figma" && (
              <div className="space-y-4">
                {/* Method 1: Tokens Studio (works on all plans) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: "var(--ditto-primary)", color: "var(--ditto-bg)" }}>1</span>
                    <span className="text-[11px] font-semibold" style={{ color: "var(--ditto-text)" }}>{t("feFigmaAllPlansTitle")}</span>
                  </div>
                  <p className="text-[10px] mb-3" style={{ color: "var(--ditto-text-muted)" }}>
                    {t("feFigmaDownloadDesc")}
                  </p>
                  <button
                    onClick={async () => {
                      const { generateFigmaTokensStudio } = await import("@/lib/generator/figma-tokens");
                      const content = generateFigmaTokensStudio(resolved);
                      const blob = new Blob([content], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a"); a.href = url; a.download = "figma-tokens.json"; a.click();
                      URL.revokeObjectURL(url);
                      setFigmaGuide(true);
                    }}
                    className="w-full py-2 rounded-md text-xs font-medium"
                    style={{ backgroundColor: "var(--ditto-primary)", color: "var(--ditto-bg)" }}
                  >
                    {t("feFigmaDownloadBtn")}
                  </button>
                  <div className="text-[10px] mt-2 leading-relaxed rounded-md p-2" style={{ color: "var(--ditto-text-muted)", backgroundColor: "var(--ditto-bg)" }}>
                    <strong style={{ color: "var(--ditto-text-secondary)" }}>{t("feFigmaHowImport")}</strong><br/>
                    1. {t("feFigmaImport1Pre")} <strong style={{ color: "var(--ditto-text)" }}>Tokens Studio for Figma</strong> {t("feFigmaImport1Free")}<br/>
                    2. {t("feFigmaImport2Pre")} <strong style={{ color: "var(--ditto-text)" }}>Tools → Load from file</strong><br/>
                    3. {t("feFigmaImport3")}<br/>
                    4. {t("feFigmaImport4")}
                  </div>
                </div>

                <div className="h-px" style={{ backgroundColor: "var(--ditto-border)" }} />

                {/* Method 2: API Push (Enterprise only) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: "var(--ditto-border)", color: "var(--ditto-text-muted)" }}>2</span>
                    <span className="text-[11px] font-semibold" style={{ color: "var(--ditto-text)" }}>{t("feFigmaApiTitle")}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--ditto-bg)", color: "var(--ditto-text-muted)" }}>{t("feFigmaApiBadge")}</span>
                  </div>
                  <p className="text-[10px] mb-2" style={{ color: "var(--ditto-text-muted)" }}>
                    {t("feFigmaApiDescPre")} <code style={{ fontSize: "9px" }}>file_variables:write</code>.
                  </p>

                  <div className="space-y-2">
                    <input
                      type="password"
                      value={figmaToken}
                      onChange={(e) => { setFigmaToken(e.target.value); localStorage.setItem("ditto_figma_token", e.target.value); }}
                      placeholder={t("feFigmaTokenPlaceholder")}
                      className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
                      style={{ borderColor: "var(--ditto-border)", backgroundColor: "var(--ditto-bg)", color: "var(--ditto-text)" }}
                    />
                    <input
                      type="text"
                      value={figmaFileUrl}
                      onChange={(e) => setFigmaFileUrl(e.target.value)}
                      placeholder={t("feFigmaUrlPlaceholder")}
                      className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
                      style={{ borderColor: "var(--ditto-border)", backgroundColor: "var(--ditto-bg)", color: "var(--ditto-text)" }}
                    />
                    <button
                      disabled={!figmaToken || !figmaFileUrl || figmaPushing}
                      onClick={async () => {
                        setFigmaPushing(true); setFigmaPushResult("");
                        try {
                          const match = figmaFileUrl.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/);
                          if (!match) { setFigmaPushResult(t("feFigmaInvalidUrl")); setFigmaPushing(false); return; }
                          const res = await fetch("/api/figma-push", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ token: figmaToken, fileKey: match[1], resolved }),
                          });
                          const data = await res.json();
                          setFigmaPushResult(data.success ? `${data.totalVars} ${t("feFigmaVarsPushedSuffix")}` : (data.error || t("feFigmaError")));
                        } catch { setFigmaPushResult(t("feFigmaConnErr")); }
                        setFigmaPushing(false);
                      }}
                      className="w-full py-1.5 rounded-md text-xs font-medium disabled:opacity-40 border"
                      style={{ borderColor: "var(--ditto-border)", color: "var(--ditto-text-secondary)" }}
                    >
                      {figmaPushing ? t("feFigmaPushing") : t("feFigmaPushBtn")}
                    </button>
                    {figmaPushResult && (
                      <p className="text-[11px] text-center" style={{ color: figmaPushResult.includes("!") ? "var(--ditto-success)" : "var(--ditto-error)" }}>
                        {figmaPushResult}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Color Row with swatches ──

function ColorRow({
  label,
  value,
  inspirationColors,
  onChange,
}: {
  label: string;
  value: string;
  inspirationColors: Array<{ hex: string; source: string }>;
  onChange: (hex: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px]" style={{ color: "var(--ditto-text-secondary)" }}>{label}</span>
        <span className="text-[10px] font-mono" style={{ color: "var(--ditto-text-muted)" }}>{value}</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        {/* Current */}
        <button
          className="w-6 h-6 rounded-md shrink-0 ring-2 ring-(--ditto-primary) ring-offset-1"
          style={{ backgroundColor: value, ringOffsetColor: "var(--ditto-surface)" } as React.CSSProperties}
          onClick={() => pickerRef.current?.click()}
        />
        <div className="w-px h-4 shrink-0 mx-0.5" style={{ backgroundColor: "var(--ditto-border)" }} />
        {/* Inspiration colors */}
        {inspirationColors.slice(0, 20).map(({ hex, source }) => (
          <button
            key={hex}
            className="w-5 h-5 rounded shrink-0 border transition-transform hover:scale-125"
            style={{
              backgroundColor: hex,
              borderColor: hex === value ? "var(--ditto-primary)" : "var(--ditto-border)",
            }}
            title={`${hex} — ${source}`}
            onClick={() => onChange(hex)}
          />
        ))}
        <div className="w-px h-4 shrink-0 mx-0.5" style={{ backgroundColor: "var(--ditto-border)" }} />
        <button
          className="w-5 h-5 rounded shrink-0 border border-dashed flex items-center justify-center text-[10px]"
          style={{ borderColor: "var(--ditto-text-muted)", color: "var(--ditto-text-muted)" }}
          onClick={() => pickerRef.current?.click()}
        >
          +
        </button>
        <input
          ref={pickerRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute w-0 h-0 opacity-0"
        />
      </div>
    </div>
  );
}

// ── Variant Mini Mock ──────────────────────────────────────────────────
// Tiny preview of a header/landing variant rendered with the DESIGN's own
// tokens (primary/secondary/text/border) so the user sees exactly how the
// choice will look in their context — not in generic grays.

function VariantMiniMock({
  variant,
  resolved,
}: {
  variant: SectionVariant;
  resolved: ResolvedDesign;
}) {
  const primary = resolved.colorPrimary;
  const secondary = resolved.colorSecondary;
  const accent = resolved.colorAccent;
  const text = resolved.colorTextPrimary;
  const muted = resolved.colorTextMuted;
  const surface = resolved.colorSurface;
  const bg = resolved.colorBackground;
  const border = resolved.colorBorder;

  return (
    <div
      className="h-10 relative overflow-hidden"
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 4,
      }}
    >
      {variant === "classic" && (
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primary }} />
          <div className="flex gap-1">
            <div className="w-2.5 h-0.5" style={{ backgroundColor: muted }} />
            <div className="w-2.5 h-0.5" style={{ backgroundColor: muted }} />
            <div className="w-2.5 h-0.5" style={{ backgroundColor: muted }} />
          </div>
          <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: primary }} />
        </div>
      )}
      {variant === "elegante" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primary }} />
          <div className="w-full h-px" style={{ backgroundColor: border }} />
          <div className="flex gap-1.5">
            <div className="w-1.5 h-0.5" style={{ backgroundColor: muted }} />
            <div className="w-1.5 h-0.5" style={{ backgroundColor: muted }} />
            <div className="w-1.5 h-0.5" style={{ backgroundColor: muted }} />
          </div>
        </div>
      )}
      {variant === "artistico" && (
        <>
          <div
            aria-hidden
            className="absolute top-0 right-2 w-6 h-6 rounded-full"
            style={{ backgroundColor: accent, opacity: 0.4 }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primary }} />
            <div
              className="flex gap-1 rounded-full px-2 py-1"
              style={{ backgroundColor: surface, border: `1px solid ${border}` }}
            >
              <div className="w-2 h-0.5" style={{ backgroundColor: muted }} />
              <div className="w-2 h-0.5" style={{ backgroundColor: muted }} />
            </div>
            <div className="w-5 h-2.5 rounded-full" style={{ border: `1.5px solid ${text}` }} />
          </div>
        </>
      )}
      {variant === "fresco" && (
        <div
          className="absolute inset-1 flex items-center justify-between px-2 rounded-full"
          style={{
            backgroundColor: surface,
            border: `1px solid ${border}`,
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primary }} />
          <div className="flex gap-0.5">
            <div className="w-1.5 h-0.5" style={{ backgroundColor: muted }} />
            <div className="w-1.5 h-0.5" style={{ backgroundColor: muted }} />
          </div>
          <div
            className="w-4 h-2 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${primary}, ${secondary})`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Section Variant Row ────────────────────────────────────────────────
// Per-section selector used inside the "Personalizza per sezione" panel.

function SectionVariantRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SectionVariant;
  onChange: (variant: SectionVariant) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium" style={{ color: "var(--ditto-text)" }}>{label}</span>
        <span className="text-[9.5px]" style={{ color: "var(--ditto-text-muted)" }}>
          {HEADER_VARIANT_DESCRIPTIONS[value].label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {HEADER_VARIANTS.map((v) => {
          const active = v === value;
          const meta = HEADER_VARIANT_DESCRIPTIONS[v];
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              title={`${meta.label} — ${meta.tagline}`}
              className="px-1.5 py-1 text-[9.5px] font-medium transition-all"
              style={{
                borderRadius: 4,
                border: `1px solid ${active ? "var(--ditto-primary)" : "var(--ditto-border)"}`,
                backgroundColor: active
                  ? "color-mix(in srgb, var(--ditto-primary) 10%, var(--ditto-bg))"
                  : "var(--ditto-bg)",
                color: active ? "var(--ditto-primary)" : "var(--ditto-text-secondary)",
              }}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

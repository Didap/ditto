"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ResolvedDesign, HeaderVariant } from "@/lib/types";
import { HEADER_VARIANTS } from "@/lib/types";
import { HEADER_VARIANT_DESCRIPTIONS } from "@/components/preview/primitives/brand";
import { Paintbrush, X as XIcon, Sparkles, Upload, Trash2 } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"colors" | "fonts" | "shape" | "brand" | "figma">("colors");
  const [brandBusy, setBrandBusy] = useState<"upload" | "remove" | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);
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

  const pickHeaderVariant = async (variant: HeaderVariant) => {
    onChange({ ...resolved, headerVariant: variant });
    if (!slug) return;
    try {
      await fetch(`/api/designs/${slug}/logo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant }),
      });
    } catch {
      // Non-fatal — local state already reflects the choice; backend can retry on next save.
    }
  };

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
              Psst! Premi qui per personalizzare colori, font e forme
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--ditto-text-muted)" }}>
              Il design è tuo, rendilo perfetto <Sparkles className="w-3 h-3 inline" />
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
        title="Design Editor"
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
              Design Editor
            </span>
            <div className="flex gap-1.5">
              {onDownloadKit && (
                <button
                  onClick={onDownloadKit}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: "var(--ditto-primary)", color: "var(--ditto-bg)" }}
                >
                  Kit
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
                  <h3 className="text-lg font-bold" style={{ color: "var(--ditto-text)" }}>Come importare in Figma</h3>
                  <button onClick={() => setFigmaGuide(false)} className="text-lg" style={{ color: "var(--ditto-text-muted)" }}>✕</button>
                </div>

                <div className="space-y-5 text-sm" style={{ color: "var(--ditto-text-secondary)" }}>
                  {/* Method 1 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--ditto-primary)", color: "var(--ditto-bg)" }}>1</span>
                      <span className="font-semibold" style={{ color: "var(--ditto-text)" }}>Tokens Studio (consigliato)</span>
                    </div>
                    <div className="pl-8 space-y-1.5">
                      <p>Usa il file <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--ditto-bg)" }}>figma-tokens.json</code></p>
                      <ol className="list-decimal list-inside space-y-1" style={{ color: "var(--ditto-text-muted)" }}>
                        <li>Apri Figma e installa <strong style={{ color: "var(--ditto-text)" }}>Tokens Studio for Figma</strong> (gratuito)</li>
                        <li>Apri il plugin → clicca <strong style={{ color: "var(--ditto-text)" }}>Tools → Load from file</strong></li>
                        <li>Seleziona <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--ditto-bg)" }}>figma-tokens.json</code></li>
                        <li>Tutti i token (colori, font, spacing, radius, ombre) appaiono nel pannello</li>
                        <li>Seleziona un elemento → applica i token con un click</li>
                      </ol>
                    </div>
                  </div>

                  {/* Method 2 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--ditto-border)", color: "var(--ditto-text-muted)" }}>2</span>
                      <span className="font-semibold" style={{ color: "var(--ditto-text)" }}>Figma REST API (per developer)</span>
                    </div>
                    <div className="pl-8 space-y-1.5">
                      <p style={{ color: "var(--ditto-text-muted)" }}>
                        Il file <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--ditto-bg)" }}>figma-variables.json</code> contiene i token nel formato dell&apos;API Figma.
                        Puoi usarlo con la <strong style={{ color: "var(--ditto-text)" }}>Figma REST API</strong> o con plugin come <strong style={{ color: "var(--ditto-text)" }}>Batch Styler</strong> per creare Variables programmaticamente.
                      </p>
                    </div>
                  </div>

                  {/* What's included */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: "var(--ditto-bg)", border: "1px solid var(--ditto-border)" }}>
                    <p className="font-semibold mb-2" style={{ color: "var(--ditto-text)" }}>Cosa contengono i file:</p>
                    <ul className="space-y-1" style={{ color: "var(--ditto-text-muted)" }}>
                      <li>12 colori con ruoli (primary, background, text, ecc.)</li>
                      <li>8 stili tipografici completi (display, h1-h3, body, small, caption, code)</li>
                      <li>6 valori di spacing + 4 border radius</li>
                      <li>3 livelli di shadow</li>
                      <li>Token compositi per Button, Card, Input, Badge</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => setFigmaGuide(false)}
                  className="mt-5 w-full py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "var(--ditto-primary)", color: "var(--ditto-bg)" }}
                >
                  Ho capito!
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex shrink-0" style={{ borderBottom: "1px solid var(--ditto-border)" }}>
            {(["brand", "colors", "fonts", "shape", "figma"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 text-xs font-medium transition-colors"
                style={{
                  color: tab === t ? "var(--ditto-primary)" : "var(--ditto-text-muted)",
                  borderBottom: tab === t ? "2px solid var(--ditto-primary)" : "2px solid transparent",
                }}
              >
                {t === "brand"
                  ? "Brand"
                  : t === "colors"
                    ? "Colori"
                    : t === "fonts"
                      ? "Font"
                      : t === "shape"
                        ? "Forma"
                        : "Figma"}
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
                    Nome brand
                  </span>
                  <input
                    type="text"
                    value={resolved.brandName ?? defaultBrandName ?? ""}
                    onChange={(e) => setBrandName(e.target.value)}
                    onBlur={(e) => persistBrandName(e.target.value)}
                    placeholder={defaultBrandName || "Brand"}
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
                      Logo
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--ditto-text-muted)" }}>
                      SVG, PNG, JPG, WebP · max 3MB
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
                          alt="logo"
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
                          ? "Caricamento..."
                          : resolved.logoUrl
                            ? "Sostituisci"
                            : "Carica logo"}
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
                          Rimuovi
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
                      Salva il design per poter caricare un logo.
                    </p>
                  )}
                  {brandError && (
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--ditto-error)" }}>
                      {brandError}
                    </p>
                  )}
                </div>

                {/* Header variant */}
                <div>
                  <span className="text-[11px] mb-2 block" style={{ color: "var(--ditto-text-muted)" }}>
                    Stile header
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {HEADER_VARIANTS.map((v) => {
                      const meta = HEADER_VARIANT_DESCRIPTIONS[v];
                      const active = (resolved.headerVariant ?? "classic") === v;
                      return (
                        <button
                          key={v}
                          onClick={() => pickHeaderVariant(v)}
                          className="text-left rounded-md border p-2.5 transition-all"
                          style={{
                            borderColor: active ? "var(--ditto-primary)" : "var(--ditto-border)",
                            backgroundColor: active
                              ? "color-mix(in srgb, var(--ditto-primary) 8%, var(--ditto-bg))"
                              : "var(--ditto-bg)",
                          }}
                        >
                          {/* Mini mock of the variant layout */}
                          <div className="mb-2 h-8 relative rounded-sm overflow-hidden" style={{ backgroundColor: "var(--ditto-surface)", border: "1px solid var(--ditto-border)" }}>
                            {v === "classic" && (
                              <div className="absolute inset-0 flex items-center justify-between px-1.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--ditto-primary)" }} />
                                <div className="flex gap-0.5">
                                  <div className="w-2 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                  <div className="w-2 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                  <div className="w-2 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                </div>
                                <div className="w-3 h-1.5 rounded-[1px]" style={{ backgroundColor: "var(--ditto-primary)" }} />
                              </div>
                            )}
                            {v === "elegante" && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--ditto-primary)" }} />
                                <div className="w-full h-px" style={{ backgroundColor: "var(--ditto-border)" }} />
                                <div className="flex gap-1">
                                  <div className="w-1.5 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                  <div className="w-1.5 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                  <div className="w-1.5 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                </div>
                              </div>
                            )}
                            {v === "artistico" && (
                              <div className="absolute inset-0 flex items-center justify-between px-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--ditto-primary)" }} />
                                <div className="flex gap-0.5 rounded-full px-1.5 py-0.5" style={{ backgroundColor: "var(--ditto-bg)", border: "1px solid var(--ditto-border)" }}>
                                  <div className="w-2 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                  <div className="w-2 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                </div>
                                <div className="w-4 h-1.5 rounded-full" style={{ border: "1px solid var(--ditto-text)" }} />
                              </div>
                            )}
                            {v === "fresco" && (
                              <div className="absolute inset-1 flex items-center justify-between px-1.5 rounded-full" style={{ border: "1px solid var(--ditto-border)", backgroundColor: "var(--ditto-bg)" }}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--ditto-primary)" }} />
                                <div className="flex gap-0.5">
                                  <div className="w-1.5 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                  <div className="w-1.5 h-0.5" style={{ backgroundColor: "var(--ditto-text-muted)" }} />
                                </div>
                                <div
                                  className="w-3 h-1.5 rounded-full"
                                  style={{
                                    background:
                                      "linear-gradient(90deg, var(--ditto-primary), var(--ditto-text))",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold" style={{ color: "var(--ditto-text)" }}>
                            {meta.label}
                          </div>
                          <div className="text-[9.5px]" style={{ color: "var(--ditto-text-muted)" }}>
                            {meta.tagline}
                          </div>
                        </button>
                      );
                    })}
                  </div>
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
                        <option value={resolved[fontKey]}>{resolved[fontKey]} (attuale)</option>
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
                        The quick brown fox jumps
                      </div>
                    </div>
                  );
                })}

                {/* Weight controls */}
                <div>
                  <span className="text-[11px] mb-1.5 block" style={{ color: "var(--ditto-text-muted)" }}>
                    Heading Weight: {resolved.fontWeightHeading}
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
                    Border Radius: {resolved.radiusMd}
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
                    Shadows
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
                    <span className="text-[11px] font-semibold" style={{ color: "var(--ditto-text)" }}>Tokens Studio (tutti i piani)</span>
                  </div>
                  <p className="text-[10px] mb-3" style={{ color: "var(--ditto-text-muted)" }}>
                    Scarica il file JSON e importalo nel plugin gratuito Tokens Studio for Figma.
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
                    Scarica figma-tokens.json
                  </button>
                  <div className="text-[10px] mt-2 leading-relaxed rounded-md p-2" style={{ color: "var(--ditto-text-muted)", backgroundColor: "var(--ditto-bg)" }}>
                    <strong style={{ color: "var(--ditto-text-secondary)" }}>Come importare:</strong><br/>
                    1. Installa <strong style={{ color: "var(--ditto-text)" }}>Tokens Studio for Figma</strong> (gratuito)<br/>
                    2. Apri il plugin → <strong style={{ color: "var(--ditto-text)" }}>Tools → Load from file</strong><br/>
                    3. Seleziona il file scaricato<br/>
                    4. 12 colori + 8 stili tipografici + spacing + radius + shadow pronti
                  </div>
                </div>

                <div className="h-px" style={{ backgroundColor: "var(--ditto-border)" }} />

                {/* Method 2: API Push (Enterprise only) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: "var(--ditto-border)", color: "var(--ditto-text-muted)" }}>2</span>
                    <span className="text-[11px] font-semibold" style={{ color: "var(--ditto-text)" }}>Push diretto via API</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--ditto-bg)", color: "var(--ditto-text-muted)" }}>Enterprise</span>
                  </div>
                  <p className="text-[10px] mb-2" style={{ color: "var(--ditto-text-muted)" }}>
                    Crea le variabili direttamente nel file Figma. Richiede piano Enterprise con scope <code style={{ fontSize: "9px" }}>file_variables:write</code>.
                  </p>

                  <div className="space-y-2">
                    <input
                      type="password"
                      value={figmaToken}
                      onChange={(e) => { setFigmaToken(e.target.value); localStorage.setItem("ditto_figma_token", e.target.value); }}
                      placeholder="Personal Access Token (figd_...)"
                      className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
                      style={{ borderColor: "var(--ditto-border)", backgroundColor: "var(--ditto-bg)", color: "var(--ditto-text)" }}
                    />
                    <input
                      type="text"
                      value={figmaFileUrl}
                      onChange={(e) => setFigmaFileUrl(e.target.value)}
                      placeholder="URL del file Figma"
                      className="w-full rounded-md border px-2 py-1.5 text-xs outline-none"
                      style={{ borderColor: "var(--ditto-border)", backgroundColor: "var(--ditto-bg)", color: "var(--ditto-text)" }}
                    />
                    <button
                      disabled={!figmaToken || !figmaFileUrl || figmaPushing}
                      onClick={async () => {
                        setFigmaPushing(true); setFigmaPushResult("");
                        try {
                          const match = figmaFileUrl.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/);
                          if (!match) { setFigmaPushResult("URL non valido"); setFigmaPushing(false); return; }
                          const res = await fetch("/api/figma-push", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ token: figmaToken, fileKey: match[1], resolved }),
                          });
                          const data = await res.json();
                          setFigmaPushResult(data.success ? `${data.totalVars} variabili pushate!` : (data.error || "Errore"));
                        } catch { setFigmaPushResult("Errore di connessione"); }
                        setFigmaPushing(false);
                      }}
                      className="w-full py-1.5 rounded-md text-xs font-medium disabled:opacity-40 border"
                      style={{ borderColor: "var(--ditto-border)", color: "var(--ditto-text-secondary)" }}
                    >
                      {figmaPushing ? "Pushing..." : "Push Variables"}
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

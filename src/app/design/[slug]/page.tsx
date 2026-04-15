"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { StoredDesign } from "@/lib/types";
import { qualityLabel, qualityColor, friendlyIssueMessage } from "@/lib/quality-scorer";
import { useCredits } from "@/lib/credits-context";
import { PreviewShell } from "@/components/preview/PreviewShell";
import { LandingPreview } from "@/components/preview/pages/LandingPreview";
import { DashboardPreview } from "@/components/preview/pages/DashboardPreview";
import { AuthPreview } from "@/components/preview/pages/AuthPreview";
import { PricingPreview } from "@/components/preview/pages/PricingPreview";
import { BlogPreview } from "@/components/preview/pages/BlogPreview";
import { ComponentsPreview } from "@/components/preview/pages/ComponentsPreview";
import { FloatingEditor } from "@/components/FloatingEditor";

function QualityInfoPopover() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full border border-[var(--ditto-border)] bg-[var(--ditto-surface)] text-[var(--ditto-text-muted)] hover:text-[var(--ditto-text)] hover:border-[var(--ditto-text-muted)] transition-colors flex items-center justify-center text-[10px] font-semibold"
        aria-label="Quality score info"
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-8 z-50 w-72 rounded-lg border border-[var(--ditto-border)] bg-[var(--ditto-surface)] shadow-xl p-4 text-xs text-[var(--ditto-text)]">
            <p className="font-semibold text-sm mb-2">Design Quality Score</p>
            <p className="text-[var(--ditto-text-muted)] mb-3">
              Measures how complete and well-structured the extracted design system is across 5 dimensions, each scored 0–100:
            </p>
            <ul className="space-y-1.5 text-[var(--ditto-text-muted)] mb-3">
              <li><span className="font-medium text-[var(--ditto-text)]">Color</span> — palette variety, semantic roles, saturation</li>
              <li><span className="font-medium text-[var(--ditto-text)]">Typography</span> — font distinctiveness, scale ratio, hierarchy</li>
              <li><span className="font-medium text-[var(--ditto-text)]">Spacing</span> — scale consistency, shadows, border radii</li>
              <li><span className="font-medium text-[var(--ditto-text)]">Contrast</span> — WCAG text/background accessibility</li>
              <li><span className="font-medium text-[var(--ditto-text)]">Completeness</span> — token coverage across all categories</li>
            </ul>
            <p className="text-[var(--ditto-text-muted)]">
              The overall score is the average of all 5. Pure CSS analysis — no AI involved.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

const PREVIEW_PAGES = [
  { id: "landing", label: "Landing", Component: LandingPreview },
  { id: "dashboard", label: "Dashboard", Component: DashboardPreview },
  { id: "auth", label: "Auth / Login", Component: AuthPreview },
  { id: "pricing", label: "Pricing", Component: PricingPreview },
  { id: "blog", label: "Blog", Component: BlogPreview },
  { id: "components", label: "Components", Component: ComponentsPreview },
];

export default function DesignDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [design, setDesign] = useState<StoredDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePreview, setActivePreview] = useState("landing");
  const [activeTab, setActiveTab] = useState<"preview" | "tokens" | "designmd">("preview");
  const [editResolved, setEditResolved] = useState<StoredDesign["resolved"] | null>(null);

  useEffect(() => {
    fetch(`/api/designs/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setDesign(data);
        setEditResolved(data.resolved);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-[var(--ditto-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!design) {
    return (
      <div className="text-center py-32">
        <h1 className="text-xl font-semibold text-[var(--ditto-text)]">Design not found</h1>
        <a href="/dashboard" className="text-sm text-[var(--ditto-primary)] mt-2 inline-block">
          Back to Library
        </a>
      </div>
    );
  }

  const ActiveComponent =
    PREVIEW_PAGES.find((p) => p.id === activePreview)?.Component || LandingPreview;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <a
              href="/dashboard"
              className="text-sm text-[var(--ditto-text-muted)] hover:text-[var(--ditto-text)] transition-colors"
            >
              ← Library
            </a>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ditto-text)]">
              {design.name}
            </h1>
            {design.quality && (
              <div className="relative inline-flex items-center gap-1 mr-4">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: qualityColor(design.quality.overall) + "18",
                    color: qualityColor(design.quality.overall),
                  }}
                >
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
                    <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12.2 3.8 14.5l.8-4.7L1.2 6.5l4.7-.7z"/>
                  </svg>
                  {design.quality.overall}<span className="opacity-60">/100</span>
                  <span className="opacity-70">{qualityLabel(design.quality.overall)}</span>
                </span>
                <QualityInfoPopover />
              </div>
            )}
          </div>
          <a
            href={design.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--ditto-text-muted)] hover:text-[var(--ditto-primary)] mt-0.5 inline-block transition-colors"
          >
            {design.url} ↗
          </a>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const [JSZip, { generateComponentsCode, generateCssVariables }, { generateKitPages }] = await Promise.all([
                import("jszip").then((m) => m.default),
                import("@/lib/generator/components-code"),
                import("@/lib/generator/kit-html"),
              ]);
              const zip = new JSZip();
              // Core files
              zip.file("DESIGN.md", design.designMd);
              zip.file("tokens.css", generateCssVariables(design.resolved));
              zip.file("components.tsx", generateComponentsCode(design.resolved));
              // HTML pages
              const pages = generateKitPages(design.name, design.resolved, design.tokens.fontSources || []);
              const pagesFolder = zip.folder("pages")!;
              for (const page of pages) {
                pagesFolder.file(page.filename, page.html);
              }
              // Generate and download
              const blob = await zip.generateAsync({ type: "blob" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${design.slug}-kit.zip`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg bg-[var(--ditto-primary)] px-4 py-2 text-sm font-medium text-[var(--ditto-bg)] hover:bg-[var(--ditto-primary-hover)] transition-colors"
          >
            Download Kit (.zip)
          </button>
          <button
            onClick={async () => {
              const [JSZip, { generateStorybookProject }] = await Promise.all([
                import("jszip").then((m) => m.default),
                import("@/lib/generator/kit-storybook"),
              ]);
              const zip = new JSZip();
              const files = generateStorybookProject(design.name, design.resolved, design.tokens.fontSources || []);
              for (const f of files) {
                zip.file(f.path, f.content);
              }
              const blob = await zip.generateAsync({ type: "blob" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${design.slug}-storybook.zip`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg border border-[var(--ditto-border)] px-4 py-2 text-sm font-medium text-[var(--ditto-text-secondary)] hover:text-[var(--ditto-text)] hover:border-[var(--ditto-text-muted)] transition-colors"
          >
            Download Storybook
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(design.designMd);
            }}
            className="rounded-lg border border-[var(--ditto-border)] px-4 py-2 text-sm font-medium text-[var(--ditto-text-secondary)] hover:text-[var(--ditto-text)] hover:border-[var(--ditto-text-muted)] transition-colors"
          >
            Copy DESIGN.md
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--ditto-border)] mb-6">
        {(["preview", "tokens", "designmd"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm transition-colors"
            style={{
              color:
                activeTab === tab
                  ? "var(--ditto-primary)"
                  : "var(--ditto-text-muted)",
              borderBottom:
                activeTab === tab
                  ? "2px solid var(--ditto-primary)"
                  : "2px solid transparent",
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab === "preview"
              ? "Preview"
              : tab === "tokens"
                ? "Analysis"
                : "DESIGN.md"}
          </button>
        ))}
      </div>

      {/* Preview Tab */}
      {activeTab === "preview" && (
        <div>
          {/* Preview page selector */}
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
                }}
              >
                {page.label}
              </button>
            ))}
          </div>

          {/* Preview */}
          <PreviewShell
            resolved={editResolved || design.resolved}
            fontSources={design.tokens.fontSources || []}
            fontFaces={design.tokens.fontFaces || []}
            downloadedFonts={design.tokens.downloadedFonts || []}
          >
            <ActiveComponent />
          </PreviewShell>

          {/* Floating Editor */}
          {editResolved && (
            <FloatingEditor
              resolved={editResolved}
              onChange={setEditResolved}
              allFonts={design.tokens.typography?.map((t) => t.fontFamily) || []}
              inspirationColors={
                design.tokens.colors?.map((c) => ({ hex: c.hex, source: design.name })) || []
              }
              onDownloadKit={async () => {
                const [JSZip, { generateComponentsCode, generateCssVariables }, { generateKitPages }] = await Promise.all([
                  import("jszip").then((m) => m.default),
                  import("@/lib/generator/components-code"),
                  import("@/lib/generator/kit-html"),
                ]);
                const r = editResolved;
                const zip = new JSZip();
                zip.file("DESIGN.md", design.designMd);
                zip.file("tokens.css", generateCssVariables(r));
                zip.file("components.tsx", generateComponentsCode(r));
                const pages = generateKitPages(design.name, r, design.tokens.fontSources || []);
                const pagesFolder = zip.folder("pages")!;
                for (const page of pages) {
                  pagesFolder.file(page.filename, page.html);
                }
                const blob = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${design.slug}-kit.zip`; a.click();
                URL.revokeObjectURL(url);
              }}
            />
          )}
        </div>
      )}

      {/* Tokens Tab */}
      {activeTab === "tokens" && <TokensView design={design} onBoost={() => {
        fetch(`/api/designs/${slug}`)
          .then((r) => r.json())
          .then((data) => { setDesign(data); setEditResolved(data.resolved); });
      }} />}

      {/* DESIGN.md Tab */}
      {activeTab === "designmd" && (
        <div
          className="rounded-xl border border-[var(--ditto-border)] bg-[var(--ditto-surface)] p-6 overflow-auto max-h-[80vh]"
        >
          <pre className="text-sm text-[var(--ditto-text)] whitespace-pre-wrap font-mono leading-relaxed">
            {design.designMd}
          </pre>
        </div>
      )}
    </div>
  );
}

function BoostButton({ slug, onBoost }: { slug: string; onBoost: () => void }) {
  const [estimate, setEstimate] = useState<{ currentScore: number; estimatedScore: number; estimatedCost: number } | null>(null);
  const [boosting, setBoosting] = useState(false);
  const [result, setResult] = useState<{ before: number; after: number; creditsCharged: number; fixesApplied: string[] } | null>(null);
  const { deduct, refresh } = useCredits();

  useEffect(() => {
    fetch(`/api/designs/${slug}/boost`)
      .then((r) => r.json())
      .then(setEstimate)
      .catch(() => {});
  }, [slug]);

  const handleBoost = async () => {
    setBoosting(true);
    try {
      const res = await fetch(`/api/designs/${slug}/boost`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Errore durante il boost");
        return;
      }
      const data = await res.json();
      setResult(data);
      deduct(data.creditsCharged);
      refresh();
      onBoost();
    } catch {
      alert("Errore di rete");
    } finally {
      setBoosting(false);
    }
  };

  if (result) {
    return (
      <div className="mt-4 rounded-lg border border-[var(--ditto-primary)]/30 bg-[var(--ditto-primary)]/5 p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-lg">&#10024;</span>
          <span className="font-semibold text-[var(--ditto-text)]">
            Boost applicato! {result.before} → {result.after}/100
          </span>
          <span className="text-xs text-[var(--ditto-text-muted)]">
            ({result.creditsCharged} crediti usati)
          </span>
        </div>
        <div className="text-xs text-[var(--ditto-text-muted)] space-y-0.5">
          {result.fixesApplied.map((fix, i) => (
            <div key={i}>&#10003; {fix}</div>
          ))}
        </div>
      </div>
    );
  }

  if (!estimate || estimate.estimatedScore <= estimate.currentScore) return null;

  const gain = estimate.estimatedScore - estimate.currentScore;

  return (
    <div className="mt-4 flex items-center gap-4 rounded-lg border border-[var(--ditto-border)] bg-[var(--ditto-surface)] p-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-[var(--ditto-text)]">
          Boost disponibile: <span className="font-bold">{estimate.currentScore} → {estimate.estimatedScore}/100</span>
          <span className="text-[var(--ditto-text-muted)]"> (+{gain} punti)</span>
        </p>
        <p className="text-xs text-[var(--ditto-text-muted)] mt-0.5">
          Costo: {estimate.estimatedCost} crediti — corregge automaticamente i problemi rilevati
        </p>
      </div>
      <button
        onClick={handleBoost}
        disabled={boosting}
        className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        style={{
          backgroundColor: "var(--ditto-primary)",
          color: "var(--ditto-bg)",
        }}
      >
        {boosting ? "Boosting..." : `Boost ⚡ ${estimate.estimatedCost} cr`}
      </button>
    </div>
  );
}

function TokensView({ design, onBoost }: { design: StoredDesign; onBoost: () => void }) {
  const { tokens } = design;

  const dims = design.quality
    ? [
        { label: "Color", value: design.quality.color },
        { label: "Typography", value: design.quality.typography },
        { label: "Spacing", value: design.quality.spacing },
        { label: "Contrast", value: design.quality.contrast },
        { label: "Completeness", value: design.quality.completeness },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Quality Score */}
      {design.quality && (
        <section className="rounded-xl border border-[var(--ditto-border)] bg-[var(--ditto-surface)] p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-[var(--ditto-text)]">Design Quality</h2>
            <span
              className="text-2xl font-extrabold"
              style={{ color: qualityColor(design.quality.overall) }}
            >
              {design.quality.overall}/100
            </span>
            <span
              className="text-sm font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: qualityColor(design.quality.overall) + "18",
                color: qualityColor(design.quality.overall),
              }}
            >
              {qualityLabel(design.quality.overall)}
            </span>
          </div>

          {/* Dimension bars */}
          <div className="grid grid-cols-5 gap-3 mb-5">
            {dims.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--ditto-text-muted)]">{d.label}</span>
                  <span className="font-semibold" style={{ color: qualityColor(d.value) }}>{d.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--ditto-border)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${d.value}%`,
                      backgroundColor: qualityColor(d.value),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Issues */}
          {design.quality.issues.length > 0 && (
            <div className="space-y-1.5">
              {design.quality.issues.map((issue, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs"
                >
                  <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                    issue.severity === "error" ? "bg-red-500" :
                    issue.severity === "warning" ? "bg-yellow-500" : "bg-blue-400"
                  }`} />
                  <span className="text-[var(--ditto-text-muted)]">
                    {friendlyIssueMessage(issue)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Boost button */}
          {design.quality.issues.length > 0 && (
            <BoostButton slug={design.slug} onBoost={onBoost} />
          )}
        </section>
      )}

      {/* Colors */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--ditto-text)] mb-4">
          Colors ({tokens.colors.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tokens.colors.map((color, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--ditto-border)] overflow-hidden bg-[var(--ditto-surface)]"
            >
              <div
                className="h-16 w-full"
                style={{ backgroundColor: color.hex }}
              />
              <div className="p-2">
                <div className="text-xs font-mono text-[var(--ditto-text)]">
                  {color.hex}
                </div>
                <div className="text-[10px] text-[var(--ditto-text-muted)] mt-0.5">
                  {color.role} · {color.occurrences}x
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--ditto-text)] mb-4">
          Typography
        </h2>
        <div className="rounded-xl border border-[var(--ditto-border)] bg-[var(--ditto-surface)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--ditto-border)]">
                <th className="text-left px-4 py-2 text-[var(--ditto-text-muted)] font-medium">
                  Role
                </th>
                <th className="text-left px-4 py-2 text-[var(--ditto-text-muted)] font-medium">
                  Font
                </th>
                <th className="text-left px-4 py-2 text-[var(--ditto-text-muted)] font-medium">
                  Size
                </th>
                <th className="text-left px-4 py-2 text-[var(--ditto-text-muted)] font-medium">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody>
              {tokens.typeScale.map((ts, i) => (
                <tr key={i} className="border-b border-[var(--ditto-border)] last:border-0">
                  <td className="px-4 py-2 text-[var(--ditto-text)]">{ts.role}</td>
                  <td className="px-4 py-2 text-[var(--ditto-text-secondary)] font-mono text-xs">
                    {ts.fontFamily}
                  </td>
                  <td className="px-4 py-2 text-[var(--ditto-text-secondary)]">{ts.size}</td>
                  <td className="px-4 py-2 text-[var(--ditto-text-secondary)]">{ts.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--ditto-text)] mb-4">
          Spacing
        </h2>
        <div className="flex flex-wrap gap-3">
          {tokens.spacing.map((s, i) => (
            <div
              key={i}
              className="flex items-end gap-2 rounded-lg border border-[var(--ditto-border)] bg-[var(--ditto-surface)] p-3"
            >
              <div
                className="bg-[var(--ditto-primary)]"
                style={{
                  width: Math.max(s.px, 4),
                  height: Math.max(s.px, 4),
                  borderRadius: 2,
                  maxWidth: 60,
                  maxHeight: 60,
                }}
              />
              <span className="text-xs font-mono text-[var(--ditto-text-muted)]">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--ditto-text)] mb-4">
          Shadows
        </h2>
        <div className="flex flex-wrap gap-4">
          {tokens.shadows.map((s, i) => (
            <div
              key={i}
              className="w-24 h-24 rounded-lg bg-[var(--ditto-surface)]"
              style={{ boxShadow: s.value }}
            />
          ))}
        </div>
      </section>

      {/* Radii */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--ditto-text)] mb-4">
          Border Radius
        </h2>
        <div className="flex flex-wrap gap-4">
          {tokens.radii.map((r, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 border-2 border-[var(--ditto-primary)]"
                style={{ borderRadius: r.value }}
              />
              <span className="text-xs font-mono text-[var(--ditto-text-muted)]">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CSS Variables */}
      {Object.keys(tokens.cssVariables).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--ditto-text)] mb-4">
            CSS Variables ({Object.keys(tokens.cssVariables).length})
          </h2>
          <div className="rounded-xl border border-[var(--ditto-border)] bg-[var(--ditto-surface)] p-4 max-h-96 overflow-auto">
            <pre className="text-xs font-mono text-[var(--ditto-text-secondary)] leading-relaxed">
              {Object.entries(tokens.cssVariables)
                .slice(0, 50)
                .map(([key, val]) => `${key}: ${val};`)
                .join("\n")}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}

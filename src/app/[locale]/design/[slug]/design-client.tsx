"use client";

import { useEffect, useState, useCallback } from "react";
import { useOnborda } from "onborda";
import { hasSeenTour } from "@/lib/onboarding";
import type { StoredDesign } from "@/lib/types";
import { qualityLabel, qualityColor, friendlyIssueMessage } from "@/lib/quality-scorer";
import { useCredits } from "@/lib/credits-context";
import { useLocalePath } from "@/lib/locale-context";
import { PreviewShell } from "@/components/preview/PreviewShell";
import { LandingPreview } from "@/components/preview/pages/LandingPreview";
import { DashboardPreview } from "@/components/preview/pages/DashboardPreview";
import { AuthPreview } from "@/components/preview/pages/AuthPreview";
import { PricingPreview } from "@/components/preview/pages/PricingPreview";
import { BlogPreview } from "@/components/preview/pages/BlogPreview";
import { ComponentsPreview } from "@/components/preview/pages/ComponentsPreview";
import { FloatingEditor } from "@/components/FloatingEditor";
import { Lock, Coins, Info } from "lucide-react";
import { DESIGN_MACROS, applyMacros } from "@/lib/design-macros";

interface FeatureStatus {
  unlocked: boolean;
  cost?: number;
}
interface UnlockStatus {
  devkit: FeatureStatus;
  complete: FeatureStatus;
  wordpress: FeatureStatus;
}

type UnlockableFeature = "devkit" | "complete" | "wordpress";

function QualityInfoPopover() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full border border-(--ditto-border) bg-(--ditto-surface) text-(--ditto-text-muted) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors flex items-center justify-center text-[10px] font-semibold"
        aria-label="Quality score info"
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-8 z-50 w-72 rounded-lg border border-(--ditto-border) bg-(--ditto-surface) shadow-xl p-4 text-xs text-(--ditto-text)">
            <p className="font-semibold text-sm mb-2">Design Quality Score</p>
            <p className="text-(--ditto-text-muted) mb-3">
              Measures how complete and well-structured the extracted design system is across 5 dimensions, each scored 0–100:
            </p>
            <ul className="space-y-1.5 text-(--ditto-text-muted) mb-3">
              <li><span className="font-medium text-(--ditto-text)">Color</span> — palette variety, semantic roles, saturation</li>
              <li><span className="font-medium text-(--ditto-text)">Typography</span> — font distinctiveness, scale ratio, hierarchy</li>
              <li><span className="font-medium text-(--ditto-text)">Spacing</span> — scale consistency, shadows, border radii</li>
              <li><span className="font-medium text-(--ditto-text)">Contrast</span> — WCAG text/background accessibility</li>
              <li><span className="font-medium text-(--ditto-text)">Completeness</span> — token coverage across all categories</li>
            </ul>
            <p className="text-(--ditto-text-muted)">
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

interface DesignDetailProps {
  initialDesign: StoredDesign;
  slug: string;
}

export function DesignDetailClient({ initialDesign, slug }: DesignDetailProps) {
  const lp = useLocalePath();
  const [design, setDesign] = useState<StoredDesign>(initialDesign);
  const [activePreview, setActivePreview] = useState("landing");
  const [activeTab, setActiveTab] = useState<"preview" | "tokens" | "designmd">("preview");
  const [editResolved, setEditResolved] = useState<StoredDesign["resolved"]>(initialDesign.resolved);
  const [activeMacros, setActiveMacros] = useState<string[]>([]);
  const [savingMacros, setSavingMacros] = useState(false);
  const [unlocks, setUnlocks] = useState<UnlockStatus>({
    devkit: { unlocked: initialDesign.unlockedFeatures?.devkit ?? false, cost: 50 },
    complete: { unlocked: initialDesign.unlockedFeatures?.complete ?? false, cost: 100 },
    wordpress: { unlocked: initialDesign.unlockedFeatures?.wordpress ?? false, cost: 50 },
  });
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ feature: UnlockableFeature; cost: number } | null>(null);
  const [downloadingWp, setDownloadingWp] = useState(false);
  const { deduct, refresh: refreshCredits, credits } = useCredits();
  const { startOnborda } = useOnborda();

  // Auto-start design detail tour on first visit
  useEffect(() => {
    if (!hasSeenTour("design-detail")) {
      const timer = setTimeout(() => startOnborda("design-detail"), 600);
      return () => clearTimeout(timer);
    }
  }, [startOnborda]);

  const fetchUnlocks = useCallback((s: string) => {
    fetch(`/api/designs/${s}/unlock`)
      .then((r) => r.json())
      .then((data) => setUnlocks(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchUnlocks(slug);
  }, [slug, fetchUnlocks]);

  const toggleMacro = (id: string) => {
    setActiveMacros((prev) => {
      const next = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id];
      // Recompute editResolved from the ORIGINAL stored design + active macros,
      // so toggling a macro off cleanly reverts its effect.
      const result = applyMacros(design.tokens, design.resolved, next);
      setEditResolved(result.resolved);
      return next;
    });
  };

  const saveActiveMacros = async () => {
    if (activeMacros.length === 0) return;
    setSavingMacros(true);
    try {
      const res = await fetch(`/api/designs/${slug}/macros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ macroIds: activeMacros, save: true }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setDesign((d) => ({ ...d, tokens: data.tokens, resolved: data.resolved }));
      setEditResolved(data.resolved);
      setActiveMacros([]);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMacros(false);
    }
  };

  const purchaseFeature = async (feature: UnlockableFeature) => {
    setConfirmModal(null);
    setPurchasing(feature);
    try {
      const res = await fetch(`/api/designs/${slug}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature }),
      });
      if (res.ok) {
        const data = await res.json();
        deduct(data.creditsSpent);
        refreshCredits();
        setUnlocks((prev) => ({
          ...prev,
          [feature]: { unlocked: true, expiresAt: data.expiresAt },
        }));
      }
    } catch {}
    setPurchasing(null);
  };

  const ActiveComponent =
    PREVIEW_PAGES.find((p) => p.id === activePreview)?.Component || LandingPreview;

  return (
    <div>
      {/* Header */}
      <div id="tour-design-header" className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <a
              href={lp("/dashboard")}
              className="text-sm text-(--ditto-text-muted) hover:text-(--ditto-text) transition-colors"
            >
              ← Library
            </a>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text)">
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
          <div className="flex items-center gap-3 mt-1">
            {design.url && (
              <a
                href={design.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-(--ditto-text-muted) hover:text-(--ditto-primary) transition-colors"
              >
                {design.url} ↗
              </a>
            )}
            {(design.creditsSpent ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-(--ditto-text-muted)">
                <Coins className="w-3 h-3 text-(--ditto-primary)" strokeWidth={1.5} />
                {design.creditsSpent} credits spent
              </span>
            )}
          </div>
        </div>
        <div id="tour-kits" className="flex gap-2 flex-wrap">
          {/* Dev Kit (50cr) — Storybook + tokens + Tailwind + types + Figma */}
          {unlocks.devkit.unlocked ? (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const [
                    JSZip,
                    { generateStorybookProject },
                    { generateCssVariables },
                    { generateFigmaTokensStudio },
                    { generateTailwindConfig },
                    { generateTypeDefinitions },
                  ] = await Promise.all([
                    import("jszip").then((m) => m.default),
                    import("@/lib/generator/kit-storybook"),
                    import("@/lib/generator/components-code"),
                    import("@/lib/generator/figma-tokens"),
                    import("@/lib/generator/kit-tailwind"),
                    import("@/lib/generator/kit-types"),
                  ]);
                  const r = design.resolved;
                  const zip = new JSZip();
                  const sbFiles = generateStorybookProject(design.name, r, design.tokens.fontSources || []);
                  for (const f of sbFiles) zip.file(f.path, f.content);
                  zip.file("tokens.css", generateCssVariables(r));
                  zip.file("figma-tokens.json", generateFigmaTokensStudio(r));
                  zip.file("tailwind.config.ts", generateTailwindConfig(r));
                  zip.file("types.ts", generateTypeDefinitions(r));
                  zip.file("DESIGN.md", design.designMd);
                  zip.file("README.md", `# ${design.name} — Dev Kit\n\nGenerated by Ditto.\n\n## Quick start\n\n\`\`\`bash\nnpm install\nnpm run storybook\n\`\`\`\n\n## Contents\n\n- **Storybook project** — Interactive component explorer (\`src/\`)\n- **tokens.css** — CSS custom properties\n- **tailwind.config.ts** — Tailwind theme with design tokens\n- **types.ts** — TypeScript interfaces and typed token object\n- **figma-tokens.json** — Tokens Studio format for Figma\n- **DESIGN.md** — Full design system documentation\n`);
                  const blob = await zip.generateAsync({ type: "blob" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${design.slug}-devkit.zip`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
              >
                Download Dev Kit
              </button>
              <FeatureInfo items={["Storybook project (components + stories)", "CSS tokens (tokens.css)", "Tailwind config (tailwind.config.ts)", "TypeScript types (types.ts)", "Figma tokens (figma-tokens.json)", "DESIGN.md documentation"]} />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConfirmModal({ feature: "devkit", cost: unlocks.devkit.cost ?? 50 })}
                disabled={purchasing === "devkit" || (credits !== null && credits < (unlocks.devkit.cost ?? 50))}
                className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {purchasing === "devkit" ? (
                  <>
                    <span className="w-3 h-3 border-2 border-(--ditto-bg) border-t-transparent rounded-full animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Dev Kit &middot; {unlocks.devkit.cost ?? 50}
                    <Coins className="w-3 h-3" strokeWidth={1.5} />
                  </>
                )}
              </button>
              <FeatureInfo items={["Storybook project (components + stories)", "CSS tokens (tokens.css)", "Tailwind config (tailwind.config.ts)", "TypeScript types (types.ts)", "Figma tokens (figma-tokens.json)", "DESIGN.md documentation"]} />
            </div>
          )}

          {/* WordPress Theme (50cr) — block theme (theme.json + templates + parts + patterns) */}
          {unlocks.wordpress.unlocked ? (
            <div className="flex items-center gap-2">
              <button
                disabled={downloadingWp}
                onClick={async () => {
                  setDownloadingWp(true);
                  try {
                    const [JSZip, { generateWordPressTheme }] = await Promise.all([
                      import("jszip").then((m) => m.default),
                      import("@/lib/generator/kit-wordpress"),
                    ]);
                    const files = await generateWordPressTheme({
                      designName: design.name,
                      designSlug: design.slug,
                      designUrl: design.url,
                      resolved: design.resolved,
                      tokens: design.tokens,
                      screenshotBase64: design.tokens.meta?.screenshot,
                    });
                    const zip = new JSZip();
                    const folder = `${design.slug}-block-theme`;
                    for (const f of files) zip.file(`${folder}/${f.path}`, f.content);
                    const blob = await zip.generateAsync({ type: "blob" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${design.slug}-wordpress-theme.zip`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } finally {
                    setDownloadingWp(false);
                  }
                }}
                className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingWp ? "Bundling fonts…" : "Download WordPress Theme"}
              </button>
              <FeatureInfo items={["FSE block theme (theme.json driven)", "Full palette, fonts, spacing & shadows mapped", "Self-hosted fonts bundled in /assets/fonts", "8 templates + header/footer parts + 3 patterns", "Drop into wp-content/themes/ and activate"]} />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConfirmModal({ feature: "wordpress", cost: unlocks.wordpress.cost ?? 50 })}
                disabled={purchasing === "wordpress" || (credits !== null && credits < (unlocks.wordpress.cost ?? 50))}
                className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {purchasing === "wordpress" ? (
                  <>
                    <span className="w-3 h-3 border-2 border-(--ditto-bg) border-t-transparent rounded-full animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    WordPress Theme &middot; {unlocks.wordpress.cost ?? 50}
                    <Coins className="w-3 h-3" strokeWidth={1.5} />
                  </>
                )}
              </button>
              <FeatureInfo items={["FSE block theme (theme.json driven)", "Full palette, fonts, spacing & shadows mapped", "Self-hosted fonts bundled in /assets/fonts", "8 templates + header/footer parts + 3 patterns", "Drop into wp-content/themes/ and activate"]} />
            </div>
          )}

          {/* Complete Kit (100cr) — Everything in Dev Kit + HTML pages + components + beginner guide */}
          {unlocks.complete.unlocked ? (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const [
                    JSZip,
                    { generateStorybookProject },
                    { generateComponentsCode, generateCssVariables },
                    { generateKitPages },
                    { generateFigmaTokensStudio },
                    { generateTailwindConfig },
                    { generateTypeDefinitions },
                  ] = await Promise.all([
                    import("jszip").then((m) => m.default),
                    import("@/lib/generator/kit-storybook"),
                    import("@/lib/generator/components-code"),
                    import("@/lib/generator/kit-html"),
                    import("@/lib/generator/figma-tokens"),
                    import("@/lib/generator/kit-tailwind"),
                    import("@/lib/generator/kit-types"),
                  ]);
                  const r = design.resolved;
                  const zip = new JSZip();
                  // Storybook project
                  const sbFiles = generateStorybookProject(design.name, r, design.tokens.fontSources || []);
                  for (const f of sbFiles) zip.file(f.path, f.content);
                  // Dev artifacts
                  zip.file("tokens.css", generateCssVariables(r));
                  zip.file("figma-tokens.json", generateFigmaTokensStudio(r));
                  zip.file("tailwind.config.ts", generateTailwindConfig(r));
                  zip.file("types.ts", generateTypeDefinitions(r));
                  zip.file("components.tsx", generateComponentsCode(r));
                  // HTML preview pages
                  const pages = generateKitPages(design.name, r, design.tokens.fontSources || []);
                  const pagesFolder = zip.folder("pages")!;
                  for (const page of pages) pagesFolder.file(page.filename, page.html);
                  // Docs
                  zip.file("DESIGN.md", design.designMd);
                  zip.file("README.md", `# ${design.name} — Complete Kit\n\nGenerated by Ditto. Everything you need to implement this design system.\n\n## For developers\n\n\`\`\`bash\nnpm install\nnpm run storybook\n\`\`\`\n\n## For designers & non-devs\n\nOpen the \`pages/\` folder — it contains ready-to-use HTML pages (landing, dashboard, auth, pricing, blog) that you can open in any browser.\n\n## Contents\n\n- **Storybook project** — Interactive component explorer (\`src/\`)\n- **pages/** — 5 ready-to-use HTML pages\n- **components.tsx** — 14 React components with inline styles\n- **tokens.css** — CSS custom properties\n- **tailwind.config.ts** — Tailwind theme with design tokens\n- **types.ts** — TypeScript interfaces and typed token object\n- **figma-tokens.json** — Tokens Studio format for Figma\n- **DESIGN.md** — Full design system documentation\n`);
                  const blob = await zip.generateAsync({ type: "blob" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${design.slug}-complete-kit.zip`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded-lg border border-(--ditto-border) px-4 py-2 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
              >
                Download Complete Kit
              </button>
              <FeatureInfo items={["Everything in Dev Kit, plus:", "5 ready-to-use HTML pages", "React components (14) with inline styles", "Beginner-friendly README", "Open pages in any browser — no setup needed"]} />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConfirmModal({ feature: "complete", cost: unlocks.complete.cost ?? 100 })}
                disabled={purchasing === "complete" || (credits !== null && credits < (unlocks.complete.cost ?? 100))}
                className="rounded-lg border border-(--ditto-border) px-4 py-2 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {purchasing === "complete" ? (
                  <>
                    <span className="w-3 h-3 border-2 border-(--ditto-primary) border-t-transparent rounded-full animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Complete Kit &middot; {unlocks.complete.cost ?? 100}
                    <Coins className="w-3 h-3" strokeWidth={1.5} />
                  </>
                )}
              </button>
              <FeatureInfo items={["Everything in Dev Kit, plus:", "5 ready-to-use HTML pages", "React components (14) with inline styles", "Beginner-friendly README", "Open pages in any browser — no setup needed"]} />
            </div>
          )}

          {/* Copy DESIGN.md — always free */}
          <button
            id="tour-designmd-btn"
            onClick={() => {
              navigator.clipboard.writeText(design.designMd);
            }}
            className="rounded-lg border border-(--ditto-border) px-4 py-2 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
          >
            Copy DESIGN.md
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div id="tour-preview-tabs" className="flex gap-0 border-b border-(--ditto-border) mb-6">
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

          {/* Design Macros — preset transformations the user can toggle to
              shift the overall sentiment. Pure client-side math. */}
          <div className="mb-4 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-(--ditto-text)">
                  Ritocchi di sentiment
                </h3>
                <p className="text-xs text-(--ditto-text-muted) mt-0.5">
                  Clicca per provare. Non salva finché non premi &quot;Salva ritocchi&quot;.
                </p>
              </div>
              {activeMacros.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActiveMacros([]);
                      setEditResolved(design.resolved);
                    }}
                    className="text-xs text-(--ditto-text-secondary) hover:text-(--ditto-text) underline"
                  >
                    Reset
                  </button>
                  <button
                    onClick={saveActiveMacros}
                    disabled={savingMacros}
                    className="rounded-md bg-(--ditto-primary) text-(--ditto-bg) text-xs font-medium px-3 py-1.5 hover:bg-(--ditto-primary-hover) disabled:opacity-50"
                  >
                    {savingMacros ? "Salvataggio…" : `Salva ${activeMacros.length} ritocch${activeMacros.length === 1 ? "o" : "i"}`}
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {DESIGN_MACROS.map((m) => {
                const isActive = activeMacros.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMacro(m.id)}
                    title={m.description}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                      (isActive
                        ? "border-(--ditto-primary) bg-(--ditto-primary) text-(--ditto-bg)"
                        : "border-(--ditto-border) bg-(--ditto-bg) text-(--ditto-text-secondary) hover:border-(--ditto-primary)/50 hover:text-(--ditto-text)")
                    }
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
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
              onDownloadKit={unlocks.devkit.unlocked ? async () => {
                const [
                  JSZip,
                  { generateStorybookProject },
                  { generateCssVariables },
                  { generateFigmaTokensStudio },
                  { generateTailwindConfig },
                  { generateTypeDefinitions },
                ] = await Promise.all([
                  import("jszip").then((m) => m.default),
                  import("@/lib/generator/kit-storybook"),
                  import("@/lib/generator/components-code"),
                  import("@/lib/generator/figma-tokens"),
                  import("@/lib/generator/kit-tailwind"),
                  import("@/lib/generator/kit-types"),
                ]);
                const r = editResolved;
                const zip = new JSZip();
                const sbFiles = generateStorybookProject(design.name, r, design.tokens.fontSources || []);
                for (const f of sbFiles) zip.file(f.path, f.content);
                zip.file("tokens.css", generateCssVariables(r));
                zip.file("figma-tokens.json", generateFigmaTokensStudio(r));
                zip.file("tailwind.config.ts", generateTailwindConfig(r));
                zip.file("types.ts", generateTypeDefinitions(r));
                zip.file("DESIGN.md", design.designMd);
                const blob = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${design.slug}-devkit.zip`; a.click();
                URL.revokeObjectURL(url);
              } : undefined}
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
          className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6 overflow-auto max-h-[80vh]"
        >
          <pre className="text-sm text-(--ditto-text) whitespace-pre-wrap font-mono leading-relaxed">
            {design.designMd}
          </pre>
        </div>
      )}

      {/* Purchase confirm modal */}
      {confirmModal && (
        <PurchaseConfirmModal
          label={
            confirmModal.feature === "devkit"
              ? "Unlock Dev Kit"
              : confirmModal.feature === "wordpress"
                ? "Unlock WordPress Theme"
                : "Unlock Complete Kit"
          }
          description="Once unlocked, you can download it for 15 days."
          cost={confirmModal.cost}
          currentCredits={credits ?? 0}
          processing={purchasing === confirmModal.feature}
          onConfirm={() => purchaseFeature(confirmModal.feature)}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

function PurchaseConfirmModal({
  label,
  description,
  cost,
  currentCredits,
  processing,
  onConfirm,
  onCancel,
}: {
  label: string;
  description?: string;
  cost: number;
  currentCredits: number;
  processing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const after = currentCredits - cost;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-xl p-6 shadow-2xl"
        style={{ backgroundColor: "var(--ditto-surface)", border: "1px solid var(--ditto-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-(--ditto-text) mb-1">
          {label}
        </h3>
        {description && (
          <p className="text-sm text-(--ditto-text-muted) mb-5">
            {description}
          </p>
        )}
        {!description && <div className="mb-5" />}

        {/* Credit summary */}
        <div
          className="rounded-lg p-4 mb-5 space-y-2"
          style={{ backgroundColor: "var(--ditto-bg)", border: "1px solid var(--ditto-border)" }}
        >
          <div className="flex justify-between text-sm">
            <span className="text-(--ditto-text-muted)">Current balance</span>
            <span className="font-semibold text-(--ditto-text) flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-(--ditto-primary)" strokeWidth={1.5} />
              {currentCredits}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-(--ditto-text-muted)">{label} cost</span>
            <span className="font-semibold text-(--ditto-error)">-{cost}</span>
          </div>
          <div className="h-px" style={{ backgroundColor: "var(--ditto-border)" }} />
          <div className="flex justify-between text-sm">
            <span className="text-(--ditto-text-muted)">Balance after</span>
            <span className="font-semibold text-(--ditto-text) flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-(--ditto-primary)" strokeWidth={1.5} />
              {after}
            </span>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-lg border border-(--ditto-warning)/25 bg-(--ditto-warning)/10 px-4 py-3 mb-5">
          <p className="text-xs text-(--ditto-warning)">
            Credits spent on downloads are non-refundable. Make sure this is the design you want.
          </p>
        </div>

        {/* T&C checkbox */}
        <label className="flex items-start gap-2.5 mb-5 cursor-pointer group">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border border-(--ditto-border) accent-(--ditto-primary)"
          />
          <span className="text-xs text-(--ditto-text-muted) leading-relaxed">
            I accept the{" "}
            <a
              href="/terms"
              target="_blank"
              className="text-(--ditto-primary) underline underline-offset-2 hover:text-(--ditto-primary-hover)"
            >
              Terms and Conditions
            </a>{" "}
            and understand this purchase is final.
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-(--ditto-border) px-4 py-2.5 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!accepted || processing}
            className="flex-1 rounded-lg bg-(--ditto-primary) px-4 py-2.5 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {processing ? (
              <>
                <span className="w-3 h-3 border-2 border-(--ditto-bg) border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Confirm &middot; {cost}
                <Coins className="w-3 h-3" strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function BoostButton({ slug, onBoost }: { slug: string; onBoost: () => void }) {
  const [estimate, setEstimate] = useState<{ currentScore: number; estimatedScore: number; estimatedCost: number } | null>(null);
  const [boosting, setBoosting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ before: number; after: number; creditsCharged: number; fixesApplied: string[] } | null>(null);
  const { deduct, refresh, credits } = useCredits();

  useEffect(() => {
    fetch(`/api/designs/${slug}/boost`)
      .then((r) => r.json())
      .then(setEstimate)
      .catch(() => {});
  }, [slug]);

  const handleBoost = async () => {
    setShowConfirm(false);
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
      <div className="mt-4 rounded-lg border border-(--ditto-primary)/30 bg-(--ditto-primary)/5 p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-lg">&#10024;</span>
          <span className="font-semibold text-(--ditto-text)">
            Boost applicato! {result.before} → {result.after}/100
          </span>
          <span className="text-xs text-(--ditto-text-muted)">
            ({result.creditsCharged} crediti usati)
          </span>
        </div>
        <div className="text-xs text-(--ditto-text-muted) space-y-0.5">
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
    <div className="mt-4 flex items-center gap-4 rounded-lg border border-(--ditto-border) bg-(--ditto-surface) p-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-(--ditto-text)">
          Boost disponibile: <span className="font-bold">{estimate.currentScore} → {estimate.estimatedScore}/100</span>
          <span className="text-(--ditto-text-muted)"> (+{gain} punti)</span>
        </p>
        <p className="text-xs text-(--ditto-text-muted) mt-0.5">
          Costo: {estimate.estimatedCost} crediti — corregge automaticamente i problemi rilevati
        </p>
      </div>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={boosting}
        className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
        style={{
          backgroundColor: "var(--ditto-primary)",
          color: "var(--ditto-bg)",
        }}
      >
        {boosting ? "Boosting..." : `Boost ⚡ ${estimate.estimatedCost} cr`}
      </button>

      {showConfirm && (
        <PurchaseConfirmModal
          label="Quality Boost"
          description={`Boost quality from ${estimate.currentScore} to ${estimate.estimatedScore}/100 (+${gain} points). Automatically fixes detected issues.`}
          cost={estimate.estimatedCost}
          currentCredits={credits ?? 0}
          processing={boosting}
          onConfirm={handleBoost}
          onCancel={() => setShowConfirm(false)}
        />
      )}
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
        <section className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-(--ditto-text)">Design Quality</h2>
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
                  <span className="text-(--ditto-text-muted)">{d.label}</span>
                  <span className="font-semibold" style={{ color: qualityColor(d.value) }}>{d.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-(--ditto-border)">
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
                  <span className="text-(--ditto-text-muted)">
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
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">
          Colors ({tokens.colors.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tokens.colors.map((color, i) => (
            <div
              key={i}
              className="rounded-lg border border-(--ditto-border) overflow-hidden bg-(--ditto-surface)"
            >
              <div
                className="h-16 w-full"
                style={{ backgroundColor: color.hex }}
              />
              <div className="p-2">
                <div className="text-xs font-mono text-(--ditto-text)">
                  {color.hex}
                </div>
                <div className="text-[10px] text-(--ditto-text-muted) mt-0.5">
                  {color.role} · {color.occurrences}x
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">
          Typography
        </h2>
        <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--ditto-border)">
                <th className="text-left px-4 py-2 text-(--ditto-text-muted) font-medium">
                  Role
                </th>
                <th className="text-left px-4 py-2 text-(--ditto-text-muted) font-medium">
                  Font
                </th>
                <th className="text-left px-4 py-2 text-(--ditto-text-muted) font-medium">
                  Size
                </th>
                <th className="text-left px-4 py-2 text-(--ditto-text-muted) font-medium">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody>
              {tokens.typeScale.map((ts, i) => (
                <tr key={i} className="border-b border-(--ditto-border) last:border-0">
                  <td className="px-4 py-2 text-(--ditto-text)">{ts.role}</td>
                  <td className="px-4 py-2 text-(--ditto-text-secondary) font-mono text-xs">
                    {ts.fontFamily}
                  </td>
                  <td className="px-4 py-2 text-(--ditto-text-secondary)">{ts.size}</td>
                  <td className="px-4 py-2 text-(--ditto-text-secondary)">{ts.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">
          Spacing
        </h2>
        <div className="flex flex-wrap gap-3">
          {tokens.spacing.map((s, i) => (
            <div
              key={i}
              className="flex items-end gap-2 rounded-lg border border-(--ditto-border) bg-(--ditto-surface) p-3"
            >
              <div
                className="bg-(--ditto-primary)"
                style={{
                  width: Math.max(s.px, 4),
                  height: Math.max(s.px, 4),
                  borderRadius: 2,
                  maxWidth: 60,
                  maxHeight: 60,
                }}
              />
              <span className="text-xs font-mono text-(--ditto-text-muted)">
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section>
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">
          Shadows
        </h2>
        <div className="flex flex-wrap gap-4">
          {tokens.shadows.map((s, i) => (
            <div
              key={i}
              className="w-24 h-24 rounded-lg bg-(--ditto-surface)"
              style={{ boxShadow: s.value }}
            />
          ))}
        </div>
      </section>

      {/* Radii */}
      <section>
        <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">
          Border Radius
        </h2>
        <div className="flex flex-wrap gap-4">
          {tokens.radii.map((r, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 border-2 border-(--ditto-primary)"
                style={{ borderRadius: r.value }}
              />
              <span className="text-xs font-mono text-(--ditto-text-muted)">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CSS Variables */}
      {Object.keys(tokens.cssVariables).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-4">
            CSS Variables ({Object.keys(tokens.cssVariables).length})
          </h2>
          <div className="rounded-xl border border-(--ditto-border) bg-(--ditto-surface) p-4 max-h-96 overflow-auto">
            <pre className="text-xs font-mono text-(--ditto-text-secondary) leading-relaxed">
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

function FeatureInfo({ items }: { items: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-5 h-5 rounded-full border border-(--ditto-border) bg-(--ditto-surface) text-(--ditto-text-muted) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors flex items-center justify-center"
        aria-label="What's included"
      >
        <Info className="w-3 h-3" strokeWidth={1.5} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-64 rounded-lg border border-(--ditto-border) bg-(--ditto-surface) shadow-xl p-3">
            <p className="text-xs font-semibold text-(--ditto-text) mb-2">Includes:</p>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-[11px] text-(--ditto-text-muted)">
                  <span className="text-(--ditto-primary) mt-0.5 shrink-0">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StoredDesign, DashboardDesignCard } from "@/lib/types";
import { qualityColor } from "@/lib/quality-scorer";
import { LottieLoader } from "@/components/LottieLoader";
import { useCredits } from "@/lib/credits-context";
import { useLocalePath, useT } from "@/lib/locale-context";
import { useOnborda } from "onborda";
import { hasSeenTour } from "@/lib/onboarding";
import {
  Coins,
  Package,
  BookOpen,
  FileText,
  Trash2,
  Sparkles,
  X,
  RotateCcw,
  Recycle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DashboardProps {
  initialDesigns: DashboardDesignCard[];
  initialTrash: StoredDesign[];
  initialPage: number;
  initialTotalPages: number;
  initialTotal: number;
  perPage: number;
}

export function DashboardClient({
  initialDesigns,
  initialTrash,
  initialPage,
  initialTotalPages,
  initialTotal,
  perPage,
}: DashboardProps) {
  const lp = useLocalePath();
  const t = useT();
  const { credits, refresh: refreshCredits } = useCredits();
  const [designs, setDesigns] = useState<DashboardDesignCard[]>(initialDesigns);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [trash, setTrash] = useState<StoredDesign[]>(initialTrash);
  const [showTrash, setShowTrash] = useState(false);
  const [recycleModal, setRecycleModal] = useState<{ slug: string; action: "catalog" | "credits" } | null>(null);
  const [recycling, setRecycling] = useState(false);
  const [seenDesigns] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    const stored = localStorage.getItem("ditto-seen-designs");
    return stored ? new Set(JSON.parse(stored)) : new Set<string>();
  });

  const fetchDesigns = (targetPage: number = page) => {
    setLoading(true);
    fetch(`/api/designs?page=${targetPage}&perPage=${perPage}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.designs)) {
          setDesigns(data.designs);
          setPage(data.page ?? targetPage);
          setTotalPages(data.totalPages ?? 1);
          setTotal(data.total ?? 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const goToPage = (next: number) => {
    const clamped = Math.max(1, Math.min(next, totalPages));
    if (clamped === page) return;
    fetchDesigns(clamped);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (clamped === 1) url.searchParams.delete("page");
      else url.searchParams.set("page", String(clamped));
      window.history.replaceState(null, "", url.toString());
    }
  };

  const fetchTrash = () => {
    fetch("/api/designs/trash")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTrash(data);
      })
      .catch(() => {});
  };

  const { startOnborda } = useOnborda();

  // Auto-start dashboard tour on first visit
  useEffect(() => {
    if (!hasSeenTour("dashboard")) {
      const timer = setTimeout(() => startOnborda("dashboard"), 600);
      return () => clearTimeout(timer);
    }
  }, [startOnborda]);

  const toggleSelect = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectedDesigns = designs.filter((d) => selected.has(d.slug));
  const totalCreditsAtRisk = selectedDesigns.reduce(
    (sum, d) => sum + (d.creditsSpent ?? 0),
    0
  );

  const confirmDelete = async () => {
    setDeleteModal(false);
    setDeleting(true);
    await Promise.all(
      [...selected].map((slug) =>
        fetch(`/api/designs/${slug}`, { method: "DELETE" }).catch(() => {})
      )
    );
    setSelected(new Set());
    fetchDesigns();
    fetchTrash();
    setDeleting(false);
  };

  const restoreFromTrash = async (slug: string) => {
    await fetch("/api/designs/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, action: "restore" }),
    });
    fetchDesigns();
    fetchTrash();
  };

  const confirmRecycle = async () => {
    if (!recycleModal) return;
    setRecycling(true);
    try {
      const res = await fetch("/api/designs/recycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: recycleModal.slug, action: recycleModal.action }),
      });
      if (res.ok) {
        fetchDesigns();
        fetchTrash();
        refreshCredits();
      }
    } catch {}
    setRecycling(false);
    setRecycleModal(null);
  };

  // Mark design as seen when clicked
  const markSeen = (slug: string) => {
    if (seenDesigns.has(slug)) return;
    seenDesigns.add(slug);
    localStorage.setItem("ditto-seen-designs", JSON.stringify([...seenDesigns]));
  };

  const generateFromSelected = () => {
    const slugs = [...selected].join(",");
    window.location.href = `/inspire?from=${encodeURIComponent(slugs)}`;
  };

  return (
    <div>
      <div id="tour-dashboard-header" className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text)">
            {t("dashboardTitle")}
          </h1>
          <p className="text-sm text-(--ditto-text-secondary) mt-1">
            {designs.length} {designs.length === 1 ? t("dashboardCollectedSingular") : t("dashboardCollectedPlural")}
          </p>
        </div>
        <Link
          id="tour-add-design-btn"
          href={lp("/add")}
          className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
        >
          {t("dashboardAddDesign")}
        </Link>
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-(--ditto-primary)/30 bg-(--ditto-primary)/5 px-5 py-3">
          <span className="text-sm font-semibold text-(--ditto-text)">
            {selected.size} {t("dashboardSelected")}
          </span>
          <div className="h-4 w-px bg-(--ditto-border)" />
          {selected.size >= 2 && (
            <button
              onClick={generateFromSelected}
              className="flex items-center gap-1.5 rounded-lg bg-(--ditto-primary) px-3 py-1.5 text-xs font-semibold text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              {t("dashboardGenerateHybrid")}
            </button>
          )}
          <button
            onClick={() => setDeleteModal(true)}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg border border-(--ditto-error)/40 px-3 py-1.5 text-xs font-semibold text-(--ditto-error) hover:bg-(--ditto-error)/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("dashboardDelete")}
          </button>
          <button
            onClick={clearSelection}
            className="ml-auto flex items-center gap-1 text-xs text-(--ditto-text-muted) hover:text-(--ditto-text) transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("dashboardClear")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <LottieLoader size={200} />
            <span className="text-sm text-(--ditto-text-muted)">{t("dashboardLoading")}</span>
          </div>
        </div>
      ) : designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="w-16 h-16 ditto-blob opacity-40 inline-block mb-4" />
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-2">
            {t("dashboardEmptyTitle")}
          </h2>
          <p className="text-sm text-(--ditto-text-muted) max-w-md mb-6">
            {t("dashboardEmptyBody")}
          </p>
          <div className="flex gap-3">
            <Link
              href={lp("/add")}
              className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
            >
              {t("dashboardAddFromUrl")}
            </Link>
            <Link
              href={lp("/catalog")}
              className="rounded-lg border border-(--ditto-border) px-4 py-2 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
            >
              {t("dashboardBrowseCatalog")}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div id="tour-design-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                selected={selected.has(design.slug)}
                isNew={!seenDesigns.has(design.slug)}
                onToggleSelect={() => toggleSelect(design.slug)}
                onSeen={() => markSeen(design.slug)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-(--ditto-border) px-3 py-1.5 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t("dashboardPrevPage")}
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                {t("dashboardPrev")}
              </button>
              <span className="text-xs text-(--ditto-text-muted) tabular-nums">
                {t("dashboardPage")} <span className="text-(--ditto-text) font-semibold">{page}</span> {t("dashboardOf")} {totalPages}
                <span className="mx-2 opacity-40">·</span>
                {total} {total === 1 ? t("dashboardDesignSingular") : t("dashboardDesignPlural")}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-(--ditto-border) px-3 py-1.5 text-sm text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t("dashboardNextPage")}
              >
                {t("dashboardNext")}
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Trash section — only visible when there are trashed items */}
      {trash.length > 0 && (
        <div className="mt-12">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className="flex items-center gap-2 text-sm text-(--ditto-text-muted) hover:text-(--ditto-text) transition-colors mb-4"
          >
            <Recycle className="w-4 h-4" strokeWidth={1.5} />
            {t("dashboardRecycleBin")} ({trash.length})
            <span
              className="text-xs transition-transform"
              style={{ transform: showTrash ? "rotate(180deg)" : "none" }}
            >
              ▼
            </span>
          </button>

          {showTrash && (
            <div className="space-y-2">
              {trash.map((d) => (
                  <TrashRow
                    key={d.id}
                    design={d}
                    onRestore={() => restoreFromTrash(d.slug)}
                    onRecycle={(action) => setRecycleModal({ slug: d.slug, action })}
                  />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal(false)}>
          <div
            className="w-full max-w-md rounded-xl p-6 shadow-2xl"
            style={{ backgroundColor: "var(--ditto-surface)", border: "1px solid var(--ditto-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-(--ditto-text) mb-1">
              {selected.size === 1
                ? t("dashboardDeleteTitleSingular")
                : t("dashboardDeleteTitlePluralPrefix") + " " + selected.size + " " + t("dashboardDeleteTitlePluralSuffix")}
            </h3>
            <p className="text-sm text-(--ditto-text-muted) mb-5">
              {t("dashboardDeleteBody")}
            </p>

            {/* Credits at risk */}
            <div className="rounded-lg border border-(--ditto-border) bg-(--ditto-bg) p-4 mb-5">
              <div className="space-y-1.5">
                {selectedDesigns.map((d) => (
                  <div key={d.slug} className="flex items-center justify-between text-sm">
                    <span className="text-(--ditto-text) truncate mr-3">{d.name}</span>
                    <span className="shrink-0 flex items-center gap-1 text-(--ditto-text-muted)">
                      <Coins className="w-3 h-3 text-(--ditto-primary)" strokeWidth={1.5} />
                      {d.creditsSpent ?? 0}
                    </span>
                  </div>
                ))}
              </div>
              {totalCreditsAtRisk > 0 && (
                <>
                  <div className="h-px bg-(--ditto-border) my-3" />
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-(--ditto-text)">{t("dashboardTotalCreditsAtRisk")}</span>
                    <span className="flex items-center gap-1 text-(--ditto-error)">
                      <Coins className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {totalCreditsAtRisk}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Warning */}
            <div className="rounded-lg border border-(--ditto-error)/25 bg-(--ditto-error)/10 px-4 py-3 mb-5">
              <p className="text-xs text-(--ditto-error)">
                {t("dashboardDeleteWarning")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                className="flex-1 rounded-lg border border-(--ditto-border) px-4 py-2.5 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
              >
                {t("dashboardCancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-(--ditto-error) px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                {t("dashboardMoveToTrash")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recycle confirmation modal */}
      {recycleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRecycleModal(null)}>
          <div
            className="w-full max-w-md rounded-xl p-6 shadow-2xl"
            style={{ backgroundColor: "var(--ditto-surface)", border: "1px solid var(--ditto-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-(--ditto-text) mb-1">
              {recycleModal.action === "credits" ? t("dashboardRecycleCreditsTitle") : t("dashboardRecycleRandomTitle")}
            </h3>
            <p className="text-sm text-(--ditto-text-muted) mb-5">
              {recycleModal.action === "credits"
                ? t("dashboardRecycleCreditsBody")
                : t("dashboardRecycleRandomBody")}
            </p>

            {recycleModal.action === "credits" && credits !== null && (
              <div
                className="rounded-lg p-4 mb-5 space-y-2"
                style={{ backgroundColor: "var(--ditto-bg)", border: "1px solid var(--ditto-border)" }}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-(--ditto-text-muted)">{t("dashboardCurrentBalance")}</span>
                  <span className="font-semibold text-(--ditto-text) flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-(--ditto-primary)" strokeWidth={1.5} />
                    {credits}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-(--ditto-text-muted)">{t("dashboardRecycleBonus")}</span>
                  <span className="font-semibold text-(--ditto-primary)">+40</span>
                </div>
                <div className="h-px" style={{ backgroundColor: "var(--ditto-border)" }} />
                <div className="flex justify-between text-sm">
                  <span className="text-(--ditto-text-muted)">{t("dashboardBalanceAfter")}</span>
                  <span className="font-semibold text-(--ditto-text) flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-(--ditto-primary)" strokeWidth={1.5} />
                    {credits + 40}
                  </span>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-(--ditto-error)/25 bg-(--ditto-error)/10 px-4 py-3 mb-5">
              <p className="text-xs text-(--ditto-error)">
                {t("dashboardRecycleIrreversible")}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRecycleModal(null)}
                className="flex-1 rounded-lg border border-(--ditto-border) px-4 py-2.5 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
              >
                {t("dashboardCancel")}
              </button>
              <button
                onClick={confirmRecycle}
                disabled={recycling}
                className="flex-1 rounded-lg bg-(--ditto-primary) px-4 py-2.5 text-sm font-medium text-(--ditto-bg) hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {recycling ? (
                  <span className="w-3.5 h-3.5 border-2 border-(--ditto-bg) border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Recycle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {recycleModal.action === "credits" ? t("dashboardRecycleForCredits") : t("dashboardRecycleForRandom")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Trash Row ──

function TrashRow({
  design: d,
  onRestore,
  onRecycle,
}: {
  design: StoredDesign;
  onRestore: () => void;
  onRecycle: (action: "catalog" | "credits") => void;
}) {
  const t = useT();
  const isRecyclable = d.source === "extracted"; // only extracted designs can be recycled

  return (
    <div className="flex items-center justify-between rounded-lg border border-(--ditto-border) bg-(--ditto-surface) px-4 py-3 opacity-60 hover:opacity-100 transition-opacity">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${d.resolved.colorPrimary}, ${d.resolved.colorAccent})`,
            borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%",
          }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-(--ditto-text) truncate">{d.name}</p>
          <div className="flex items-center gap-2 text-[11px] text-(--ditto-text-muted)">
            {(d.creditsSpent ?? 0) > 0 && (
              <span className="flex items-center gap-0.5">
                <Coins className="w-3 h-3 text-(--ditto-primary)" strokeWidth={1.5} />
                {d.creditsSpent} {t("dashboardSpent")}
              </span>
            )}
            {d.source === "recycled" && (
              <span className="text-[10px] text-(--ditto-text-muted) italic">{t("dashboardFromRecycling")}</span>
            )}
            {d.source === "imported" && (
              <span className="text-[10px] text-(--ditto-text-muted) italic">{t("dashboardFromCatalog")}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRestore}
          className="flex items-center gap-1 rounded-lg border border-(--ditto-border) px-2.5 py-1.5 text-xs font-medium text-(--ditto-text-secondary) hover:text-(--ditto-primary) hover:border-(--ditto-primary)/40 transition-colors"
        >
          <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
          {t("dashboardRestore")}
        </button>
        {isRecyclable && (
          <>
            <button
              onClick={() => onRecycle("catalog")}
              className="flex items-center gap-1 rounded-lg border border-(--ditto-primary)/30 px-2.5 py-1.5 text-xs font-medium text-(--ditto-primary) hover:bg-(--ditto-primary)/10 transition-colors"
              title={t("dashboardSwapTitle")}
            >
              <Recycle className="w-3 h-3" strokeWidth={1.5} />
              {t("dashboardRandomDesign")}
            </button>
            <button
              onClick={() => onRecycle("credits")}
              className="flex items-center gap-1 rounded-lg border border-(--ditto-primary)/30 px-2.5 py-1.5 text-xs font-medium text-(--ditto-primary) hover:bg-(--ditto-primary)/10 transition-colors"
              title={t("dashboardConvertTitle")}
            >
              <Coins className="w-3 h-3" strokeWidth={1.5} />
              {t("dashboardPlus40Credits")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Design Card ──

function DesignCard({
  design,
  selected,
  isNew,
  onToggleSelect,
  onSeen,
}: {
  design: DashboardDesignCard;
  selected: boolean;
  isNew: boolean;
  onToggleSelect: () => void;
  onSeen: () => void;
}) {
  const t = useT();
  const { resolved } = design;
  const devkit = design.unlockedFeatures?.devkit ?? false;
  const complete = design.unlockedFeatures?.complete ?? false;
  const spent = design.creditsSpent ?? 0;

  return (
    <div
      className={`group relative rounded-xl border overflow-hidden transition-all duration-200 ${
        selected
          ? "border-(--ditto-primary) ring-1 ring-(--ditto-primary)/40"
          : "border-(--ditto-border) hover:border-(--ditto-text-muted)"
      }`}
      style={{ backgroundColor: "var(--ditto-surface)" }}
    >
      {/* Selection checkbox */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleSelect();
        }}
        className={`absolute top-3 left-3 z-10 w-5 h-5 rounded border flex items-center justify-center transition-all ${
          selected
            ? "bg-(--ditto-primary) border-(--ditto-primary)"
            : "bg-(--ditto-bg)/80 border-(--ditto-border) opacity-0 group-hover:opacity-100"
        }`}
      >
        {selected && (
          <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="var(--ditto-bg)" strokeWidth="2">
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </button>

      {/* New badge — centered top with rotating gradient border */}
      {isNew && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className="new-badge-glow text-[10px] font-extrabold tracking-widest px-3 py-1 rounded-full text-white uppercase">
            {t("dashboardNewBadge")}
          </span>
        </div>
      )}

      {/* Visual preview */}
      <Link href={`/design/${design.slug}`} className="block" onClick={onSeen}>
        <div
          className="h-36 relative overflow-hidden"
          style={{ backgroundColor: resolved.colorBackground }}
        >
          {/* Ditto blob — static, animates on hover/select */}
          <div className="absolute top-3 right-3 w-12 h-12">
            <div
              className={`w-full h-full transition-[border-radius] duration-700 ease-in-out ${
                selected
                  ? "animate-[blob-morph_4s_ease-in-out_infinite]"
                  : "group-hover:animate-[blob-morph_4s_ease-in-out_infinite]"
              }`}
              style={{
                background: `linear-gradient(135deg, ${resolved.colorPrimary} 0%, ${resolved.colorSecondary} 40%, ${resolved.colorAccent} 70%, ${resolved.colorPrimary} 100%)`,
                backgroundSize: "300% auto",
                borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%",
              }}
            />
          </div>

          {/* Mini UI mockup */}
          <div className="absolute inset-x-3 top-3 bottom-2 flex flex-col gap-1.5" style={{ maxWidth: "calc(100% - 4.5rem)" }}>
            {/* Heading line */}
            <div
              className="h-2 rounded-full"
              style={{
                backgroundColor: colorWithAlpha(resolved.colorTextPrimary, 0.7),
                maxWidth: "90px",
              }}
            />
            {/* Subtext lines */}
            <div className="h-1.5 rounded-full" style={{ backgroundColor: colorWithAlpha(resolved.colorTextPrimary, 0.2), maxWidth: "130px" }} />
            <div className="h-1.5 rounded-full" style={{ backgroundColor: colorWithAlpha(resolved.colorTextPrimary, 0.12), maxWidth: "100px" }} />

            {/* Buttons row */}
            <div className="flex items-center gap-1.5 mt-1">
              <div
                className="h-5 px-2.5 flex items-center"
                style={{
                  backgroundColor: resolved.colorPrimary,
                  borderRadius: resolved.radiusMd,
                }}
              >
                <span className="text-[7px] font-semibold" style={{ color: isDarkColor(resolved.colorPrimary) ? "#fff" : "#000" }}>
                  {t("dashboardMockupButton")}
                </span>
              </div>
              <div
                className="h-5 px-2.5 flex items-center border"
                style={{
                  borderColor: colorWithAlpha(resolved.colorTextPrimary, 0.2),
                  borderRadius: resolved.radiusMd,
                }}
              >
                <span className="text-[7px]" style={{ color: colorWithAlpha(resolved.colorTextPrimary, 0.5) }}>
                  {t("dashboardMockupSecondary")}
                </span>
              </div>
            </div>

            {/* Card mockup */}
            <div
              className="flex-1 min-h-0 mt-1 rounded-md p-2 flex items-start gap-2"
              style={{
                backgroundColor: resolved.colorSurface,
                border: `1px solid ${colorWithAlpha(resolved.colorBorder, 0.5)}`,
                borderRadius: resolved.radiusMd,
              }}
            >
              <div className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: resolved.colorAccent }} />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="h-1.5 rounded-full" style={{ backgroundColor: colorWithAlpha(resolved.colorTextPrimary, 0.5), maxWidth: "60px" }} />
                <div className="h-1 rounded-full" style={{ backgroundColor: colorWithAlpha(resolved.colorTextPrimary, 0.15), maxWidth: "90px" }} />
              </div>
            </div>
          </div>

          {/* Quality badge */}
          {design.quality && (
            <span
              className="absolute top-3 right-[4.2rem] text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: qualityColor(design.quality.overall) + "18",
                color: qualityColor(design.quality.overall),
              }}
              title={`${t("dashboardQualityLabel")}: ${design.quality.overall}/100`}
            >
              {design.quality.overall}
            </span>
          )}

          {/* Palette strip */}
          <div className="absolute bottom-0 left-0 right-0 flex h-1">
            <div className="flex-1" style={{ backgroundColor: resolved.colorPrimary }} />
            <div className="flex-1" style={{ backgroundColor: resolved.colorSecondary }} />
            <div className="flex-1" style={{ backgroundColor: resolved.colorAccent }} />
            <div className="flex-1" style={{ backgroundColor: resolved.colorBackground }} />
            <div className="flex-1" style={{ backgroundColor: resolved.colorTextPrimary }} />
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-(--ditto-text) group-hover:text-(--ditto-primary) transition-colors truncate">
              {design.name}
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-(--ditto-text-muted) px-1.5 py-0.5 rounded border border-(--ditto-border) shrink-0 ml-2">
              {design.source}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-(--ditto-text-muted) mt-1 mb-3">
            <span style={{ fontFamily: resolved.fontHeading }} className="truncate">
              {resolved.fontHeading}
            </span>
            <span>·</span>
            <span>{resolved.radiusMd} {t("dashboardRadius")}</span>
          </div>

          {/* Credits spent + feature status */}
          <div className="flex items-center gap-3">
            {spent > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-(--ditto-text-muted)">
                <Coins className="w-3 h-3 text-(--ditto-primary)" strokeWidth={1.5} />
                {spent} {t("dashboardSpent")}
              </span>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <span title={t("dashboardDevKitTitle")}>
                <Package className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: devkit ? "var(--ditto-success)" : "var(--ditto-error)" }} />
              </span>
              <span title={t("dashboardCompleteKitTitle")}>
                <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: complete ? "var(--ditto-success)" : "var(--ditto-error)" }} />
              </span>
              <span title={t("dashboardDesignMdTitle")}>
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: "var(--ditto-success)" }} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Helpers ──

function isDarkColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 < 128;
}

function colorWithAlpha(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

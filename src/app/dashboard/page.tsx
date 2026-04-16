"use client";

import { useEffect, useState } from "react";
import type { StoredDesign } from "@/lib/types";
import { qualityColor } from "@/lib/quality-scorer";
import { LottieLoader } from "@/components/LottieLoader";
import { useCredits } from "@/lib/credits-context";
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
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const [designs, setDesigns] = useState<StoredDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [trash, setTrash] = useState<StoredDesign[]>([]);
  const [showTrash, setShowTrash] = useState(false);

  const fetchDesigns = () => {
    fetch("/api/designs")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setDesigns(data);
      })
      .catch(() => setDesigns([]))
      .finally(() => setLoading(false));
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

  useEffect(() => {
    fetchDesigns();
    fetchTrash();
  }, []);

  // Auto-start dashboard tour on first visit
  useEffect(() => {
    if (!loading && !hasSeenTour("dashboard")) {
      const timer = setTimeout(() => startOnborda("dashboard"), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, startOnborda]);

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

  const permanentDelete = async (slug: string) => {
    await fetch("/api/designs/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, action: "permanent-delete" }),
    });
    fetchTrash();
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
            Design Library
          </h1>
          <p className="text-sm text-(--ditto-text-secondary) mt-1">
            {designs.length} design system{designs.length !== 1 ? "s" : ""} collected
          </p>
        </div>
        <a
          id="tour-add-design-btn"
          href="/add"
          className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
        >
          + Add Design
        </a>
      </div>

      <div id="tour-quests-panel"><QuestsPanel /></div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-(--ditto-primary)/30 bg-(--ditto-primary)/5 px-5 py-3">
          <span className="text-sm font-semibold text-(--ditto-text)">
            {selected.size} selected
          </span>
          <div className="h-4 w-px bg-(--ditto-border)" />
          {selected.size >= 2 && (
            <button
              onClick={generateFromSelected}
              className="flex items-center gap-1.5 rounded-lg bg-(--ditto-primary) px-3 py-1.5 text-xs font-semibold text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              Generate hybrid from selected
            </button>
          )}
          <button
            onClick={() => setDeleteModal(true)}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-lg border border-(--ditto-error)/40 px-3 py-1.5 text-xs font-semibold text-(--ditto-error) hover:bg-(--ditto-error)/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Delete
          </button>
          <button
            onClick={clearSelection}
            className="ml-auto flex items-center gap-1 text-xs text-(--ditto-text-muted) hover:text-(--ditto-text) transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <LottieLoader size={200} />
            <span className="text-sm text-(--ditto-text-muted)">Loading designs...</span>
          </div>
        </div>
      ) : designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="w-16 h-16 ditto-blob opacity-40 inline-block mb-4" />
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-2">
            No designs yet
          </h2>
          <p className="text-sm text-(--ditto-text-muted) max-w-md mb-6">
            Start by adding a design from a URL or browse the curated catalog.
          </p>
          <div className="flex gap-3">
            <a
              href="/add"
              className="rounded-lg bg-(--ditto-primary) px-4 py-2 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors"
            >
              + Add from URL
            </a>
            <a
              href="/catalog"
              className="rounded-lg border border-(--ditto-border) px-4 py-2 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
            >
              Browse Catalog
            </a>
          </div>
        </div>
      ) : (
        <div id="tour-design-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              selected={selected.has(design.slug)}
              onToggleSelect={() => toggleSelect(design.slug)}
            />
          ))}
        </div>
      )}

      {/* Trash section — only visible when there are trashed items */}
      {trash.length > 0 && (
        <div className="mt-12">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className="flex items-center gap-2 text-sm text-(--ditto-text-muted) hover:text-(--ditto-text) transition-colors mb-4"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            Trash ({trash.length})
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
                    onPermanentDelete={() => permanentDelete(d.slug)}
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
              Delete {selected.size} design{selected.size > 1 ? "s" : ""}?
            </h3>
            <p className="text-sm text-(--ditto-text-muted) mb-5">
              Designs will be moved to the trash and permanently deleted after 7 days.
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
                    <span className="text-(--ditto-text)">Total credits at risk</span>
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
                If you don&apos;t restore within 7 days, these designs and all credits spent on them will be lost forever.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                className="flex-1 rounded-lg border border-(--ditto-border) px-4 py-2.5 text-sm font-medium text-(--ditto-text-secondary) hover:text-(--ditto-text) hover:border-(--ditto-text-muted) transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-(--ditto-error) px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                Move to trash
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
  onPermanentDelete,
}: {
  design: StoredDesign;
  onRestore: () => void;
  onPermanentDelete: () => void;
}) {
  const [daysLeft] = useState(() => {
    const deletedDate = d.deletedAt ? new Date(d.deletedAt) : new Date();
    const expiresDate = new Date(deletedDate);
    expiresDate.setDate(expiresDate.getDate() + 7);
    return Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / 86400000));
  });

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
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              {daysLeft}d left
            </span>
            {(d.creditsSpent ?? 0) > 0 && (
              <span className="flex items-center gap-0.5">
                <Coins className="w-3 h-3 text-(--ditto-primary)" strokeWidth={1.5} />
                {d.creditsSpent} spent
              </span>
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
          Restore
        </button>
        <button
          onClick={onPermanentDelete}
          className="flex items-center gap-1 rounded-lg border border-(--ditto-error)/30 px-2.5 py-1.5 text-xs font-medium text-(--ditto-error) hover:bg-(--ditto-error)/10 transition-colors"
        >
          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
          Delete forever
        </button>
      </div>
    </div>
  );
}

// ── Design Card ──

function DesignCard({
  design,
  selected,
  onToggleSelect,
}: {
  design: StoredDesign;
  selected: boolean;
  onToggleSelect: () => void;
}) {
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

      {/* Visual preview */}
      <a href={`/design/${design.slug}`} className="block">
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
                  Button
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
                  Secondary
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
              title={`Quality: ${design.quality.overall}/100`}
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
            <span>{resolved.radiusMd} radius</span>
          </div>

          {/* Credits spent + feature status */}
          <div className="flex items-center gap-3">
            {spent > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-(--ditto-text-muted)">
                <Coins className="w-3 h-3 text-(--ditto-primary)" strokeWidth={1.5} />
                {spent} spent
              </span>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <span title="Dev Kit">
                <Package className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: devkit ? "var(--ditto-success)" : "var(--ditto-error)" }} />
              </span>
              <span title="Complete Kit">
                <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: complete ? "var(--ditto-success)" : "var(--ditto-error)" }} />
              </span>
              <span title="DESIGN.md (always included)">
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: "var(--ditto-success)" }} />
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

// ── Quests Panel ──

interface QuestStatus {
  quest: { id: string; title: string; description: string; credits: number; icon: string; repeatable: string };
  completed: boolean;
  completedToday: boolean;
  totalCompletions: number;
  canClaim: boolean;
}

function QuestsPanel() {
  const [quests, setQuests] = useState<QuestStatus[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { add: addCredits, refresh: refreshCredits } = useCredits();

  useEffect(() => {
    fetch("/api/quests")
      .then((r) => r.json())
      .then((data) => {
        setQuests(data.quests || []);
        setReferralCode(data.referralCode || null);
      })
      .catch(() => {});
  }, []);

  const claim = async (questId: string) => {
    setClaiming(questId);
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
      });
      if (res.ok) {
        const awarded = await res.json();
        addCredits(awarded.credits || 0);
        refreshCredits();
        const data = await fetch("/api/quests").then((r) => r.json());
        setQuests(data.quests || []);
      }
    } catch {}
    setClaiming(null);
  };

  const claimable = quests.filter((q) => q.canClaim);
  const done = quests.filter((q) => q.completed && !q.canClaim);

  if (quests.length === 0) return null;

  const referralLink = referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${referralCode}`
    : null;

  return (
    <div className="mb-8 rounded-xl border border-(--ditto-border) bg-(--ditto-surface) overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🎯</span>
          <span className="text-sm font-semibold text-(--ditto-text)">Quests</span>
          {claimable.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-(--ditto-primary)/15 text-(--ditto-primary)">
              {claimable.length} available
            </span>
          )}
        </div>
        <span
          className="text-xs text-(--ditto-text-muted) transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "none" }}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-2">
          {claimable.map((q) => (
            <div key={q.quest.id} className="flex items-center justify-between p-3 rounded-lg border border-(--ditto-primary)/20 bg-(--ditto-primary)/5">
              <div className="flex items-center gap-3">
                <span className="text-lg">{q.quest.icon}</span>
                <div>
                  <div className="text-sm font-medium text-(--ditto-text)">{q.quest.title}</div>
                  <div className="text-xs text-(--ditto-text-muted)">{q.quest.description}</div>
                </div>
              </div>
              <button
                onClick={() => claim(q.quest.id)}
                disabled={claiming === q.quest.id}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-(--ditto-primary) text-(--ditto-bg) disabled:opacity-50"
              >
                {claiming === q.quest.id ? "..." : `+${q.quest.credits} cr`}
              </button>
            </div>
          ))}

          {done.map((q) => (
            <div key={q.quest.id} className="flex items-center justify-between p-3 rounded-lg opacity-50">
              <div className="flex items-center gap-3">
                <span className="text-lg">{q.quest.icon}</span>
                <div>
                  <div className="text-sm font-medium text-(--ditto-text) line-through">{q.quest.title}</div>
                  <div className="text-xs text-(--ditto-text-muted)">
                    {q.quest.repeatable === "daily" ? "Done today" : "Completed"}
                    {q.totalCompletions > 1 && ` (${q.totalCompletions}x)`}
                  </div>
                </div>
              </div>
              <span className="text-xs text-(--ditto-text-muted)">✓</span>
            </div>
          ))}

          {quests.filter((q) => !q.canClaim && !q.completed).map((q) => (
            <div key={q.quest.id} className="flex items-center justify-between p-3 rounded-lg opacity-40">
              <div className="flex items-center gap-3">
                <span className="text-lg">{q.quest.icon}</span>
                <div>
                  <div className="text-sm font-medium text-(--ditto-text)">{q.quest.title}</div>
                  <div className="text-xs text-(--ditto-text-muted)">{q.quest.description}</div>
                </div>
              </div>
              <span className="text-xs text-(--ditto-text-muted)">+{q.quest.credits} cr</span>
            </div>
          ))}

          {referralLink && (
            <div className="mt-3 pt-3 border-t border-(--ditto-border)">
              <div className="text-xs font-medium text-(--ditto-text-muted) mb-2">
                🤝 Your referral link — share to earn 200 credits per signup
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-(--ditto-bg) text-(--ditto-text-muted) border border-(--ditto-border) outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-(--ditto-border) text-(--ditto-text-secondary) hover:text-(--ditto-text) transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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

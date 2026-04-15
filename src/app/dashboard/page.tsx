"use client";

import React, { useEffect, useState } from "react";
import type { StoredDesign } from "@/lib/types";
import { qualityColor } from "@/lib/quality-scorer";
import { LottieLoader } from "@/components/LottieLoader";
import { useCredits } from "@/lib/credits-context";

export default function DashboardPage() {
  const [designs, setDesigns] = useState<StoredDesign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ditto-text)]">
            Design Library
          </h1>
          <p className="text-sm text-[var(--ditto-text-secondary)] mt-1">
            {designs.length} design system{designs.length !== 1 ? "s" : ""} collected
          </p>
        </div>
        <a
          href="/add"
          className="rounded-lg bg-[var(--ditto-primary)] px-4 py-2 text-sm font-medium text-[var(--ditto-bg)] hover:bg-[var(--ditto-primary-hover)] transition-colors"
        >
          + Add Design
        </a>
      </div>

      <QuestsPanel />

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <LottieLoader size={200} />
            <span className="text-sm text-[var(--ditto-text-muted)]">Loading designs...</span>
          </div>
        </div>
      ) : designs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="w-16 h-16 ditto-blob opacity-40 inline-block mb-4" />
          <h2 className="text-lg font-semibold text-[var(--ditto-text)] mb-2">
            No designs yet
          </h2>
          <p className="text-sm text-[var(--ditto-text-muted)] max-w-md mb-6">
            Start by adding a design from a URL or importing from the community collection.
          </p>
          <div className="flex gap-3">
            <a
              href="/add"
              className="rounded-lg bg-[var(--ditto-primary)] px-4 py-2 text-sm font-medium text-[var(--ditto-bg)] hover:bg-[var(--ditto-primary-hover)] transition-colors"
            >
              + Add from URL
            </a>
            <ImportButton onDone={() => {
              fetch("/api/designs")
                .then((r) => r.ok ? r.json() : [])
                .then((data) => { if (Array.isArray(data)) setDesigns(data); })
                .catch(() => {});
            }} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.map((design) => (
            <DesignCard key={design.id} design={design} />
          ))}
        </div>
      )}
    </div>
  );
}

function ImportButton({ onDone }: { onDone: () => void }) {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState("");

  const handleImport = async () => {
    setImporting(true);
    setStatus("Importing collection... this takes a minute");
    try {
      const res = await fetch("/api/import", { method: "POST" });
      if (!res.ok) throw new Error("Import failed");
      const data = await res.json();
      setStatus(`Done! Imported ${data.count} designs`);
      onDone();
    } catch {
      setStatus("Import failed, try again");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleImport}
        disabled={importing}
        className="rounded-lg border border-[var(--ditto-border)] px-4 py-2 text-sm font-medium text-[var(--ditto-text-secondary)] hover:text-[var(--ditto-text)] hover:border-[var(--ditto-text-muted)] transition-colors disabled:opacity-50"
      >
        {importing ? (
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-[var(--ditto-primary)] border-t-transparent rounded-full animate-spin" />
            Importing...
          </span>
        ) : (
          "Import Collection"
        )}
      </button>
      {status && (
        <span className="text-xs text-[var(--ditto-text-muted)]">{status}</span>
      )}
    </div>
  );
}

function DesignCard({ design }: { design: StoredDesign }) {
  const { resolved } = design;

  return (
    <a
      href={`/design/${design.slug}`}
      className="group block rounded-xl border border-[var(--ditto-border)] overflow-hidden hover:border-[var(--ditto-text-muted)] transition-all duration-200"
      style={{ backgroundColor: "var(--ditto-surface)" }}
    >
      <div className="h-24 relative overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="flex-1" style={{ backgroundColor: resolved.colorBackground }} />
          <div className="flex-1" style={{ backgroundColor: resolved.colorPrimary }} />
          <div className="flex-1" style={{ backgroundColor: resolved.colorSecondary }} />
          <div className="flex-1" style={{ backgroundColor: resolved.colorAccent }} />
          <div className="flex-1" style={{ backgroundColor: resolved.colorSurface }} />
        </div>
        <div
          className="absolute bottom-2 right-3 px-3 py-1.5 text-xs font-medium shadow-lg"
          style={{
            backgroundColor: resolved.colorPrimary,
            color: "#fff",
            borderRadius: resolved.radiusMd,
            fontFamily: resolved.fontBody,
          }}
        >
          Button
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-[var(--ditto-text)] group-hover:text-[var(--ditto-primary)] transition-colors">
              {design.name}
            </h3>
            <span
              onClick={(e) => { e.preventDefault(); window.open(design.url, "_blank"); }}
              className="text-xs text-[var(--ditto-text-muted)] hover:text-[var(--ditto-primary)] mt-0.5 truncate max-w-[200px] block cursor-pointer transition-colors"
            >
              {design.url}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {design.quality && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: qualityColor(design.quality.overall) + "18",
                  color: qualityColor(design.quality.overall),
                }}
                title={`Design Quality: ${design.quality.overall}/100`}
              >
                {design.quality.overall}<span className="opacity-60">/100</span>
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wider text-[var(--ditto-text-muted)] px-1.5 py-0.5 rounded border border-[var(--ditto-border)]">
              {design.source}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-[var(--ditto-text-muted)]">
          <span style={{ fontFamily: resolved.fontHeading }}>
            {resolved.fontHeading}
          </span>
          <span>·</span>
          <span>{resolved.radiusMd} radius</span>
          <span>·</span>
          <span>{design.tokens.colors.length} colors</span>
        </div>
      </div>
    </a>
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
        // Refresh quests
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
    <div className="mb-8 rounded-xl border border-[var(--ditto-border)] bg-[var(--ditto-surface)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🎯</span>
          <span className="text-sm font-semibold text-[var(--ditto-text)]">
            Quests
          </span>
          {claimable.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ditto-primary)]/15 text-[var(--ditto-primary)]">
              {claimable.length} available
            </span>
          )}
        </div>
        <span
          className="text-xs text-[var(--ditto-text-muted)] transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : "none" }}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-2">
          {/* Claimable quests */}
          {claimable.map((q) => (
            <div
              key={q.quest.id}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--ditto-primary)]/20 bg-[var(--ditto-primary)]/5"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{q.quest.icon}</span>
                <div>
                  <div className="text-sm font-medium text-[var(--ditto-text)]">
                    {q.quest.title}
                  </div>
                  <div className="text-xs text-[var(--ditto-text-muted)]">
                    {q.quest.description}
                  </div>
                </div>
              </div>
              <button
                onClick={() => claim(q.quest.id)}
                disabled={claiming === q.quest.id}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--ditto-primary)] text-[var(--ditto-bg)] disabled:opacity-50"
              >
                {claiming === q.quest.id ? "..." : `+${q.quest.credits} cr`}
              </button>
            </div>
          ))}

          {/* Completed quests */}
          {done.map((q) => (
            <div
              key={q.quest.id}
              className="flex items-center justify-between p-3 rounded-lg opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{q.quest.icon}</span>
                <div>
                  <div className="text-sm font-medium text-[var(--ditto-text)] line-through">
                    {q.quest.title}
                  </div>
                  <div className="text-xs text-[var(--ditto-text-muted)]">
                    {q.quest.repeatable === "daily" ? "Done today" : "Completed"}
                    {q.totalCompletions > 1 && ` (${q.totalCompletions}x)`}
                  </div>
                </div>
              </div>
              <span className="text-xs text-[var(--ditto-text-muted)]">✓</span>
            </div>
          ))}

          {/* Not yet available */}
          {quests.filter((q) => !q.canClaim && !q.completed).map((q) => (
            <div
              key={q.quest.id}
              className="flex items-center justify-between p-3 rounded-lg opacity-40"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{q.quest.icon}</span>
                <div>
                  <div className="text-sm font-medium text-[var(--ditto-text)]">
                    {q.quest.title}
                  </div>
                  <div className="text-xs text-[var(--ditto-text-muted)]">
                    {q.quest.description}
                  </div>
                </div>
              </div>
              <span className="text-xs text-[var(--ditto-text-muted)]">
                +{q.quest.credits} cr
              </span>
            </div>
          ))}

          {/* Referral link */}
          {referralLink && (
            <div className="mt-3 pt-3 border-t border-[var(--ditto-border)]">
              <div className="text-xs font-medium text-[var(--ditto-text-muted)] mb-2">
                🤝 Your referral link — share to earn 200 credits per signup
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--ditto-bg)] text-[var(--ditto-text-muted)] border border-[var(--ditto-border)] outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--ditto-border)] text-[var(--ditto-text-secondary)] hover:text-[var(--ditto-text)] transition-colors"
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

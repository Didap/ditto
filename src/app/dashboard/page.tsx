"use client";

import React, { useEffect, useState } from "react";
import type { StoredDesign } from "@/lib/types";
import { qualityColor } from "@/lib/quality-scorer";
import { LottieLoader } from "@/components/LottieLoader";

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

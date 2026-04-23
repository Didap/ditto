"use client";

import { useState } from "react";
import { useCredits } from "@/lib/credits-context";
import { Lock, Unlock, Coins, ExternalLink, Package, BookOpen, FileText } from "lucide-react";
import type { CatalogCategory, CatalogPreview } from "@/lib/catalog";
import { useT } from "@/lib/locale-context";
import type { TranslationKey } from "@/lib/i18n";

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: CatalogCategory;
  preview: CatalogPreview;
  unlocked: boolean;
  slug: string | null;
}

const CATEGORY_KEYS: Record<CatalogCategory, TranslationKey> = {
  saas: "catalogCategorySaas",
  fintech: "catalogCategoryFintech",
  editorial: "catalogCategoryEditorial",
  developer: "catalogCategoryDeveloper",
  luxury: "catalogCategoryLuxury",
  creative: "catalogCategoryCreative",
  commerce: "catalogCategoryCommerce",
  ai: "catalogCategoryAi",
  enterprise: "catalogCategoryEnterprise",
};

interface CatalogProps {
  initialItems: CatalogItem[];
  initialUnlockCost: number;
}

export function CatalogClient({ initialItems, initialUnlockCost }: CatalogProps) {
  const t = useT();
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [unlockCost] = useState(initialUnlockCost);
  const [loading] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [filter, setFilter] = useState<CatalogCategory | "all">("all");
  const { credits, deduct, refresh } = useCredits();

  const handleUnlock = async (catalogId: string) => {
    if (credits !== null && credits < unlockCost) return;
    setUnlocking(catalogId);
    try {
      const res = await fetch("/api/catalog/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogId }),
      });
      if (res.ok) {
        const data = await res.json();
        deduct(unlockCost);
        refresh();
        setItems((prev) =>
          prev.map((item) =>
            item.id === catalogId
              ? { ...item, unlocked: true, slug: data.slug }
              : item
          )
        );
      }
    } catch {}
    setUnlocking(null);
  };

  const categories = ["all", ...Object.keys(CATEGORY_KEYS)] as const;
  const filtered =
    filter === "all" ? items : items.filter((i) => i.category === filter);
  const unlockedCount = items.filter((i) => i.unlocked).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-(--ditto-primary) border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-(--ditto-text)">
            {t("catalogTitle")}
          </h1>
          <p className="text-sm text-(--ditto-text-secondary) mt-1">
            {items.length} {t("catalogCuratedLabel")} &middot; {unlockedCount} {t("catalogUnlockedLabel")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-(--ditto-primary)">
          <Coins className="w-4 h-4" strokeWidth={1.5} />
          <span className="font-semibold">{unlockCost}</span>
          <span className="text-(--ditto-text-muted)">{t("catalogPerDesign")}</span>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as CatalogCategory | "all")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === cat
                ? "bg-(--ditto-primary) text-(--ditto-bg)"
                : "bg-(--ditto-surface) text-(--ditto-text-muted) hover:text-(--ditto-text) border border-(--ditto-border)"
            }`}
          >
            {cat === "all"
              ? `${t("catalogFilterAll")} (${items.length})`
              : `${t(CATEGORY_KEYS[cat as CatalogCategory])} (${items.filter((i) => i.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <CatalogCard
            key={item.id}
            item={item}
            unlockCost={unlockCost}
            unlocking={unlocking === item.id}
            canAfford={credits !== null && credits >= unlockCost}
            onUnlock={() => handleUnlock(item.id)}
            t={t}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-(--ditto-text-muted) text-sm">
          {t("catalogEmptyCategory")}
        </div>
      )}
    </div>
  );
}

function CatalogCard({
  item,
  unlockCost,
  unlocking,
  canAfford,
  onUnlock,
  t,
}: {
  item: CatalogItem;
  unlockCost: number;
  unlocking: boolean;
  canAfford: boolean;
  onUnlock: () => void;
  t: (key: TranslationKey) => string;
}) {
  const p = item.preview;
  const isDark = isColorDark(p.bg);

  return (
    <div
      className={`group relative rounded-xl border overflow-hidden transition-all ${
        item.unlocked
          ? "border-(--ditto-primary)/30"
          : "border-(--ditto-border) hover:border-(--ditto-text-muted)/40"
      }`}
      style={{ backgroundColor: "var(--ditto-surface)" }}
    >
      {/* ── Visual preview area ── */}
      <div
        className="relative h-48 overflow-hidden"
        style={{ backgroundColor: p.bg }}
      >
        {/* Ditto blob */}
        <div
          className="absolute top-4 right-4 w-14 h-14 opacity-80 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${p.primary} 0%, ${p.secondary} 50%, ${p.accent} 100%)`,
            borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%",
          }}
        />

        {/* Fake nav bar */}
        <div
          className="mx-4 mt-4 flex items-center gap-2 rounded-t-lg px-3 py-2"
          style={{ backgroundColor: mixAlpha(p.text, 0.06) }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.primary }} />
          <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: mixAlpha(p.text, 0.1), maxWidth: "60px" }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: mixAlpha(p.text, 0.08) }} />
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: mixAlpha(p.text, 0.08) }} />
        </div>

        {/* Fake hero section */}
        <div className="mx-4 px-3 py-3" style={{ backgroundColor: mixAlpha(p.text, 0.03) }}>
          {/* Heading placeholder */}
          <div className="h-2.5 rounded-full mb-2" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", maxWidth: "120px" }} />
          <div className="h-1.5 rounded-full mb-1" style={{ backgroundColor: mixAlpha(p.text, 0.2), maxWidth: "180px" }} />
          <div className="h-1.5 rounded-full mb-3" style={{ backgroundColor: mixAlpha(p.text, 0.12), maxWidth: "140px" }} />
          {/* CTA button */}
          <div className="flex gap-2">
            <div
              className="h-6 rounded-md px-3 flex items-center"
              style={{ backgroundColor: p.primary }}
            >
              <span className="text-[8px] font-semibold" style={{ color: isColorDark(p.primary) ? "#fff" : "#000" }}>
                {t("catalogPreviewGetStarted")}
              </span>
            </div>
            <div
              className="h-6 rounded-md px-3 flex items-center border"
              style={{ borderColor: mixAlpha(p.text, 0.2) }}
            >
              <span className="text-[8px]" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}>
                {t("catalogPreviewLearnMore")}
              </span>
            </div>
          </div>
        </div>

        {/* Feature status icons */}
        <div className="absolute bottom-2 right-3 flex items-center gap-1">
          <span title={t("catalogIconKit")}><Package className="w-3 h-3" strokeWidth={1.5} style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)" }} /></span>
          <span title={t("catalogIconDevKit")}><BookOpen className="w-3 h-3" strokeWidth={1.5} style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)" }} /></span>
          <span title={t("catalogIconDesignMd")}><FileText className="w-3 h-3" strokeWidth={1.5} style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)" }} /></span>
        </div>

        {/* Color palette strip */}
        <div className="absolute bottom-0 left-0 right-0 flex h-1.5">
          <div className="flex-1" style={{ backgroundColor: p.primary }} />
          <div className="flex-1" style={{ backgroundColor: p.secondary }} />
          <div className="flex-1" style={{ backgroundColor: p.accent }} />
          <div className="flex-1" style={{ backgroundColor: p.bg }} />
          <div className="flex-1" style={{ backgroundColor: p.text }} />
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-4">
        {/* Category badge + title */}
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block rounded-full bg-(--ditto-bg) border border-(--ditto-border) px-2 py-0.5 text-[9px] font-medium text-(--ditto-text-muted) uppercase tracking-wider">
            {t(CATEGORY_KEYS[item.category])}
          </span>
        </div>
        <h3 className="text-base font-semibold text-(--ditto-text) mb-1">
          {item.name}
        </h3>
        <p className="text-xs text-(--ditto-text-muted) leading-relaxed mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Action */}
        {item.unlocked ? (
          <a
            href={`/design/${item.slug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-(--ditto-primary) hover:underline"
          >
            <Unlock className="w-3.5 h-3.5" strokeWidth={1.5} />
            {t("catalogViewDesign")}
            <ExternalLink className="w-3 h-3 opacity-50" strokeWidth={1.5} />
          </a>
        ) : (
          <button
            onClick={onUnlock}
            disabled={unlocking || !canAfford}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-(--ditto-primary) px-3.5 py-2.5 text-sm font-medium text-(--ditto-bg) hover:bg-(--ditto-primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {unlocking ? (
              <>
                <span className="w-3 h-3 border-2 border-(--ditto-bg) border-t-transparent rounded-full animate-spin" />
                {t("catalogUnlocking")}
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                {t("catalogUnlockEverything")} &middot; {unlockCost}
                <Coins className="w-3 h-3" strokeWidth={1.5} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/** Check if a hex color is dark */
function isColorDark(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

/** Create a semi-transparent version of a color for overlays */
function mixAlpha(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

import "server-only";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { designs, designUnlocks, users } from "@/lib/db/schema";
import { eq, and, sql, inArray, isNull } from "drizzle-orm";
import { listDesignsSlim, listTrash } from "@/lib/store";
import { getQuestStatuses } from "@/lib/quests";
import { CATALOG, UNLOCK_COST } from "@/lib/catalog";
import { scoreDesignQuality } from "@/lib/quality-scorer";
import type { StoredDesign, DashboardDesignCard } from "@/lib/types";

export const DASHBOARD_PAGE_SIZE = 9;

/** Get authenticated user or null */
export async function getUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as { id: string; name: string; email: string };
}

export interface DashboardDesignsPage {
  designs: DashboardDesignCard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/** Fetch enriched, paginated designs for the dashboard. */
export async function getDashboardDesigns(
  userId: string,
  opts: { page?: number; perPage?: number } = {},
): Promise<DashboardDesignsPage> {
  const perPage = Math.max(1, Math.min(opts.perPage ?? DASHBOARD_PAGE_SIZE, 48));
  const pageRequested = Math.max(1, opts.page ?? 1);
  const offset = (pageRequested - 1) * perPage;

  const { designs: rawDesigns, total } = await listDesignsSlim(userId, {
    limit: perPage,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(pageRequested, totalPages);

  // Enrich only the fetched page — the unlock queries below are always
  // per-user but are lightweight (they touch only `designUnlocks`), so we
  // run them once even when we're on page N. Intersection is via the
  // `designSlug` map, so enrichment for the current page is still O(page).
  const unlocks = await db
    .select({
      designSlug: designUnlocks.designSlug,
      feature: designUnlocks.feature,
      totalSpent: sql<number>`cast(sum(${designUnlocks.creditsSpent}) as integer)`.as("total_spent"),
    })
    .from(designUnlocks)
    .where(eq(designUnlocks.userId, userId))
    .groupBy(designUnlocks.designSlug, designUnlocks.feature);

  const activeUnlocks = await db
    .select({
      designSlug: designUnlocks.designSlug,
      feature: designUnlocks.feature,
    })
    .from(designUnlocks)
    .where(
      sql`${designUnlocks.userId} = ${userId} AND ${designUnlocks.expiresAt} >= ${new Date()}`,
    );

  const spentMap = new Map<string, number>();
  for (const u of unlocks) {
    spentMap.set(u.designSlug, (spentMap.get(u.designSlug) ?? 0) + Number(u.totalSpent));
  }

  const activeMap = new Map<string, Set<string>>();
  for (const u of activeUnlocks) {
    if (!activeMap.has(u.designSlug)) activeMap.set(u.designSlug, new Set());
    activeMap.get(u.designSlug)!.add(u.feature);
  }

  const enriched = rawDesigns.map((d) => {
    const baseCost = d.source === "extracted" ? 100 : 50;
    const unlockSpent = spentMap.get(d.slug) ?? 0;
    const active = activeMap.get(d.slug);
    return {
      ...d,
      creditsSpent: baseCost + unlockSpent,
      unlockedFeatures: {
        devkit: active?.has("devkit") ?? false,
        complete: active?.has("complete") ?? false,
        wordpress: active?.has("wordpress") ?? false,
        elementor: active?.has("elementor") ?? false,
      },
    };
  });

  return { designs: enriched, total, page, perPage, totalPages };
}

/** Fetch trashed designs */
export async function getTrashDesigns(userId: string): Promise<StoredDesign[]> {
  const trashed = await listTrash(userId);

  const unlocks = await db
    .select({
      designSlug: designUnlocks.designSlug,
      totalSpent: sql<number>`cast(sum(${designUnlocks.creditsSpent}) as integer)`.as("total_spent"),
    })
    .from(designUnlocks)
    .where(eq(designUnlocks.userId, userId))
    .groupBy(designUnlocks.designSlug);

  const spentMap = new Map<string, number>();
  for (const u of unlocks) {
    spentMap.set(u.designSlug, Number(u.totalSpent));
  }

  return trashed.map((d) => ({
    ...d,
    creditsSpent: (d.source === "extracted" ? 100 : 50) + (spentMap.get(d.slug) ?? 0),
  }));
}

/** Fetch quest statuses + referral code */
export async function getQuestsData(userId: string) {
  const [statuses, [dbUser]] = await Promise.all([
    getQuestStatuses(userId),
    db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);

  return {
    quests: statuses,
    referralCode: dbUser?.referralCode || null,
  };
}

/** Fetch catalog with unlock status */
export async function getCatalogData(userId: string) {
  const catalogIds = CATALOG.map((e) => e.id);
  const owned = await db
    .select({ slug: designs.slug })
    .from(designs)
    .where(and(eq(designs.userId, userId), inArray(designs.slug, catalogIds)));

  const ownedSlugs = new Set(owned.map((r) => r.slug));

  const items = CATALOG.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    category: entry.category,
    preview: entry.preview,
    unlocked: ownedSlugs.has(entry.id),
    slug: ownedSlugs.has(entry.id) ? entry.id : null,
  }));

  return { items, unlockCost: UNLOCK_COST };
}

/** Fetch a single design by slug */
export async function getDesignBySlug(userId: string, slug: string) {
  const rows = await db
    .select()
    .from(designs)
    .where(and(eq(designs.userId, userId), eq(designs.slug, slug), isNull(designs.deletedAt)))
    .limit(1);

  if (rows.length === 0) return null;

  const d = rows[0];

  // Get unlock status
  const activeUnlocks = await db
    .select({ feature: designUnlocks.feature })
    .from(designUnlocks)
    .where(
      sql`${designUnlocks.userId} = ${userId} AND ${designUnlocks.designSlug} = ${slug} AND ${designUnlocks.expiresAt} >= ${new Date()}`
    );

  const features = new Set(activeUnlocks.map((u) => u.feature));

  return {
    ...d,
    source: d.source as StoredDesign["source"],
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    deletedAt: d.deletedAt?.toISOString() ?? undefined,
    quality: scoreDesignQuality(d.tokens, d.resolved),
    unlockedFeatures: {
      devkit: features.has("devkit"),
      complete: features.has("complete"),
      wordpress: features.has("wordpress"),
      elementor: features.has("elementor"),
    },
  } satisfies StoredDesign;
}

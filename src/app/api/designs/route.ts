import { NextRequest, NextResponse } from "next/server";
import { listDesigns, listDesignsSlim } from "@/lib/store";
import { getUserFromBearerOrSession, unauthorized } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { designUnlocks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const DEFAULT_PER_PAGE = 9;
const MAX_PER_PAGE = 48;

export async function GET(req: NextRequest) {
  const user = await getUserFromBearerOrSession(req);
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  const perPageParam = url.searchParams.get("perPage");
  const paginated = pageParam !== null || perPageParam !== null;

  try {
    // Shared unlock lookups (per-user, cheap).
    const unlocks = await db
      .select({
        designSlug: designUnlocks.designSlug,
        feature: designUnlocks.feature,
        totalSpent: sql<number>`cast(sum(${designUnlocks.creditsSpent}) as integer)`.as("total_spent"),
      })
      .from(designUnlocks)
      .where(eq(designUnlocks.userId, user.id))
      .groupBy(designUnlocks.designSlug, designUnlocks.feature);

    const activeUnlocks = await db
      .select({
        designSlug: designUnlocks.designSlug,
        feature: designUnlocks.feature,
      })
      .from(designUnlocks)
      .where(
        sql`${designUnlocks.userId} = ${user.id} AND ${designUnlocks.expiresAt} >= ${new Date()}`,
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

    const enrich = <T extends { slug: string; source: string }>(d: T) => {
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
          plugin: active?.has("plugin") ?? false,
          elementor: active?.has("elementor") ?? false,
        },
      };
    };

    if (paginated) {
      const perPage = Math.max(
        1,
        Math.min(parseInt(perPageParam ?? String(DEFAULT_PER_PAGE), 10) || DEFAULT_PER_PAGE, MAX_PER_PAGE),
      );
      const requestedPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
      const { designs: rawDesigns, total } = await listDesignsSlim(user.id, {
        limit: perPage,
        offset: (requestedPage - 1) * perPage,
      });
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const page = Math.min(requestedPage, totalPages);
      return NextResponse.json({
        designs: rawDesigns.map(enrich),
        total,
        page,
        perPage,
        totalPages,
      });
    }

    // Legacy full-list mode — preserved so callers like /inspire keep working.
    const designs = await listDesigns(user.id);
    return NextResponse.json(designs.map(enrich));
  } catch (error) {
    console.error("Error listing designs:", error);
    return NextResponse.json(paginated ? { designs: [], total: 0, page: 1, perPage: DEFAULT_PER_PAGE, totalPages: 1 } : [], { status: 200 });
  }
}

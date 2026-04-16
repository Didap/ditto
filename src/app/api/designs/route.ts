import { NextResponse } from "next/server";
import { listDesigns } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { designUnlocks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  try {
    const designs = await listDesigns(user.id);

    // Fetch all active unlocks for this user in one query
    const unlocks = await db
      .select({
        designSlug: designUnlocks.designSlug,
        feature: designUnlocks.feature,
        totalSpent: sql<number>`cast(sum(${designUnlocks.creditsSpent}) as integer)`.as("total_spent"),
      })
      .from(designUnlocks)
      .where(eq(designUnlocks.userId, user.id))
      .groupBy(designUnlocks.designSlug, designUnlocks.feature);

    // Active (non-expired) unlocks
    const activeUnlocks = await db
      .select({
        designSlug: designUnlocks.designSlug,
        feature: designUnlocks.feature,
      })
      .from(designUnlocks)
      .where(
        sql`${designUnlocks.userId} = ${user.id} AND ${designUnlocks.expiresAt} >= ${new Date()}`
      );

    // Build lookup maps
    const spentMap = new Map<string, number>();
    for (const u of unlocks) {
      spentMap.set(u.designSlug, (spentMap.get(u.designSlug) ?? 0) + Number(u.totalSpent));
    }

    const activeMap = new Map<string, Set<string>>();
    for (const u of activeUnlocks) {
      if (!activeMap.has(u.designSlug)) activeMap.set(u.designSlug, new Set());
      activeMap.get(u.designSlug)!.add(u.feature);
    }

    // Base cost: 100 for extracted, 50 for imported (catalog)
    const enriched = designs.map((d) => {
      const baseCost = d.source === "extracted" ? 100 : 50;
      const unlockSpent = spentMap.get(d.slug) ?? 0;
      const active = activeMap.get(d.slug);
      return {
        ...d,
        creditsSpent: baseCost + unlockSpent,
        unlockedFeatures: {
          devkit: active?.has("devkit") ?? false,
          complete: active?.has("complete") ?? false,
        },
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error listing designs:", error);
    return NextResponse.json([], { status: 200 });
  }
}

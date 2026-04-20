import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, designs, designUnlocks } from "@/lib/db/schema";
import { sql, isNull } from "drizzle-orm";
import { getAdminUser } from "@/lib/admin";
import { ApiError } from "@/lib/errors";

/**
 * GET /api/admin/users — list all users with credits, design count and total credits spent.
 * Admin-only. Designs counted exclude soft-deleted ones.
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: ApiError.FORBIDDEN }, { status: 403 });
  }

  // 1. Active design counts per user
  const designCounts = await db
    .select({
      userId: designs.userId,
      count: sql<number>`cast(count(*) as integer)`.as("count"),
    })
    .from(designs)
    .where(isNull(designs.deletedAt))
    .groupBy(designs.userId);

  // 2. Total credits spent on unlocks per user
  const unlockSpent = await db
    .select({
      userId: designUnlocks.userId,
      total: sql<number>`cast(sum(${designUnlocks.creditsSpent}) as integer)`.as("total"),
    })
    .from(designUnlocks)
    .groupBy(designUnlocks.userId);

  const designsByUser = new Map<string, number>(
    designCounts.map((r) => [r.userId, Number(r.count)])
  );
  const spentByUser = new Map<string, number>(
    unlockSpent.map((r) => [r.userId, Number(r.total)])
  );

  // 3. Users
  const all = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      credits: users.credits,
      emailVerified: users.emailVerified,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users);

  const enriched = all
    .map((u) => ({
      ...u,
      emailVerified: u.emailVerified?.toISOString() ?? null,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      designsCount: designsByUser.get(u.id) ?? 0,
      unlockCreditsSpent: spentByUser.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ users: enriched });
}

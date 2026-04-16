import { NextRequest, NextResponse } from "next/server";
import { getDesign, deleteDesign } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { ApiError } from "@/lib/errors";
import { db } from "@/lib/db";
import { designUnlocks } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const design = await getDesign(user.id, slug);

  if (!design) {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_FOUND }, { status: 404 });
  }

  // Enrich with credits spent + unlock status
  const unlockRows = await db
    .select({
      feature: designUnlocks.feature,
      totalSpent: sql<number>`cast(sum(${designUnlocks.creditsSpent}) as integer)`.as("total_spent"),
    })
    .from(designUnlocks)
    .where(
      sql`${designUnlocks.userId} = ${user.id} AND ${designUnlocks.designSlug} = ${slug}`
    )
    .groupBy(designUnlocks.feature);

  const activeUnlocks = await db
    .select({ feature: designUnlocks.feature })
    .from(designUnlocks)
    .where(
      sql`${designUnlocks.userId} = ${user.id} AND ${designUnlocks.designSlug} = ${slug} AND ${designUnlocks.expiresAt} >= ${new Date()}`
    );

  const unlockSpent = unlockRows.reduce((sum, r) => sum + Number(r.totalSpent), 0);
  const baseCost = design.source === "extracted" ? 100 : 50;
  const activeSet = new Set(activeUnlocks.map((r) => r.feature));

  return NextResponse.json({
    ...design,
    creditsSpent: baseCost + unlockSpent,
    unlockedFeatures: {
      devkit: activeSet.has("devkit"),
      complete: activeSet.has("complete"),
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const deleted = await deleteDesign(user.id, slug);

  if (!deleted) {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_FOUND }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

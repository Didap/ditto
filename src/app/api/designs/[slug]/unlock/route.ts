import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { users, designs, designUnlocks } from "@/lib/db/schema";
import { eq, and, gte, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ApiError, insufficientCredits } from "@/lib/errors";
import { trackServer } from "@/lib/analytics/posthog-server";
import { EVENTS } from "@/lib/analytics/events";

type Feature =
  | "devkit"
  | "complete"
  | "wordpress"
  | "elementor";
const FEATURE_COST: Record<Feature, number> = {
  devkit: 50,
  complete: 100,
  wordpress: 50,
  elementor: 50,
};
function isValidFeature(f: string): f is Feature {
  return (
    f === "devkit" ||
    f === "complete" ||
    f === "wordpress" ||
    f === "elementor"
  );
}

/** Find an existing unlock for a user+design+feature (no expiry check — permanent) */
async function getUnlock(userId: string, designId: string, feature: string) {
  const [row] = await db
    .select()
    .from(designUnlocks)
    .where(
      and(
        eq(designUnlocks.userId, userId),
        eq(designUnlocks.designId, designId),
        eq(designUnlocks.feature, feature)
      )
    )
    .limit(1);
  return row ?? null;
}

/** Resolve a user-scoped slug to a design id (active designs only). */
async function resolveDesignId(userId: string, slug: string): Promise<string | null> {
  const [row] = await db
    .select({ id: designs.id })
    .from(designs)
    .where(
      and(eq(designs.userId, userId), eq(designs.slug, slug), isNull(designs.deletedAt))
    )
    .limit(1);
  return row?.id ?? null;
}

/** GET — check unlock status for a design (both features) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const designId = await resolveDesignId(user.id, slug);
  if (!designId) {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_FOUND }, { status: 404 });
  }

  const [devkit, complete, wordpress, elementor] =
    await Promise.all([
      getUnlock(user.id, designId, "devkit"),
      getUnlock(user.id, designId, "complete"),
      getUnlock(user.id, designId, "wordpress"),
      getUnlock(user.id, designId, "elementor"),
    ]);

  return NextResponse.json({
    devkit: devkit
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST.devkit },
    complete: complete
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST.complete },
    wordpress: wordpress
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST.wordpress },
    elementor: elementor
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST.elementor },
  });
}

/** POST — purchase an unlock (devkit or complete) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const { feature } = await req.json();

  if (!feature || !isValidFeature(feature)) {
    return NextResponse.json(
      { error: ApiError.INVALID_FEATURE },
      { status: 400 }
    );
  }

  const designId = await resolveDesignId(user.id, slug);
  if (!designId) {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_FOUND }, { status: 404 });
  }

  // Already unlocked?
  const existing = await getUnlock(user.id, designId, feature);
  if (existing) {
    return NextResponse.json(
      { error: ApiError.FEATURE_ALREADY_UNLOCKED },
      { status: 409 }
    );
  }

  const cost = FEATURE_COST[feature];

  // Atomic deduct with WHERE guard
  const deductResult = await db
    .update(users)
    .set({ credits: sql`${users.credits} - ${cost}` })
    .where(and(eq(users.id, user.id), gte(users.credits, cost)));

  if ((deductResult.rowCount ?? 0) === 0) {
    const [dbUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    trackServer(user.id, EVENTS.CREDITS_DEPLETED, {
      required: cost,
      available: dbUser?.credits ?? 0,
      context: `unlock:${feature}`,
    });
    return NextResponse.json(
      { error: insufficientCredits(cost, dbUser?.credits ?? 0) },
      { status: 402 }
    );
  }

  // Credits deducted — record the unlock (permanent, far-future expiry)
  const expiresAt = new Date("2099-12-31T23:59:59Z");

  try {
    await db.insert(designUnlocks).values({
      id: nanoid(),
      userId: user.id,
      designId,
      feature,
      creditsSpent: cost,
      expiresAt,
    });

    trackServer(user.id, EVENTS.DESIGN_UNLOCKED, {
      slug,
      feature,
      cost,
    });

    // No email on credit spend — only Stripe subscription purchases trigger mail.
    return NextResponse.json({
      unlocked: true,
      creditsSpent: cost,
    });
  } catch {
    // Refund on failure
    await db
      .update(users)
      .set({ credits: sql`${users.credits} + ${cost}` })
      .where(eq(users.id, user.id));

    return NextResponse.json(
      { error: ApiError.SAVE_FAILED },
      { status: 500 }
    );
  }
}

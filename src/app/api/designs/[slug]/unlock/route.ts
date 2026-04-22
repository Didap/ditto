import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { users, designUnlocks } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ApiError, insufficientCredits } from "@/lib/errors";
import { sendPurchaseEmail } from "@/lib/email";

type Feature =
  | "devkit"
  | "complete"
  | "wordpress"
  | "plugin"
  | "elementor"
  | "wp-bundle";
const FEATURE_COST: Record<Feature, number> = {
  devkit: 50,
  complete: 100,
  wordpress: 50,
  plugin: 50,
  elementor: 50,
  "wp-bundle": 100,
};
const FEATURE_LABEL: Record<Feature, string> = {
  devkit: "Dev Kit",
  complete: "Complete Kit",
  wordpress: "WordPress Theme",
  plugin: "WordPress Plugin",
  elementor: "Elementor Kit",
  "wp-bundle": "WordPress Pack",
};

function isValidFeature(f: string): f is Feature {
  return (
    f === "devkit" ||
    f === "complete" ||
    f === "wordpress" ||
    f === "plugin" ||
    f === "elementor" ||
    f === "wp-bundle"
  );
}

/** Find an existing unlock for a user+slug+feature (no expiry check — permanent) */
async function getUnlock(userId: string, designSlug: string, feature: string) {
  const [row] = await db
    .select()
    .from(designUnlocks)
    .where(
      and(
        eq(designUnlocks.userId, userId),
        eq(designUnlocks.designSlug, designSlug),
        eq(designUnlocks.feature, feature)
      )
    )
    .limit(1);
  return row ?? null;
}

/** GET — check unlock status for a design (both features) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;

  const [devkit, complete, wordpress, plugin, elementor, wpBundle] =
    await Promise.all([
      getUnlock(user.id, slug, "devkit"),
      getUnlock(user.id, slug, "complete"),
      getUnlock(user.id, slug, "wordpress"),
      getUnlock(user.id, slug, "plugin"),
      getUnlock(user.id, slug, "elementor"),
      getUnlock(user.id, slug, "wp-bundle"),
    ]);

  // wp-bundle grants access to all three WordPress features.
  const hasBundle = Boolean(wpBundle);

  return NextResponse.json({
    devkit: devkit
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST.devkit },
    complete: complete
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST.complete },
    wordpress: wordpress || hasBundle
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST.wordpress },
    plugin: plugin || hasBundle
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST.plugin },
    elementor: elementor || hasBundle
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST.elementor },
    wpBundle: hasBundle
      ? { unlocked: true }
      : { unlocked: false, cost: FEATURE_COST["wp-bundle"] },
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

  // Already unlocked?
  const existing = await getUnlock(user.id, slug, feature);
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
      designSlug: slug,
      feature,
      creditsSpent: cost,
      expiresAt,
    });

    // Send purchase confirmation email
    const [dbUser] = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const featureLabel = FEATURE_LABEL[feature];
    sendPurchaseEmail(user.email, user.name, {
      type: feature,
      designName: `${slug} — ${featureLabel}`,
      creditsSpent: cost,
      creditsRemaining: dbUser?.credits ?? 0,
    }).catch(() => {}); // fire-and-forget

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

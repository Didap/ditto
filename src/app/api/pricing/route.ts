import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pricing } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { detectRegion, isLaunchActive, LAUNCH_DISCOUNT } from "@/lib/regions";

/** GET /api/pricing — public, returns plans + packs with regional prices */
export async function GET(req: NextRequest) {
  const region = detectRegion(req.headers);
  const launch = isLaunchActive();

  const rows = await db
    .select()
    .from(pricing)
    .where(eq(pricing.active, 1))
    .orderBy(asc(pricing.sortOrder));

  const mapRow = (r: typeof rows[number]) => {
    const regional = r.stripePrices?.[region];
    const amount = regional?.amount ?? r.priceUsd;
    const currency = regional?.currency ?? "usd";
    const priceId = regional?.priceId ?? r.stripePriceId;
    const launchAmount = amount > 0 && launch
      ? Math.round(amount * (1 - LAUNCH_DISCOUNT))
      : amount;

    return {
      id: r.id,
      type: r.type,
      name: r.name,
      credits: r.credits,
      price: amount,
      launchPrice: launchAmount,
      currency,
      stripePriceId: priceId,
      sortOrder: r.sortOrder,
      isLaunch: launch,
    };
  };

  const plans = rows.filter((r) => r.type === "plan").map(mapRow);
  const packs = rows.filter((r) => r.type === "pack").map(mapRow);

  return NextResponse.json({ plans, packs, region, isLaunch: launch });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pricing } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

/** GET /api/pricing — public, returns plans + packs from DB */
export async function GET() {
  const rows = await db
    .select()
    .from(pricing)
    .where(eq(pricing.active, 1))
    .orderBy(asc(pricing.sortOrder));

  const plans = rows.filter((r) => r.type === "plan");
  const packs = rows.filter((r) => r.type === "pack");

  return NextResponse.json({ plans, packs });
}

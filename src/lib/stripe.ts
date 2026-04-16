import Stripe from "stripe";
import { db } from "@/lib/db";
import { pricing } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/** Get all valid Stripe price IDs from the DB */
export async function getValidPriceIds(): Promise<string[]> {
  const rows = await db
    .select({ stripePriceId: pricing.stripePriceId })
    .from(pricing)
    .where(eq(pricing.active, 1));

  return rows
    .map((r) => r.stripePriceId)
    .filter((id): id is string => id !== null);
}

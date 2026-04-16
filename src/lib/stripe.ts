import Stripe from "stripe";
import { db } from "@/lib/db";
import { pricing } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/** Get all valid Stripe price IDs from the DB (including regional) */
export async function getValidPriceIds(): Promise<string[]> {
  const rows = await db
    .select({ stripePriceId: pricing.stripePriceId, stripePrices: pricing.stripePrices })
    .from(pricing)
    .where(eq(pricing.active, 1));

  const ids: string[] = [];
  for (const r of rows) {
    if (r.stripePriceId) ids.push(r.stripePriceId);
    if (r.stripePrices) {
      for (const rp of Object.values(r.stripePrices)) {
        if (rp.priceId) ids.push(rp.priceId);
      }
    }
  }
  return ids;
}

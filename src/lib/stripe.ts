import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/* ── Valid price IDs cache (5 min) ─────────────────────────── */
let _validIds: string[] | null = null;
let _validAt = 0;
const VALID_TTL = 5 * 60 * 1000;

/** Get all valid Stripe price IDs (active prices with region metadata) */
export async function getValidPriceIds(): Promise<string[]> {
  if (_validIds && Date.now() - _validAt < VALID_TTL) return _validIds;

  const prices = await stripe.prices.list({ active: true, limit: 100 });
  _validIds = prices.data
    .filter((p) => p.metadata.region)
    .map((p) => p.id);
  _validAt = Date.now();
  return _validIds;
}

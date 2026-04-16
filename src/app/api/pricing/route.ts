import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { detectRegion, isLaunchActive, LAUNCH_DISCOUNT } from "@/lib/regions";

/* ── In-memory cache (5 min TTL) ────────────────────────────── */
let _cache: { plans: StripeItem[]; packs: StripeItem[] } | null = null;
let _cacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

interface RegionPrice {
  priceId: string;
  amount: number;
  currency: string;
  region: string;
}

interface StripeItem {
  id: string;
  type: string;
  name: string;
  credits: number;
  sortOrder: number;
  prices: RegionPrice[];
}

async function fetchStripeData() {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL) return _cache;

  const [products, prices] = await Promise.all([
    stripe.products.list({ active: true, limit: 100 }),
    stripe.prices.list({ active: true, limit: 100 }),
  ]);

  // Only products tagged with ditto metadata
  const dittoProducts = products.data.filter((p) => p.metadata.ditto_id);

  // Group prices by product, only those with region metadata
  const pricesByProduct = new Map<string, RegionPrice[]>();
  for (const p of prices.data) {
    if (!p.metadata.region) continue;
    const prodId = typeof p.product === "string" ? p.product : p.product.id;
    const arr = pricesByProduct.get(prodId) ?? [];
    arr.push({
      priceId: p.id,
      amount: p.unit_amount ?? 0,
      currency: p.currency,
      region: p.metadata.region,
    });
    pricesByProduct.set(prodId, arr);
  }

  const plans: StripeItem[] = [];
  const packs: StripeItem[] = [];

  for (const prod of dittoProducts) {
    const item: StripeItem = {
      id: prod.metadata.ditto_id,
      type: prod.metadata.ditto_type ?? "plan",
      name: prod.name,
      credits: parseInt(prod.metadata.ditto_credits ?? "0", 10),
      sortOrder: parseInt(prod.metadata.ditto_sort ?? "0", 10),
      prices: pricesByProduct.get(prod.id) ?? [],
    };
    (item.type === "plan" ? plans : packs).push(item);
  }

  plans.sort((a, b) => a.sortOrder - b.sortOrder);
  packs.sort((a, b) => a.sortOrder - b.sortOrder);

  _cache = { plans, packs };
  _cacheAt = Date.now();
  return _cache;
}

/** GET /api/pricing — public, returns plans + packs with live Stripe prices */
export async function GET(req: NextRequest) {
  const region = detectRegion(req.headers);
  const launch = isLaunchActive();
  const { plans: stripePlans, packs: stripePacks } = await fetchStripeData();

  const pickPrice = (item: StripeItem) => {
    return (
      item.prices.find((p) => p.region === region) ??
      item.prices.find((p) => p.region === "us") ??
      item.prices[0]
    );
  };

  const mapItem = (item: StripeItem) => {
    const price = pickPrice(item);
    if (!price) return null;
    const launchAmount =
      price.amount > 0 && launch
        ? Math.round(price.amount * (1 - LAUNCH_DISCOUNT))
        : price.amount;

    return {
      id: item.id,
      type: item.type,
      name: item.name,
      credits: item.credits,
      price: price.amount,
      launchPrice: launchAmount,
      currency: price.currency,
      stripePriceId: price.priceId,
      sortOrder: item.sortOrder,
      isLaunch: launch,
    };
  };

  // Free plan (no Stripe product)
  const freePlan = {
    id: "free",
    type: "plan",
    name: "Free",
    credits: 300,
    price: 0,
    launchPrice: 0,
    currency: region === "us" ? "usd" : "eur",
    stripePriceId: null,
    sortOrder: 0,
    isLaunch: launch,
  };

  const plans = [freePlan, ...stripePlans.map(mapItem).filter(Boolean)];
  const packs = stripePacks.map(mapItem).filter(Boolean);

  return NextResponse.json({ plans, packs, region, isLaunch: launch });
}

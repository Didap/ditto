import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

// ── Pricing configuration ──

export const LAUNCH_DISCOUNT = 0.30; // 30% off during launch

export const PLANS = {
  free: {
    name: "Free",
    credits: 300,
    priceUsd: 0,
    launchPriceUsd: 0,
    stripePriceId: null,
  },
  pro: {
    name: "Pro",
    credits: 1500,
    priceUsd: 900, // $9.00 in cents
    launchPriceUsd: 630, // $6.30 in cents
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  team: {
    name: "Team",
    credits: 5000,
    priceUsd: 2900, // $29.00 in cents
    launchPriceUsd: 2030, // $20.30 in cents
    stripePriceId: process.env.STRIPE_TEAM_PRICE_ID || null,
  },
};

export const CREDIT_PACKS = [
  {
    id: "pack-500",
    credits: 500,
    priceUsd: 500,
    launchPriceUsd: 350,
    stripePriceId: process.env.STRIPE_PACK_500_PRICE_ID || null,
  },
  {
    id: "pack-2000",
    credits: 2000,
    priceUsd: 1900,
    launchPriceUsd: 1330,
    stripePriceId: process.env.STRIPE_PACK_2000_PRICE_ID || null,
  },
  {
    id: "pack-5000",
    credits: 5000,
    priceUsd: 4500,
    launchPriceUsd: 3150,
    stripePriceId: process.env.STRIPE_PACK_5000_PRICE_ID || null,
  },
];

export type PlanId = keyof typeof PLANS;

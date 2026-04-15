/**
 * One-time script to create Stripe products and prices.
 * Run with: npx tsx scripts/stripe-setup.ts
 *
 * Outputs the price IDs to paste into src/lib/stripe.ts
 */

import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function main() {
  console.log("Creating Stripe products and prices for Ditto...\n");

  // ── Subscription Products ──

  const proProduct = await stripe.products.create({
    name: "Ditto Pro",
    description: "1500 credits/month — for freelancers and individual designers",
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 630, // $6.30 (launch -30%)
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan: "pro", credits: "1500", launch: "true" },
  });

  const teamProduct = await stripe.products.create({
    name: "Ditto Team",
    description: "5000 credits/month — for teams and agencies",
  });

  const teamPrice = await stripe.prices.create({
    product: teamProduct.id,
    unit_amount: 2030, // $20.30 (launch -30%)
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan: "team", credits: "5000", launch: "true" },
  });

  // ── Credit Packs (one-time) ──

  const packsProduct = await stripe.products.create({
    name: "Ditto Credits",
    description: "Extra credit packs for Ditto",
  });

  const pack500 = await stripe.prices.create({
    product: packsProduct.id,
    unit_amount: 350, // $3.50 (launch -30%)
    currency: "usd",
    metadata: { pack: "500", credits: "500", launch: "true" },
  });

  const pack2000 = await stripe.prices.create({
    product: packsProduct.id,
    unit_amount: 1330, // $13.30 (launch -30%)
    currency: "usd",
    metadata: { pack: "2000", credits: "2000", launch: "true" },
  });

  const pack5000 = await stripe.prices.create({
    product: packsProduct.id,
    unit_amount: 3150, // $31.50 (launch -30%)
    currency: "usd",
    metadata: { pack: "5000", credits: "5000", launch: "true" },
  });

  // ── Output ──

  console.log("✓ Products and prices created!\n");
  console.log("Add these to your .env.local:\n");
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
  console.log(`STRIPE_TEAM_PRICE_ID=${teamPrice.id}`);
  console.log(`STRIPE_PACK_500_PRICE_ID=${pack500.id}`);
  console.log(`STRIPE_PACK_2000_PRICE_ID=${pack2000.id}`);
  console.log(`STRIPE_PACK_5000_PRICE_ID=${pack5000.id}`);
  console.log(`\nProduct IDs:`);
  console.log(`  Pro: ${proProduct.id}`);
  console.log(`  Team: ${teamProduct.id}`);
  console.log(`  Packs: ${packsProduct.id}`);
}

main().catch(console.error);

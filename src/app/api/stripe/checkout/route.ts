import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { stripe, getValidPriceIds } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/errors";
import { isLaunchActive, LAUNCH_COUPON_ID } from "@/lib/regions";

export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { priceId, mode } = await req.json();

  if (!priceId) {
    return NextResponse.json({ error: ApiError.PRICE_ID_REQUIRED }, { status: 400 });
  }

  // Validate against DB (includes regional prices)
  const validPrices = await getValidPriceIds();
  if (!validPrices.includes(priceId)) {
    return NextResponse.json({ error: ApiError.INVALID_PRICE }, { status: 400 });
  }

  // Get or create Stripe customer
  const [dbUser] = await db
    .select({ stripeCustomerId: users.stripeCustomerId, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  let customerId = dbUser?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: dbUser.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, user.id));
  }

  const isSubscription = mode === "subscription";
  const origin = req.headers.get("origin") || "http://localhost:3000";
  const launch = isLaunchActive();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isSubscription ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: { userId: user.id },
    // Apply launch coupon if promo is still active
    ...(launch ? { discounts: [{ coupon: LAUNCH_COUPON_ID }] } : {}),
    ...(isSubscription ? { subscription_data: { metadata: { userId: user.id } } } : {}),
    ...(isSubscription ? {} : { payment_intent_data: { metadata: { userId: user.id } } }),
  });

  return NextResponse.json({ url: session.url });
}

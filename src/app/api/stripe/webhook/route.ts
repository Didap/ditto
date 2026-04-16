import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ApiError } from "@/lib/errors";
import { db } from "@/lib/db";
import { users, pricing } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: ApiError.INVALID_SIGNATURE }, { status: 400 });
  }

  // Helper: look up a pricing row by Stripe price ID
  async function findPricing(priceId: string) {
    const [row] = await db
      .select()
      .from(pricing)
      .where(eq(pricing.stripePriceId, priceId))
      .limit(1);
    return row ?? null;
  }

  switch (event.type) {
    // ── Checkout completed (one-time pack purchase) ──
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "payment") {
        const userId = session.metadata?.userId;
        if (!userId) break;

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        if (!priceId) break;

        const pack = await findPricing(priceId);
        if (pack && pack.type === "pack") {
          await db
            .update(users)
            .set({ credits: sql`${users.credits} + ${pack.credits}` })
            .where(eq(users.id, userId));
          console.log(`[stripe] Added ${pack.credits} credits to user ${userId}`);
        }
      }
      break;
    }

    // ── Subscription invoice paid (initial + recurring) ──
    case "invoice.paid": {
      const invoice = event.data.object;
      const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | null;
      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      const priceId = subscription.items.data[0]?.price?.id;
      if (!priceId) break;

      const plan = await findPricing(priceId);
      if (plan && plan.type === "plan") {
        await db
          .update(users)
          .set({
            plan: plan.id,
            stripeSubscriptionId: subscriptionId,
            credits: sql`${users.credits} + ${plan.credits}`,
          })
          .where(eq(users.id, userId));
        console.log(`[stripe] User ${userId} → ${plan.id} plan, +${plan.credits} credits`);
      }
      break;
    }

    // ── Subscription cancelled/expired ──
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      await db
        .update(users)
        .set({
          plan: "free",
          stripeSubscriptionId: null,
        })
        .where(eq(users.id, userId));
      console.log(`[stripe] User ${userId} → free plan (subscription cancelled)`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

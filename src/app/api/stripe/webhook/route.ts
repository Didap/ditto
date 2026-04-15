import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, CREDIT_PACKS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // ── Checkout completed (one-time pack purchase) ──
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "payment") {
        const userId = session.metadata?.userId;
        if (!userId) break;

        // Find which pack was bought by looking up the line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        const pack = CREDIT_PACKS.find((p) => p.stripePriceId === priceId);

        if (pack) {
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
      const subscriptionId = (invoice as any).subscription as string | null;
      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      // Determine plan from price
      const priceId = subscription.items.data[0]?.price?.id;
      let plan: "pro" | "team" | null = null;
      let credits = 0;

      if (priceId === PLANS.pro.stripePriceId) {
        plan = "pro";
        credits = PLANS.pro.credits;
      } else if (priceId === PLANS.team.stripePriceId) {
        plan = "team";
        credits = PLANS.team.credits;
      }

      if (plan) {
        await db
          .update(users)
          .set({
            plan,
            stripeSubscriptionId: subscriptionId,
            credits: sql`${users.credits} + ${credits}`,
          })
          .where(eq(users.id, userId));
        console.log(`[stripe] User ${userId} → ${plan} plan, +${credits} credits`);
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

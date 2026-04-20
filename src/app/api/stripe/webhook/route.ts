import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ApiError } from "@/lib/errors";
import { db } from "@/lib/db";
import { users, pricing } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendStripePurchaseEmail } from "@/lib/email";
import type { Locale } from "@/lib/i18n";

const VALID_LOCALES = new Set<string>(["en", "it", "fr", "es"]);
function parseLocale(raw: string | null | undefined): Locale {
  return raw && VALID_LOCALES.has(raw) ? (raw as Locale) : "en";
}

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

  async function findUser(userId: string) {
    const [row] = await db
      .select({ email: users.email, name: users.name, credits: users.credits })
      .from(users)
      .where(eq(users.id, userId))
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

          // Thank-you email — don't fail the webhook if delivery is flaky
          const dbUser = await findUser(userId);
          if (dbUser) {
            const locale = parseLocale(session.metadata?.locale);
            sendStripePurchaseEmail(dbUser.email, dbUser.name, {
              kind: "pack",
              productName: pack.name,
              credits: pack.credits,
              amountCents: session.amount_total ?? 0,
              currency: session.currency ?? "usd",
              balanceAfter: dbUser.credits + pack.credits,
              locale,
            }).catch((e) => console.error("[stripe] pack email failed:", e));
          }
        }
      }
      break;
    }

    // ── Subscription invoice paid (initial + recurring) ──
    case "invoice.paid": {
      const invoice = event.data.object;
      const invoiceRaw = invoice as unknown as Record<string, unknown>;
      const subscriptionId = invoiceRaw.subscription as string | null;
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

        // Thank-you email only on first activation (not recurring renewals —
        // Stripe already sends its own receipt on every payment).
        const billingReason = invoiceRaw.billing_reason as string | undefined;
        if (billingReason === "subscription_create") {
          const dbUser = await findUser(userId);
          if (dbUser) {
            const locale = parseLocale(subscription.metadata?.locale);
            const amountPaid = (invoiceRaw.amount_paid as number | undefined) ?? 0;
            const currency = (invoiceRaw.currency as string | undefined) ?? "usd";
            sendStripePurchaseEmail(dbUser.email, dbUser.name, {
              kind: "plan",
              productName: plan.name,
              credits: plan.credits,
              amountCents: amountPaid,
              currency,
              balanceAfter: dbUser.credits + plan.credits,
              locale,
            }).catch((e) => console.error("[stripe] plan email failed:", e));
          }
        }
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

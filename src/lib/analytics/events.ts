/**
 * Central event registry. Every tracked event flows through here — if it's not
 * declared in this file, we don't send it. Keeps the schema tight and avoids
 * typos/drift between client and server emissions.
 *
 * When adding a new event:
 *   1. Add the key + a short description here
 *   2. Update the `EventPayload` map with its property shape
 *   3. Emit via `track()` or `trackServer()` — both type-check against this map
 */

export const EVENTS = {
  EXTRACT_STARTED: "extract_started",
  EXTRACT_COMPLETED: "extract_completed",
  EXTRACT_FAILED: "extract_failed",
  DESIGN_UNLOCKED: "design_unlocked",
  CATALOG_UNLOCKED: "catalog_unlocked",
  QUEST_CLAIMED: "quest_claimed",
  STRIPE_CHECKOUT_OPENED: "stripe_checkout_opened",
  CREDITS_DEPLETED: "credits_depleted",
  CONSENT_GRANTED: "consent_granted",
  CONSENT_DENIED: "consent_denied",
  USER_SIGNED_UP: "user_signed_up",
  PAYMENT_COMPLETED: "payment_completed",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  HYBRID_GENERATED: "hybrid_generated",
  DESIGN_SAVED: "design_saved",
  BOOST_APPLIED: "boost_applied",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

export interface EventPayload {
  [EVENTS.EXTRACT_STARTED]: { source: "url" | "inspire" | "catalog"; url?: string };
  [EVENTS.EXTRACT_COMPLETED]: { slug: string; quality?: number; durationMs?: number };
  [EVENTS.EXTRACT_FAILED]: { reason: string; url?: string };
  [EVENTS.DESIGN_UNLOCKED]: {
    slug: string;
    feature:
      | "devkit"
      | "complete"
      | "wordpress"
      | "plugin"
      | "elementor"
      | "wp-bundle";
    cost: number;
  };
  [EVENTS.CATALOG_UNLOCKED]: { slug: string; cost: number };
  [EVENTS.QUEST_CLAIMED]: { questId: string; credits: number };
  [EVENTS.STRIPE_CHECKOUT_OPENED]: { plan: string; priceId: string };
  [EVENTS.CREDITS_DEPLETED]: { required: number; available: number; context: string };
  [EVENTS.CONSENT_GRANTED]: Record<string, never>;
  [EVENTS.CONSENT_DENIED]: Record<string, never>;
  [EVENTS.USER_SIGNED_UP]: { hasReferral: boolean };
  [EVENTS.PAYMENT_COMPLETED]: { priceId: string; credits: number; amountCents: number; currency: string };
  [EVENTS.SUBSCRIPTION_ACTIVATED]: { priceId: string; planId: string; credits: number; amountCents: number; currency: string };
  [EVENTS.SUBSCRIPTION_CANCELLED]: { subscriptionId: string };
  [EVENTS.HYBRID_GENERATED]: { inspirationCount: number; slug: string };
  [EVENTS.DESIGN_SAVED]: { slug: string; source: string };
  [EVENTS.BOOST_APPLIED]: { slug: string; before: number; after: number; pointsGained: number; creditsCharged: number };
}

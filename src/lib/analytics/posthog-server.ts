import "server-only";
import { PostHog } from "posthog-node";
import type { EventName, EventPayload } from "./events";

/**
 * Server-side PostHog. Used from API routes to capture events that happen
 * entirely on the backend (Stripe webhook, successful extraction, unlock).
 *
 * One singleton per server process — `posthog-node` batches internally and
 * flushes in the background. We fire-and-forget + swallow errors, so analytics
 * outages never break the real user flow.
 */

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  if (!key) return null;
  client = new PostHog(key, {
    host,
    flushAt: 20,
    flushInterval: 10_000,
  });
  return client;
}

export function trackServer<K extends EventName>(
  userId: string | null,
  event: K,
  payload: EventPayload[K],
) {
  const c = getClient();
  if (!c) return;
  // `distinctId` of "anonymous-*" when we don't have a user yet — keeps events
  // from unauthenticated flows (extractions via bearer token) identifiable.
  const distinctId = userId ?? "anonymous-server";
  try {
    c.capture({
      distinctId,
      event,
      properties: payload as Record<string, unknown>,
    });
  } catch {
    /* silent — never block the request on analytics */
  }
}

export function identifyServer(
  userId: string,
  traits?: { email?: string; name?: string; plan?: string },
) {
  const c = getClient();
  if (!c || !traits) return;
  try {
    c.identify({ distinctId: userId, properties: traits });
  } catch {
    /* silent */
  }
}

/** Optional graceful shutdown — call on long-lived processes. */
export async function shutdownPostHog() {
  if (client) {
    try {
      await client.shutdown();
    } catch {
      /* silent */
    }
    client = null;
  }
}

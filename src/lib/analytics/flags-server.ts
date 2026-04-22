import "server-only";
import { PostHog } from "posthog-node";

/**
 * Server-side feature flag helper. Reuses a singleton `posthog-node` client
 * (cheap to reuse — `isFeatureEnabled` caches internally) and always returns a
 * boolean: falls back to `fallback` if the key/user combo can't be resolved.
 */

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  if (!key) return null;
  client = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
  return client;
}

export async function serverFlag(
  flagKey: string,
  distinctId: string,
  fallback = false,
): Promise<boolean> {
  const c = getClient();
  if (!c) return fallback;
  try {
    const v = await c.isFeatureEnabled(flagKey, distinctId);
    return typeof v === "boolean" ? v : fallback;
  } catch {
    return fallback;
  }
}

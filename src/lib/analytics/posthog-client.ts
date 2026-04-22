/**
 * Client-side PostHog wrapper. Provides a thin, type-safe surface over the
 * upstream SDK plus two guardrails:
 *
 *   1. `track()` only fires if the user granted analytics consent.
 *   2. Events are declared in `events.ts` — TypeScript enforces the payload
 *      shape, so typos and stale names are caught at compile time.
 *
 * The SDK itself is initialised lazily (in `PostHogProvider`) once consent is
 * granted, so unconsented users never load the tracking JS.
 */

"use client";

import posthog from "posthog-js";
import type { EventName, EventPayload } from "./events";
import { getConsent } from "./consent";

/** Was the SDK successfully initialized in this tab? */
let initialized = false;

export function isPostHogReady(): boolean {
  return initialized;
}

export function initPostHog() {
  if (initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
  if (!key || typeof window === "undefined") return;

  posthog.init(key, {
    api_host: host,
    // We use pageview tracking manually in the provider; autocapture is off.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    // Persisted in localStorage — we already sync consent with PostHog's
    // opt-in state, so no extra cookie is needed.
    persistence: "localStorage+cookie",
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-private]",
    },
    // Respect DNT by default — user can still grant consent explicitly.
    respect_dnt: true,
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug(false);
    },
  });
  initialized = true;
}

export function identify(
  userId: string,
  traits?: { email?: string; name?: string; plan?: string },
) {
  if (!initialized) return;
  posthog.identify(userId, traits ?? {});
}

export function resetIdentity() {
  if (!initialized) return;
  posthog.reset();
}

export function track<K extends EventName>(event: K, payload: EventPayload[K]) {
  if (!initialized) return;
  if (getConsent() !== "granted") return;
  posthog.capture(event, payload as Record<string, unknown>);
}

export function capturePageview(pathname: string, search?: string) {
  if (!initialized) return;
  if (getConsent() !== "granted") return;
  posthog.capture("$pageview", {
    $current_url:
      typeof window !== "undefined" ? window.location.origin + pathname + (search ?? "") : pathname,
  });
}

/** Feature flags (client) — returns null while SDK is warming up. */
export function getFlag(key: string): boolean | string | null {
  if (!initialized) return null;
  const v = posthog.getFeatureFlag(key);
  if (v === undefined) return null;
  return v;
}

export function onFlagsLoaded(cb: () => void) {
  if (!initialized) return;
  posthog.onFeatureFlags(cb);
}

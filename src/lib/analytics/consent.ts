/**
 * Lightweight GDPR analytics consent state.
 *
 * Persisted in `localStorage` under `ditto-analytics-consent`:
 *   - "granted"  → user opted in; PostHog captures freely
 *   - "denied"   → user opted out; PostHog skips capture
 *   -  missing   → no decision yet; show the banner
 *
 * We deliberately keep this to a single category ("analytics") rather than
 * offering a full category grid — simpler UX, covers what we ship today,
 * easy to extend later if we add marketing pixels.
 */

"use client";

import { useSyncExternalStore } from "react";

export const CONSENT_KEY = "ditto-analytics-consent";

export type ConsentStatus = "granted" | "denied" | "pending";

type Listener = () => void;

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

function read(): ConsentStatus {
  if (typeof window === "undefined") return "pending";
  const v = localStorage.getItem(CONSENT_KEY);
  if (v === "granted" || v === "denied") return v;
  return "pending";
}

export function getConsent(): ConsentStatus {
  return read();
}

export function setConsent(next: ConsentStatus) {
  if (typeof window === "undefined") return;
  if (next === "pending") {
    localStorage.removeItem(CONSENT_KEY);
  } else {
    localStorage.setItem(CONSENT_KEY, next);
  }
  // Notify same-tab subscribers
  emit();
  // And other tabs — 'storage' doesn't fire in the originating tab.
  window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY }));
}

function subscribe(cb: Listener) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY || e.key === null) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** React hook — returns the current consent state, reactive to changes. */
export function useConsent(): ConsentStatus {
  return useSyncExternalStore(
    subscribe,
    read,
    () => "pending" as ConsentStatus, // SSR snapshot
  );
}

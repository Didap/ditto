"use client";

/**
 * Mounts PostHog once consent is granted and keeps identity + pageviews in
 * sync. Three responsibilities:
 *
 *   1. Lazy init — the SDK is only loaded after the user opts in, so anyone
 *      who refuses consent never fetches the tracking JS.
 *   2. Identify/reset — ties events to `users.id` when logged in, resets on
 *      logout so shared machines don't leak events across accounts.
 *   3. Manual pageview tracking — Next.js App Router doesn't fire a pageview
 *      on client navigation, so we capture one per pathname change.
 */

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  initPostHog,
  identify,
  resetIdentity,
  capturePageview,
  isPostHogReady,
} from "@/lib/analytics/posthog-client";
import { useConsent } from "@/lib/analytics/consent";

interface Props {
  user: { id: string; email: string; name: string } | null;
}

export function PostHogProvider({ user }: Props) {
  const consent = useConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastIdentifiedRef = useRef<string | null>(null);

  // Step 1: initialise once consent is granted.
  useEffect(() => {
    if (consent !== "granted") return;
    initPostHog();
  }, [consent]);

  // Step 2: identify / reset on user change.
  useEffect(() => {
    if (consent !== "granted" || !isPostHogReady()) return;
    if (user?.id && lastIdentifiedRef.current !== user.id) {
      identify(user.id, { email: user.email, name: user.name });
      lastIdentifiedRef.current = user.id;
    } else if (!user?.id && lastIdentifiedRef.current) {
      resetIdentity();
      lastIdentifiedRef.current = null;
    }
  }, [consent, user]);

  // Step 3: pageview on pathname/query change.
  useEffect(() => {
    if (consent !== "granted") return;
    capturePageview(pathname, searchParams?.toString() ? `?${searchParams.toString()}` : "");
  }, [consent, pathname, searchParams]);

  return null;
}

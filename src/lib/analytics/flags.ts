/**
 * Feature flag helpers — thin wrappers around PostHog's flag APIs.
 *
 * Client (`useFlag`): reactive, returns `null` while flags load so callers
 * can render a neutral state instead of flashing control/variant.
 *
 * Server (`serverFlag`): awaited fetch from the server SDK, useful for
 * gating logic inside API routes or server components. Falls back to the
 * provided default when flags are disabled or the user is anonymous.
 */

"use client";

import { useEffect, useState } from "react";
import { getFlag, isPostHogReady, onFlagsLoaded } from "./posthog-client";

export function useFlag(key: string): boolean | string | null {
  const [value, setValue] = useState<boolean | string | null>(() => getFlag(key));

  useEffect(() => {
    if (!isPostHogReady()) return;
    // Flags might already be loaded; onFeatureFlags fires once on ready + on change.
    const update = () => setValue(getFlag(key));
    update();
    onFlagsLoaded(update);
  }, [key]);

  return value;
}

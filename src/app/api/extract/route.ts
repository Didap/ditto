import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { runExtractionPipeline } from "@/lib/extract-pipeline";
import { trackServer } from "@/lib/analytics/posthog-server";
import { EVENTS } from "@/lib/analytics/events";

export const maxDuration = 120;

/**
 * Web extraction endpoint — session-authenticated. Saves the design to the
 * user's library and returns `{ slug, name, specialExtractionCharged }`.
 */
export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { url, name } = await req.json().catch(() => ({}));
  trackServer(user.id, EVENTS.EXTRACT_STARTED, { source: "url", url });

  const startedAt = Date.now();
  const result = await runExtractionPipeline(user.id, url, name, { save: true });

  if (!result.ok) {
    trackServer(user.id, EVENTS.EXTRACT_FAILED, { reason: result.error ?? "unknown", url });
    return NextResponse.json(
      {
        error: result.error,
        refunded: result.refunded,
        ...(result.waf ? { waf: true } : {}),
      },
      { status: result.status }
    );
  }

  trackServer(user.id, EVENTS.EXTRACT_COMPLETED, {
    slug: result.slug ?? "",
    durationMs: Date.now() - startedAt,
  });

  return NextResponse.json({
    slug: result.slug,
    name: result.designName,
    specialExtractionCharged: result.specialExtractionCharged,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getUserFromBearerOrSession } from "@/lib/auth-helpers";
import { runExtractionPipeline } from "@/lib/extract-pipeline";

export const maxDuration = 120;

/**
 * CLI-facing extraction endpoint. Accepts either a Bearer API key or a
 * session cookie. Returns the raw DESIGN.md as `text/markdown` on success
 * and JSON on failure.
 *
 * Query flags:
 *   - `save=true` — also persist the design to the user's library (mirrors
 *     the web `/api/extract` behavior). Default is ephemeral.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromBearerOrSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, name } = await req.json().catch(() => ({}));
  const save = new URL(req.url).searchParams.get("save") === "true";

  const result = await runExtractionPipeline(user.id, url, name, { save });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        refunded: result.refunded,
        ...(result.waf ? { waf: true } : {}),
      },
      { status: result.status }
    );
  }

  return new NextResponse(result.designMd, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Ditto-Name": encodeURIComponent(result.designName),
      "X-Ditto-Slug": result.slug,
      "X-Ditto-Saved": result.saved ? "true" : "false",
      "X-Ditto-Special-Charged": String(result.specialExtractionCharged),
    },
  });
}

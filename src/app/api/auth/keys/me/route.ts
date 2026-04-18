import { NextRequest, NextResponse } from "next/server";
import { getUserFromBearerOrSession } from "@/lib/auth-helpers";
import { getCredits } from "@/lib/credits";
import { getSpecialExtractionQuota } from "@/lib/special-extraction-quota";

/**
 * Whoami for CLI — accepts Bearer token and returns the authenticated user's
 * identity + credit balance + special extraction quota.
 *
 * Used by `ditto login` to validate a freshly-pasted key, and by `ditto
 * whoami` to show the dev their state before running extractions.
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromBearerOrSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ credits, plan }, quota] = await Promise.all([
    getCredits(user.id),
    getSpecialExtractionQuota(user.id),
  ]);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    credits,
    plan,
    specialExtractionFreeRemaining: quota.freeRemaining,
  });
}

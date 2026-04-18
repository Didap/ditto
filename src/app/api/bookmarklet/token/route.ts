import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { signToken } from "@/lib/bookmarklet-token";
import { buildBookmarkletBody, ORIGIN_PLACEHOLDER } from "@/lib/bookmarklet-builder";

export async function GET(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") || "en";
  const safeLocale = /^[a-z]{2}$/.test(locale) ? locale : "en";

  const token = signToken({ uid: user.id, locale: safeLocale });
  // Origin is substituted client-side with window.location.origin to avoid
  // resolving the container's internal bind host in reverse-proxy setups.
  const bookmarkletBody = buildBookmarkletBody(token, ORIGIN_PLACEHOLDER);
  return NextResponse.json({ token, bookmarkletBody, originPlaceholder: ORIGIN_PLACEHOLDER });
}

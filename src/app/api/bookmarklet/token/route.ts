import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { signToken } from "@/lib/bookmarklet-token";
import { buildBookmarkletHref } from "@/lib/bookmarklet-builder";

export async function GET(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") || "en";
  const safeLocale = /^[a-z]{2}$/.test(locale) ? locale : "en";

  const token = signToken({ uid: user.id, locale: safeLocale });
  const bookmarkletHref = buildBookmarkletHref(token, url.origin);
  return NextResponse.json({ token, bookmarkletHref });
}

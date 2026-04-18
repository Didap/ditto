import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/bookmarklet-token";
import { buildBookmarkletBody } from "@/lib/bookmarklet-builder";

/**
 * Legacy thin-loader endpoint — served only for backward compatibility with
 * old bookmarks that embed `<script src="/api/bookmarklet/script?t=...">`.
 * New bookmarklets are "fat" (all code inlined in the javascript: URI) so they
 * work even on sites with strict CSP that blocks external script injection.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  const payload = token ? verifyToken(token) : null;

  const headers = {
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "no-store",
  };

  if (!payload) {
    return new NextResponse(
      `alert(${JSON.stringify(
        "Ditto bookmarklet: token expired or invalid. Regenerate it from your Add Design page."
      )});`,
      { status: 401, headers }
    );
  }

  return new NextResponse(buildBookmarkletBody(token, url.origin), { headers });
}

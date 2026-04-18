import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/bookmarklet-token";
import { finalizeExtraction } from "@/lib/extractor";
import { generateDesignMd } from "@/lib/generator/design-md";
import { saveDesign, generateSlug } from "@/lib/store";
import { deductCredits, refundCredits, COSTS } from "@/lib/credits";
import { nanoid } from "nanoid";
import type { StoredDesign } from "@/lib/types";
import type { RawExtraction } from "@/lib/extractor/browser";
import { ApiError, insufficientCredits } from "@/lib/errors";

export const maxDuration = 60;

/**
 * Receives a raw extraction produced by the bookmarklet (running in the user's
 * browser, past the target site's WAF). Authenticated via signed HMAC token
 * because cross-site form POSTs don't carry NextAuth's SameSite=Lax cookies.
 *
 * Renders a plain HTML confirmation page (not a redirect) since the tab opened
 * by the bookmarklet originates from a third-party site — Lax cookies won't
 * have been sent, so a redirect to /design/[slug] would bounce to /login. The
 * user clicks the success link, which is a same-origin navigation and works.
 */
export async function POST(req: NextRequest) {
  let token = "";
  let rawDataStr = "";
  try {
    const form = await req.formData();
    token = form.get("token")?.toString() || "";
    rawDataStr = form.get("data")?.toString() || "";
  } catch {
    return htmlError("Invalid form submission", 400);
  }

  if (!token || !rawDataStr) {
    return htmlError(ApiError.INVALID_EXTRACTION_DATA, 400);
  }

  const payload = verifyToken(token);
  if (!payload) return htmlError(ApiError.INVALID_TOKEN, 401);

  let raw: RawExtraction;
  try {
    raw = JSON.parse(rawDataStr) as RawExtraction;
  } catch {
    return htmlError(ApiError.INVALID_EXTRACTION_DATA, 400, payload.locale);
  }

  if (!raw || !raw.meta || !Array.isArray(raw.colors) || raw.colors.length === 0) {
    return htmlError(ApiError.INVALID_EXTRACTION_DATA, 400, payload.locale);
  }

  let deducted = false;
  try {
    const { success, remaining } = await deductCredits(payload.uid, COSTS.ADD_DESIGN);
    if (!success) {
      return htmlError(
        insufficientCredits(COSTS.ADD_DESIGN, remaining),
        402,
        payload.locale
      );
    }
    deducted = true;

    const { tokens, resolved, quality } = finalizeExtraction(raw);

    const designName = raw.meta.title || "Untitled";
    const designMd = generateDesignMd(designName, tokens, resolved);
    const slug = generateSlug(designName);

    const design: StoredDesign = {
      id: nanoid(),
      slug,
      name: designName,
      url: raw.meta.url || "",
      description: raw.meta.description || "",
      tokens,
      resolved,
      quality,
      designMd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "extracted",
    };

    await saveDesign(payload.uid, design);

    return htmlSuccess(designName, slug, payload.locale);
  } catch (error) {
    console.error("Client-extraction error:", error);
    if (deducted) {
      await refundCredits(payload.uid, COSTS.ADD_DESIGN).catch(() => {});
    }
    return htmlError(
      error instanceof Error ? error.message : ApiError.EXTRACTION_FAILED,
      500,
      payload.locale
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const pageStyles = `
  body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; max-width: 520px; margin: 80px auto; padding: 24px; color: #0f172a; background: #fafafa; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  h1 { font-size: 20px; margin: 0 0 8px; font-weight: 600; letter-spacing: -0.01em; }
  p { color: #475569; line-height: 1.55; margin: 0 0 16px; }
  .btn { display: inline-block; padding: 10px 20px; background: #C4A8D8; color: #0f172a; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; }
  .btn:hover { background: #B294C7; }
  .secondary { color: #64748b; font-size: 13px; text-decoration: none; margin-left: 16px; }
  .secondary:hover { color: #0f172a; }
`;

function htmlSuccess(name: string, slug: string, locale: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Design saved — Ditto</title>
<style>${pageStyles}</style>
</head>
<body>
<div class="card">
<h1>Design saved</h1>
<p>"${escapeHtml(name)}" has been extracted and stored in your library. 100 credits were used.</p>
<a class="btn" href="/${escapeHtml(locale)}/design/${encodeURIComponent(slug)}">Open design</a>
<a class="secondary" href="/${escapeHtml(locale)}/dashboard">Back to dashboard</a>
</div>
</body>
</html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function htmlError(message: string, status: number, locale = "en"): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Extraction failed — Ditto</title>
<style>${pageStyles}</style>
</head>
<body>
<div class="card">
<h1>Extraction failed</h1>
<p>${escapeHtml(message)}</p>
<a class="btn" href="/${escapeHtml(locale)}/add">Back to Add Design</a>
</div>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

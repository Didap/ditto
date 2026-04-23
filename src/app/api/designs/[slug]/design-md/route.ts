import { NextRequest, NextResponse } from "next/server";
import { getDesign } from "@/lib/store";
import { getUserFromBearerOrSession, unauthorized } from "@/lib/auth-helpers";
import { ApiError } from "@/lib/errors";
import { generateDesignMd } from "@/lib/generator/design-md";
import { generateDesignMdForStitch } from "@/lib/generator/design-md-stitch";

/**
 * Serve DESIGN.md in two flavors.
 *
 *   ?variant=llm     — rich prose + YAML frontmatter with Google spec tokens
 *                      + _ditto.* extensions (gradients, motion, voice).
 *                      Best for Claude / Cursor / ChatGPT / Lovable.
 *   ?variant=stitch  — strict Google DESIGN.md spec, no extensions, 8
 *                      canonical sections. Importable into Stitch.
 *
 * Default (no query) = "llm" to preserve the legacy download behaviour.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getUserFromBearerOrSession(req);
  if (!user) return unauthorized();

  const { slug } = await params;
  const design = await getDesign(user.id, slug);
  if (!design) {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_FOUND }, { status: 404 });
  }

  const variant = new URL(req.url).searchParams.get("variant") ?? "llm";
  let body: string;
  let filename: string;
  if (variant === "stitch") {
    body = generateDesignMdForStitch(design.name, design.tokens, design.resolved);
    filename = `${design.slug}-design.stitch.md`;
  } else {
    body = generateDesignMd(design.name, design.tokens, design.resolved);
    filename = `${design.slug}-DESIGN.md`;
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

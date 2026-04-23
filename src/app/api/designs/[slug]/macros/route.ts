import { NextRequest, NextResponse } from "next/server";
import { getDesign, saveDesign } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { ApiError } from "@/lib/errors";
import { applyMacros, DESIGN_MACROS } from "@/lib/design-macros";

/** Returns the list of available macros. */
export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  return NextResponse.json({
    macros: DESIGN_MACROS.map((m) => ({
      id: m.id,
      labelKey: m.labelKey,
      descriptionKey: m.descriptionKey,
      icon: m.icon,
    })),
  });
}

/**
 * Apply one or more macros to an existing design. Returns the transformed
 * tokens/resolved. The caller can then decide to save via PATCH.
 *
 * Body: { macroIds: string[], save?: boolean }
 * If save === true, overwrites the design's tokens/resolved in-place.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const design = await getDesign(user.id, slug);
  if (!design) {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_FOUND }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const macroIds: string[] = Array.isArray(body.macroIds) ? body.macroIds : [];
  const save = !!body.save;

  if (macroIds.length === 0) {
    return NextResponse.json({ error: ApiError.MACRO_IDS_REQUIRED }, { status: 400 });
  }

  const result = applyMacros(design.tokens, design.resolved, macroIds);

  if (save) {
    await saveDesign(user.id, {
      ...design,
      tokens: result.tokens,
      resolved: result.resolved,
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    tokens: result.tokens,
    resolved: result.resolved,
    applied: result.applied,
    saved: save,
  });
}

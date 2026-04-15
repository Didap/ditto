import { NextRequest, NextResponse } from "next/server";
import { extractDesign } from "@/lib/extractor";
import { generateDesignMd } from "@/lib/generator/design-md";
import { saveDesign, generateSlug } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { deductCredits, COSTS } from "@/lib/credits";
import { nanoid } from "nanoid";
import type { StoredDesign } from "@/lib/types";
import { ApiError, insufficientCredits } from "@/lib/errors";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  try {
    const { url, name } = await req.json();

    if (!url) {
      return NextResponse.json({ error: ApiError.URL_REQUIRED }, { status: 400 });
    }

    // Check and deduct credits
    const { success, remaining } = await deductCredits(user.id, COSTS.ADD_DESIGN);
    if (!success) {
      return NextResponse.json(
        { error: insufficientCredits(COSTS.ADD_DESIGN, remaining) },
        { status: 402 }
      );
    }

    const { tokens, resolved, quality } = await extractDesign(url);

    const designName = name || tokens.meta.title || "Untitled";
    const designMd = generateDesignMd(designName, tokens, resolved);

    const slug = generateSlug(designName);
    const design: StoredDesign = {
      id: nanoid(),
      slug,
      name: designName,
      url,
      description: tokens.meta.description || "",
      tokens,
      resolved,
      quality,
      designMd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "extracted",
    };

    await saveDesign(user.id, design);

    return NextResponse.json({ slug, name: designName });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ApiError.EXTRACTION_FAILED },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { getDesign, saveDesign } from "@/lib/store";
import { boostDesignQuality, estimateBoostCost } from "@/lib/quality-improver";
import { generateDesignMd } from "@/lib/generator/design-md";
import { deductCredits } from "@/lib/credits";
import { ApiError, insufficientCredits } from "@/lib/errors";

/** GET — preview the boost cost without applying */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const design = await getDesign(user.id, slug);
  if (!design) {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_FOUND }, { status: 404 });
  }

  const estimate = estimateBoostCost(design.tokens, design.resolved);
  return NextResponse.json(estimate);
}

/** POST — apply boost and save */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { slug } = await params;
  const design = await getDesign(user.id, slug);
  if (!design) {
    return NextResponse.json({ error: ApiError.DESIGN_NOT_FOUND }, { status: 404 });
  }

  const result = boostDesignQuality(design.tokens, design.resolved);

  if (result.pointsGained === 0) {
    return NextResponse.json(
      { error: ApiError.MAX_QUALITY_REACHED },
      { status: 400 }
    );
  }

  // Deduct credits
  const { success, remaining } = await deductCredits(user.id, result.creditsCharged);
  if (!success) {
    return NextResponse.json(
      { error: insufficientCredits(result.creditsCharged, remaining) },
      { status: 402 }
    );
  }

  // Regenerate DESIGN.md with improved tokens
  const designMd = generateDesignMd(design.name, result.tokens, result.resolved);

  // Save updated design
  await saveDesign(user.id, {
    ...design,
    tokens: result.tokens,
    resolved: result.resolved,
    designMd,
  });

  return NextResponse.json({
    before: result.before.overall,
    after: result.after.overall,
    pointsGained: result.pointsGained,
    creditsCharged: result.creditsCharged,
    creditsRemaining: remaining - result.creditsCharged,
    fixesApplied: result.fixesApplied,
  });
}

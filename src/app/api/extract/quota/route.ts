import { NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import {
  getSpecialExtractionQuota,
  SPECIAL_EXTRACTION_FREE_PER_MONTH,
  SPECIAL_EXTRACTION_EXTRA_COST,
} from "@/lib/special-extraction-quota";

export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const quota = await getSpecialExtractionQuota(user.id);
  return NextResponse.json({
    ...quota,
    freePerMonth: SPECIAL_EXTRACTION_FREE_PER_MONTH,
    extraCost: SPECIAL_EXTRACTION_EXTRA_COST,
  });
}

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deductCredits, refundCredits } from "@/lib/credits";

/** How many proxy-fallback ("special") extractions each user gets free per month. */
export const SPECIAL_EXTRACTION_FREE_PER_MONTH = 1;

/** Extra credits charged on top of the base extraction cost once the free quota is spent. */
export const SPECIAL_EXTRACTION_EXTRA_COST = 100;

function currentMonthKey(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export interface QuotaCheck {
  month: string;
  usedThisMonth: number;
  freeRemaining: number;
  isFree: boolean;
}

/** Read-only check (no mutation). */
export async function getSpecialExtractionQuota(userId: string): Promise<QuotaCheck> {
  const [row] = await db
    .select({
      month: users.specialExtractionMonth,
      count: users.specialExtractionCount,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const month = currentMonthKey();
  if (!row || row.month !== month) {
    // Stored month is missing or from a previous month — effective count is 0
    return {
      month,
      usedThisMonth: 0,
      freeRemaining: SPECIAL_EXTRACTION_FREE_PER_MONTH,
      isFree: true,
    };
  }
  const used = row.count;
  const freeRemaining = Math.max(0, SPECIAL_EXTRACTION_FREE_PER_MONTH - used);
  return {
    month,
    usedThisMonth: used,
    freeRemaining,
    isFree: freeRemaining > 0,
  };
}

export interface ConsumeResult {
  /** 0 when the call was free, SPECIAL_EXTRACTION_EXTRA_COST when the user paid extra. */
  extraCharged: number;
  /** True if the user hit the quota AND didn't have enough credits for the surcharge. */
  insufficientCredits: boolean;
  /** Credits balance after the (possible) extra deduction. Only meaningful when not insufficient. */
  remainingCredits: number;
}

/**
 * Reserve a special-extraction slot. Deducts the extra surcharge from credits
 * when the free quota is already used this month. Does NOT yet increment the
 * counter — call `markSpecialExtractionUsed` only on successful extraction.
 */
export async function reserveSpecialExtraction(userId: string): Promise<ConsumeResult> {
  const quota = await getSpecialExtractionQuota(userId);
  if (quota.isFree) {
    return { extraCharged: 0, insufficientCredits: false, remainingCredits: 0 };
  }
  const { success, remaining } = await deductCredits(userId, SPECIAL_EXTRACTION_EXTRA_COST);
  if (!success) {
    return { extraCharged: 0, insufficientCredits: true, remainingCredits: remaining };
  }
  return {
    extraCharged: SPECIAL_EXTRACTION_EXTRA_COST,
    insufficientCredits: false,
    remainingCredits: remaining,
  };
}

/** Refund a previously-reserved surcharge (on extraction failure). */
export async function releaseSpecialExtraction(userId: string, reserved: ConsumeResult): Promise<void> {
  if (reserved.extraCharged > 0) {
    await refundCredits(userId, reserved.extraCharged).catch(() => {});
  }
}

/** Increment the monthly counter on successful extraction. Resets across month boundaries. */
export async function markSpecialExtractionUsed(userId: string): Promise<void> {
  const month = currentMonthKey();
  const [row] = await db
    .select({
      month: users.specialExtractionMonth,
      count: users.specialExtractionCount,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const nextCount = row?.month === month ? row.count + 1 : 1;
  await db
    .update(users)
    .set({
      specialExtractionMonth: month,
      specialExtractionCount: nextCount,
    })
    .where(eq(users.id, userId));
}

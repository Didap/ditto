import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export const COSTS = {
  ADD_DESIGN: 100,
  GENERATE_MIX: 300,
} as const;

export async function getCredits(userId: string): Promise<{ credits: number; plan: string }> {
  const [user] = await db
    .select({ credits: users.credits, plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user || { credits: 0, plan: "base" };
}

export async function hasEnoughCredits(userId: string, cost: number): Promise<boolean> {
  const { credits } = await getCredits(userId);
  return credits >= cost;
}

/**
 * Atomically deduct credits. Uses a conditional UPDATE so concurrent requests
 * can't both pass a check-then-write and push the balance negative; PostgreSQL
 * serializes the row update and only the request that still sees enough credits
 * succeeds.
 */
export async function deductCredits(userId: string, cost: number): Promise<{ success: boolean; remaining: number }> {
  const rows = await db
    .update(users)
    .set({ credits: sql`${users.credits} - ${cost}` })
    .where(and(eq(users.id, userId), gte(users.credits, cost)))
    .returning({ remaining: users.credits });

  if (rows.length > 0) {
    return { success: true, remaining: rows[0].remaining };
  }

  // Deduction failed — surface the current balance so callers can report it.
  const { credits } = await getCredits(userId);
  return { success: false, remaining: credits };
}

/** Refund credits (add back) — use when an operation fails after deducting */
export async function refundCredits(userId: string, amount: number): Promise<void> {
  await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${amount}` })
    .where(eq(users.id, userId));
}

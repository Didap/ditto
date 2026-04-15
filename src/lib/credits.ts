import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

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

export async function deductCredits(userId: string, cost: number): Promise<{ success: boolean; remaining: number }> {
  const { credits } = await getCredits(userId);
  if (credits < cost) return { success: false, remaining: credits };

  await db
    .update(users)
    .set({ credits: sql`${users.credits} - ${cost}` })
    .where(eq(users.id, userId));

  return { success: true, remaining: credits - cost };
}

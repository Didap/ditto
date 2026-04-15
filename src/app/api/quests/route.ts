import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { getQuestStatuses, claimQuest } from "@/lib/quests";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** GET — list quest statuses */
export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const statuses = await getQuestStatuses(user.id);

  // Also return referral code
  const [dbUser] = await db
    .select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  return NextResponse.json({
    quests: statuses,
    referralCode: dbUser?.referralCode || null,
  });
}

/** POST — claim a quest */
export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { questId } = await req.json();

  if (!questId) {
    return NextResponse.json({ error: "questId is required" }, { status: 400 });
  }

  const result = await claimQuest(user.id, questId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ credits: result.credits });
}

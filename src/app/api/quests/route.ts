import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { getQuestStatuses, claimQuest } from "@/lib/quests";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/errors";
import { trackServer } from "@/lib/analytics/posthog-server";
import { EVENTS } from "@/lib/analytics/events";

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
    return NextResponse.json({ error: ApiError.QUEST_ID_REQUIRED }, { status: 400 });
  }

  const result = await claimQuest(user.id, questId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  trackServer(user.id, EVENTS.QUEST_CLAIMED, {
    questId,
    credits: result.credits ?? 0,
  });

  return NextResponse.json({ credits: result.credits });
}

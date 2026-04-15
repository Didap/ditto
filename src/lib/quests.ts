import { db } from "@/lib/db";
import { users, questCompletions, designs } from "@/lib/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";

// ── Quest definitions ──

export interface QuestDef {
  id: string;
  title: string;
  description: string;
  credits: number;
  icon: string;
  repeatable: "once" | "daily";
}

export const QUESTS: QuestDef[] = [
  {
    id: "daily-login",
    title: "Daily Login",
    description: "Log in to Ditto every day",
    credits: 20,
    icon: "📅",
    repeatable: "daily",
  },
  {
    id: "complete-profile",
    title: "Complete Your Profile",
    description: "Add your name and avatar",
    credits: 50,
    icon: "👤",
    repeatable: "once",
  },
  {
    id: "first-extraction",
    title: "First Extraction",
    description: "Extract your first design from a website",
    credits: 30,
    icon: "🔍",
    repeatable: "once",
  },
  {
    id: "first-hybrid",
    title: "First Hybrid Mix",
    description: "Generate your first hybrid design",
    credits: 50,
    icon: "🎨",
    repeatable: "once",
  },
  {
    id: "first-boost",
    title: "First Quality Boost",
    description: "Boost a design's quality score",
    credits: 30,
    icon: "⚡",
    repeatable: "once",
  },
  {
    id: "share-social",
    title: "Share on Social",
    description: "Share Ditto on social media",
    credits: 30,
    icon: "📣",
    repeatable: "daily",
  },
  {
    id: "invite-friend",
    title: "Invite a Friend",
    description: "Invite someone who creates an account",
    credits: 200,
    icon: "🤝",
    repeatable: "daily", // repeatable per referral
  },
];

export const REFERRAL_BONUS_INVITED = 100; // bonus for the person who signs up via referral

// ── Quest status for a user ──

export interface QuestStatus {
  quest: QuestDef;
  completed: boolean;
  completedToday: boolean;
  totalCompletions: number;
  canClaim: boolean;
}

export async function getQuestStatuses(userId: string): Promise<QuestStatus[]> {
  const completions = await db
    .select()
    .from(questCompletions)
    .where(eq(questCompletions.userId, userId));

  const today = new Date().toISOString().slice(0, 10);

  // Check auto-detectable quests
  const autoComplete = await checkAutoQuests(userId);

  return QUESTS.map((quest) => {
    const myCompletions = completions.filter((c) => c.questId === quest.id);
    const completedToday = myCompletions.some(
      (c) => c.completedAt.toISOString().slice(0, 10) === today
    );
    const completed = myCompletions.length > 0;

    let canClaim = false;
    if (quest.repeatable === "daily") {
      canClaim = !completedToday && autoComplete.has(quest.id);
    } else {
      canClaim = !completed && autoComplete.has(quest.id);
    }

    return {
      quest,
      completed,
      completedToday,
      totalCompletions: myCompletions.length,
      canClaim,
    };
  });
}

// ── Check which quests can be auto-completed ──

async function checkAutoQuests(userId: string): Promise<Set<string>> {
  const claimable = new Set<string>();

  // Daily login — always claimable once per day
  claimable.add("daily-login");

  // Complete profile — check if name and avatar are set
  const [user] = await db
    .select({ name: users.name, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.name && user.name.trim().length > 0 && user?.avatarUrl) {
    claimable.add("complete-profile");
  }

  // First extraction
  const [extractCount] = await db
    .select({ n: count() })
    .from(designs)
    .where(and(eq(designs.userId, userId), eq(designs.source, "extracted")));

  if (extractCount && extractCount.n > 0) {
    claimable.add("first-extraction");
  }

  // First hybrid — source "imported" with hybrid in slug or name
  // Actually let's check for any design that's not extracted or imported from collection
  const [totalDesigns] = await db
    .select({ n: count() })
    .from(designs)
    .where(eq(designs.userId, userId));

  if (totalDesigns && totalDesigns.n > 0) {
    // If they have extractions, check for hybrids
    const allDesigns = await db
      .select({ slug: designs.slug })
      .from(designs)
      .where(eq(designs.userId, userId));

    if (allDesigns.some((d) => d.slug.startsWith("hybrid-"))) {
      claimable.add("first-hybrid");
    }
  }

  // Share social — always claimable (honor system, tracked client-side)
  claimable.add("share-social");

  // invite-friend and first-boost are claimed via specific API calls
  return claimable;
}

// ── Claim a quest ──

export async function claimQuest(
  userId: string,
  questId: string
): Promise<{ success: boolean; credits?: number; error?: string }> {
  const quest = QUESTS.find((q) => q.id === questId);
  if (!quest) return { success: false, error: "Quest not found" };

  const today = new Date().toISOString().slice(0, 10);

  // Check if already completed
  const existing = await db
    .select()
    .from(questCompletions)
    .where(
      and(
        eq(questCompletions.userId, userId),
        eq(questCompletions.questId, questId)
      )
    );

  if (quest.repeatable === "once" && existing.length > 0) {
    return { success: false, error: "Quest already completed" };
  }

  if (quest.repeatable === "daily") {
    const doneToday = existing.some((c) => c.completedAt.toISOString().slice(0, 10) === today);
    if (doneToday) {
      return { success: false, error: "Quest already completed today" };
    }
  }

  // Record completion and award credits
  await db.insert(questCompletions).values({
    id: nanoid(),
    userId,
    questId,
    creditsAwarded: quest.credits,
    completedAt: new Date(),
  });

  await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${quest.credits}` })
    .where(eq(users.id, userId));

  return { success: true, credits: quest.credits };
}

// ── Handle referral on registration ──

export async function processReferral(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; referrerName?: string }> {
  // Find referrer by code
  const [referrer] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.referralCode, referralCode))
    .limit(1);

  if (!referrer || referrer.id === newUserId) {
    return { success: false };
  }

  // Mark new user as referred
  await db
    .update(users)
    .set({ referredBy: referrer.id })
    .where(eq(users.id, newUserId));

  // Award bonus to new user
  await db
    .update(users)
    .set({ credits: sql`${users.credits} + ${REFERRAL_BONUS_INVITED}` })
    .where(eq(users.id, newUserId));

  // Award invite quest to referrer
  await claimQuest(referrer.id, "invite-friend");

  return { success: true, referrerName: referrer.name };
}

// ── Generate referral code for new users ──

export function generateReferralCode(): string {
  return nanoid(8).toUpperCase();
}

import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type { DesignTokens, ResolvedDesign } from "@/lib/types";

// ── Users ──

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("free"), // "free" | "pro" | "team"
  credits: integer("credits").notNull().default(300),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  referralCode: text("referral_code"),
  referredBy: text("referred_by"),
  avatarUrl: text("avatar_url"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

// ── Designs ──

export const designs = pgTable(
  "designs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    description: text("description").notNull().default(""),
    tokens: jsonb("tokens").$type<DesignTokens>().notNull(),
    resolved: jsonb("resolved").$type<ResolvedDesign>().notNull(),
    designMd: text("design_md").notNull(),
    source: text("source").notNull(), // "extracted" | "imported"
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // null = active, set = soft-deleted
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("designs_user_slug_idx").on(table.userId, table.slug),
  ]
);

export type DesignSelect = typeof designs.$inferSelect;
export type DesignInsert = typeof designs.$inferInsert;

// ── Quest Completions ──

export const questCompletions = pgTable(
  "quest_completions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questId: text("quest_id").notNull(),
    creditsAwarded: integer("credits_awarded").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quest_user_idx").on(table.userId, table.questId),
  ]
);

export type QuestCompletionSelect = typeof questCompletions.$inferSelect;
export type QuestCompletionInsert = typeof questCompletions.$inferInsert;

// ── Design Unlocks (kit / storybook purchases) ──

export const designUnlocks = pgTable(
  "design_unlocks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    designSlug: text("design_slug").notNull(),
    feature: text("feature").notNull(), // "kit" | "storybook"
    creditsSpent: integer("credits_spent").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("unlock_user_design_idx").on(table.userId, table.designSlug, table.feature),
  ]
);

export type DesignUnlockSelect = typeof designUnlocks.$inferSelect;
export type DesignUnlockInsert = typeof designUnlocks.$inferInsert;

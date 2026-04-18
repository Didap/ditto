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
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  verifyToken: text("verify_token"),
  verifyTokenExpires: timestamp("verify_token_expires", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  // Monthly usage counter for "special" (proxy-fallback) extractions.
  // 1st of each month is free (covered by base 100-credit cost); subsequent
  // ones cost an additional SPECIAL_EXTRACTION_EXTRA_COST credits each.
  specialExtractionMonth: text("special_extraction_month"), // "YYYY-MM"
  specialExtractionCount: integer("special_extraction_count").notNull().default(0),
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

// ── API Keys (CLI + MCP authentication) ──

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // user-visible label
    keyHash: text("key_hash").notNull().unique(), // SHA-256 of the raw key
    keyPrefix: text("key_prefix").notNull(), // first 12 chars of raw key for UI display
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("api_keys_user_idx").on(table.userId)]
);

export type ApiKeySelect = typeof apiKeys.$inferSelect;
export type ApiKeyInsert = typeof apiKeys.$inferInsert;

// ── Pricing (plans + credit packs) ──

/** Regional Stripe price entry */
export type RegionalPrice = {
  priceId: string;
  amount: number;
  currency: string; // "eur" | "usd"
};

export const pricing = pgTable("pricing", {
  id: text("id").primaryKey(), // "pro", "team", "pack-500", etc.
  type: text("type").notNull(), // "plan" | "pack"
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  priceUsd: integer("price_usd").notNull(), // in cents (US/default fallback)
  launchPriceUsd: integer("launch_price_usd").notNull(), // legacy, kept for compat
  stripePriceId: text("stripe_price_id"), // US/default Stripe price ID
  stripePrices: jsonb("stripe_prices").$type<Record<string, RegionalPrice>>(), // regional prices
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active").notNull().default(1), // 1 = visible
});

export type PricingSelect = typeof pricing.$inferSelect;

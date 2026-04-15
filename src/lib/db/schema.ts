import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("free"), // "free" | "pro" | "team"
  credits: integer("credits").notNull().default(300), // new users get 300
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  referralCode: text("referral_code"),
  referredBy: text("referred_by"),
  avatarUrl: text("avatar_url"),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const designs = sqliteTable(
  "designs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    description: text("description").notNull().default(""),
    tokens: text("tokens").notNull(), // JSON stringified DesignTokens
    resolved: text("resolved").notNull(), // JSON stringified ResolvedDesign
    designMd: text("design_md").notNull(),
    source: text("source").notNull(), // "extracted" | "imported"
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("designs_user_slug_idx").on(table.userId, table.slug),
  ]
);

export const questCompletions = sqliteTable(
  "quest_completions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    questId: text("quest_id").notNull(),
    creditsAwarded: integer("credits_awarded").notNull(),
    completedAt: text("completed_at").notNull(),
  },
  (table) => [
    index("quest_user_idx").on(table.userId, table.questId),
  ]
);

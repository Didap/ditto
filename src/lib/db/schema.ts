import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan").notNull().default("base"), // "base" | "premium"
  credits: integer("credits").notNull().default(300), // new users get 300
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

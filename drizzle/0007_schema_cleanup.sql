-- Drop old indexes we'll recreate with new shape/uniqueness
DROP INDEX IF EXISTS "unlock_user_design_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "quest_user_idx";--> statement-breakpoint

-- ── design_unlocks: design_slug → design_id (FK to designs.id) ──
-- Add design_id as nullable first, backfill from the slug join, drop orphans,
-- then enforce NOT NULL + FK. Done in-place so existing purchases are preserved.
ALTER TABLE "design_unlocks" ADD COLUMN IF NOT EXISTS "design_id" text;--> statement-breakpoint

UPDATE "design_unlocks" AS u
SET "design_id" = d."id"
FROM "designs" AS d
WHERE d."user_id" = u."user_id"
  AND d."slug" = u."design_slug"
  AND u."design_id" IS NULL;--> statement-breakpoint

-- Any unlock without a matching design (design hard-deleted pre-FK) is orphaned.
DELETE FROM "design_unlocks" WHERE "design_id" IS NULL;--> statement-breakpoint

ALTER TABLE "design_unlocks" ALTER COLUMN "design_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "design_unlocks" DROP COLUMN IF EXISTS "design_slug";--> statement-breakpoint

ALTER TABLE "design_unlocks" ADD CONSTRAINT "design_unlocks_design_id_designs_id_fk"
  FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- ── Add updatedAt (+ createdAt where missing) to tables that lacked them ──
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "design_unlocks" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "design_unlocks" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quest_completions" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "quest_completions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint

-- ── Self-FK for users.referred_by → users.id (set null on referrer delete) ──
-- Clean up stale referrals that don't match any existing user before adding the FK.
UPDATE "users" SET "referred_by" = NULL
WHERE "referred_by" IS NOT NULL
  AND "referred_by" NOT IN (SELECT "id" FROM "users");--> statement-breakpoint

ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_users_id_fk"
  FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id")
  ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- ── Recreate indexes ──
CREATE INDEX IF NOT EXISTS "unlock_user_design_idx" ON "design_unlocks" USING btree ("user_id","design_id","feature");--> statement-breakpoint
-- Quest completions are claim-once-per-user — enforce at the DB level.
-- If any duplicates somehow exist, collapse them before creating the unique index.
DELETE FROM "quest_completions" qc
USING "quest_completions" other
WHERE qc.ctid < other.ctid
  AND qc."user_id" = other."user_id"
  AND qc."quest_id" = other."quest_id";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quest_user_idx" ON "quest_completions" USING btree ("user_id","quest_id");

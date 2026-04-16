CREATE TABLE "design_unlocks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"design_slug" text NOT NULL,
	"feature" text NOT NULL,
	"credits_spent" integer NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "designs" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verify_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verify_token_expires" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "design_unlocks" ADD CONSTRAINT "design_unlocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unlock_user_design_idx" ON "design_unlocks" USING btree ("user_id","design_slug","feature");--> statement-breakpoint
UPDATE "users" SET "email_verified" = now() WHERE "email_verified" IS NULL;
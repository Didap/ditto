CREATE TABLE IF NOT EXISTS "designs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"tokens" text NOT NULL,
	"resolved" text NOT NULL,
	"design_md" text NOT NULL,
	"source" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quest_completions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quest_id" text NOT NULL,
	"credits_awarded" integer NOT NULL,
	"completed_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"credits" integer DEFAULT 300 NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"referral_code" text,
	"referred_by" text,
	"avatar_url" text,
	"last_login_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "designs" ADD CONSTRAINT "designs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_completions" ADD CONSTRAINT "quest_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "designs_user_slug_idx" ON "designs" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quest_user_idx" ON "quest_completions" USING btree ("user_id","quest_id");

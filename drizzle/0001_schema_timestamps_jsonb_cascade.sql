ALTER TABLE "designs" DROP CONSTRAINT "designs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "quest_completions" DROP CONSTRAINT "quest_completions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "designs" ALTER COLUMN "tokens" SET DATA TYPE jsonb USING tokens::jsonb;--> statement-breakpoint
ALTER TABLE "designs" ALTER COLUMN "resolved" SET DATA TYPE jsonb USING resolved::jsonb;--> statement-breakpoint
ALTER TABLE "designs" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "designs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "designs" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "designs" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "quest_completions" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quest_completions" ALTER COLUMN "completed_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_login_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "designs" ADD CONSTRAINT "designs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_completions" ADD CONSTRAINT "quest_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
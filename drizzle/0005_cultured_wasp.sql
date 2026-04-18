ALTER TABLE "users" ADD COLUMN "special_extraction_month" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "special_extraction_count" integer DEFAULT 0 NOT NULL;
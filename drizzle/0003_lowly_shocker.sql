CREATE TABLE "pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL,
	"price_usd" integer NOT NULL,
	"launch_price_usd" integer NOT NULL,
	"stripe_price_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
INSERT INTO "pricing" ("id", "type", "name", "credits", "price_usd", "launch_price_usd", "stripe_price_id", "sort_order", "active") VALUES
  ('free',      'plan', 'Free', 300,  0,    0,    NULL, 0, 1),
  ('pro',       'plan', 'Pro',  1500, 900,  630,  'price_1TMP2aLESa7z1b4uxScgnoxZ', 1, 1),
  ('team',      'plan', 'Team', 5000, 2900, 2030, 'price_1TMP2bLESa7z1b4usyC9XIk6', 2, 1),
  ('pack-500',  'pack', '500 Credits',  500,  500,  350,  'price_1TMP2cLESa7z1b4utVpUx3jN', 0, 1),
  ('pack-2000', 'pack', '2,000 Credits', 2000, 1900, 1330, 'price_1TMP2cLESa7z1b4uITKzrnEF', 1, 1),
  ('pack-5000', 'pack', '5,000 Credits', 5000, 4500, 3150, 'price_1TMP2dLESa7z1b4utsx28lAY', 2, 1);

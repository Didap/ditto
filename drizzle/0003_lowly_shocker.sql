CREATE TABLE "pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL,
	"price_usd" integer NOT NULL,
	"launch_price_usd" integer NOT NULL,
	"stripe_price_id" text,
	"stripe_prices" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
INSERT INTO "pricing" ("id", "type", "name", "credits", "price_usd", "launch_price_usd", "stripe_price_id", "stripe_prices", "sort_order", "active") VALUES
  ('free',      'plan', 'Free', 300,  0,    0,    NULL, NULL, 0, 1),
  ('pro',       'plan', 'Pro',  1500, 1500, 1050, 'price_1TMrUnLESa7z1b4uADLbpcNQ',
    '{"it":{"priceId":"price_1TMrUmLESa7z1b4u8keQFQFw","amount":999,"currency":"eur"},"eu":{"priceId":"price_1TMrUnLESa7z1b4ublvmKFj3","amount":1299,"currency":"eur"},"us":{"priceId":"price_1TMrUnLESa7z1b4uADLbpcNQ","amount":1500,"currency":"usd"}}',
    1, 1),
  ('team',      'plan', 'Team', 5000, 2500, 1750, 'price_1TMrUpLESa7z1b4ukoNQIW6T',
    '{"it":{"priceId":"price_1TMrUoLESa7z1b4uBwQyFwPt","amount":1999,"currency":"eur"},"eu":{"priceId":"price_1TMrUpLESa7z1b4uEACW9AfY","amount":2399,"currency":"eur"},"us":{"priceId":"price_1TMrUpLESa7z1b4ukoNQIW6T","amount":2500,"currency":"usd"}}',
    2, 1),
  ('pack-500',  'pack', '500 Credits',  500,  500,  350,  'price_1TMrOPLESa7z1b4uDy5VI89S', NULL, 0, 1),
  ('pack-2000', 'pack', '2,000 Credits', 2000, 1900, 1330, 'price_1TMrOPLESa7z1b4uoL8uyQct', NULL, 1, 1),
  ('pack-5000', 'pack', '5,000 Credits', 5000, 4500, 3150, 'price_1TMrOPLESa7z1b4uBBPUfQAd', NULL, 2, 1);

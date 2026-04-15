import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "PostgreSQL connection string required"),

  // Auth
  AUTH_SECRET: z.string().min(1, "Generate with: npx auth secret"),

  // Stripe — required
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),

  // Stripe — price IDs (server-side, optional)
  STRIPE_PRO_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_TEAM_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PACK_500_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PACK_2000_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PACK_5000_PRICE_ID: z.string().startsWith("price_").optional(),

  // Stripe — price IDs (client-side, exposed to browser)
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: z.string().startsWith("price_").optional(),
  NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID: z.string().startsWith("price_").optional(),
  NEXT_PUBLIC_STRIPE_PACK_500_PRICE_ID: z
    .string()
    .startsWith("price_")
    .optional(),
  NEXT_PUBLIC_STRIPE_PACK_2000_PRICE_ID: z
    .string()
    .startsWith("price_")
    .optional(),
  NEXT_PUBLIC_STRIPE_PACK_5000_PRICE_ID: z
    .string()
    .startsWith("price_")
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:\n");
    console.error(z.prettifyError(result.error));
    throw new Error("Invalid environment variables — check .env.example");
  }

  return result.data;
}

export const env = validateEnv();

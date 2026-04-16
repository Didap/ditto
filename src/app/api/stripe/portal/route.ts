import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const [dbUser] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!dbUser?.stripeCustomerId) {
    return NextResponse.json(
      { error: ApiError.NO_BILLING_ACCOUNT },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const loc = body.locale || "en";
  const origin = req.headers.get("origin") || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    locale: loc as "en" | "it" | "fr" | "es" | "auto",
    return_url: `${origin}/${loc}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}

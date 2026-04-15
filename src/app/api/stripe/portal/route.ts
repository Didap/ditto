import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
      { error: "No billing account found. Subscribe to a plan first." },
      { status: 400 }
    );
  }

  const origin = req.headers.get("origin") || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${origin}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}

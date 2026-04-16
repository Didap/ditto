import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, isNull, gte } from "drizzle-orm";

/** GET /api/auth/verify-email?token=xxx — verify email and redirect to login */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  // Find user with this token that hasn't expired
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.verifyToken, token),
        isNull(users.emailVerified),
        gte(users.verifyTokenExpires, new Date())
      )
    )
    .limit(1);

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=expired-token", req.url));
  }

  // Mark email as verified, clear token
  await db
    .update(users)
    .set({
      emailVerified: new Date(),
      verifyToken: null,
      verifyTokenExpires: null,
    })
    .where(eq(users.id, user.id));

  return NextResponse.redirect(new URL("/login?verified=true", req.url));
}

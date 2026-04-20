import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, isNull, gte } from "drizzle-orm";

/**
 * Resolve the public app URL. Behind a reverse proxy (Coolify, Vercel, ...)
 * `req.url` can be the internal bind address (e.g. http://0.0.0.0:3000) —
 * use NEXTAUTH_URL or forwarded headers so redirects land on the public host.
 */
function publicBaseUrl(req: NextRequest): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return req.nextUrl.origin;
}

/** GET /api/auth/verify-email?token=xxx — verify email and redirect to login */
export async function GET(req: NextRequest) {
  const base = publicBaseUrl(req);
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", base));
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
    return NextResponse.redirect(new URL("/login?error=expired-token", base));
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

  return NextResponse.redirect(new URL("/login?verified=true", base));
}

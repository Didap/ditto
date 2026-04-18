import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/errors";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function getRequiredUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user as { id: string; name: string; email: string };
}

export function unauthorized() {
  return NextResponse.json({ error: ApiError.UNAUTHORIZED }, { status: 401 });
}

/**
 * Auth for endpoints that need to accept both web sessions (NextAuth) and
 * programmatic API keys (CLI / MCP). Checks `Authorization: Bearer <key>`
 * first; falls back to the session cookie. Returns null if neither works.
 */
export async function getUserFromBearerOrSession(
  req: Request
): Promise<{ id: string; name: string; email: string } | null> {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(ditto_[A-Za-z0-9_]+)$/);
  if (match) {
    const raw = match[1];
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    const [row] = await db
      .select({
        keyId: apiKeys.id,
        userId: apiKeys.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.userId, users.id))
      .where(and(eq(apiKeys.keyHash, hash), isNull(apiKeys.revokedAt)))
      .limit(1);
    if (!row) return null;
    // Fire-and-forget usage timestamp (never block the request on this).
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, row.keyId))
      .catch(() => {});
    return { id: row.userId, name: row.userName, email: row.userEmail };
  }
  return getRequiredUser();
}

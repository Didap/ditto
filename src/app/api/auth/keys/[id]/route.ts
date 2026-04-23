import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { ApiError } from "@/lib/errors";

/** Revoke (soft-delete) an API key belonging to the authenticated user. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const result = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)))
    .returning({ id: apiKeys.id });

  if (result.length === 0) {
    return NextResponse.json({ error: ApiError.KEY_NOT_FOUND }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

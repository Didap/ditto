import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/errors";

export async function GET() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: ApiError.USER_NOT_FOUND }, { status: 404 });
  }

  return NextResponse.json(row);
}

/**
 * Update profile fields. Accepts any subset of:
 *   - name        → non-empty trimmed string, 2..60 chars
 *   - avatarUrl   → either `dittato:<seed>` (generated) or a full https:// url.
 *                    Pass explicit `null` to clear.
 *
 * Uploads (file) happen on the /api/profile/avatar route.
 */
export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const updates: Partial<{ name: string; avatarUrl: string | null }> = {};

  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (trimmed.length < 2) {
      return NextResponse.json({ error: ApiError.NAME_TOO_SHORT }, { status: 400 });
    }
    if (trimmed.length > 60) {
      return NextResponse.json({ error: ApiError.NAME_TOO_LONG }, { status: 400 });
    }
    updates.name = trimmed;
  }

  if (body.avatarUrl === null) {
    updates.avatarUrl = null;
  } else if (typeof body.avatarUrl === "string") {
    const v = body.avatarUrl.trim();
    const isDittato = v.startsWith("dittato:");
    const isUrl = /^https?:\/\//.test(v);
    if (!isDittato && !isUrl) {
      return NextResponse.json(
        { error: ApiError.AVATAR_INVALID_TYPE },
        { status: 400 },
      );
    }
    updates.avatarUrl = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  await db.update(users).set(updates).where(eq(users.id, user.id));

  return NextResponse.json({ ok: true, ...updates });
}

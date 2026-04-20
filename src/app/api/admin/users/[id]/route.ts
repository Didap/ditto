import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getAdminUser } from "@/lib/admin";
import { ApiError } from "@/lib/errors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PATCH /api/admin/users/[id] — admin can update name, email and credits.
 * Body: { name?, email?, credits? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: ApiError.FORBIDDEN }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    name?: unknown;
    email?: unknown;
    credits?: unknown;
  };

  const update: Partial<{ name: string; email: string; credits: number }> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: ApiError.EMAIL_NAME_PASSWORD_REQUIRED }, { status: 400 });
    }
    update.name = body.name.trim();
  }

  if (body.email !== undefined) {
    if (typeof body.email !== "string" || !EMAIL_RE.test(body.email)) {
      return NextResponse.json({ error: ApiError.INVALID_EMAIL }, { status: 400 });
    }
    const newEmail = body.email.trim().toLowerCase();
    // Uniqueness check (any other user)
    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, newEmail), ne(users.id, id)))
      .limit(1);
    if (conflict) {
      return NextResponse.json({ error: ApiError.EMAIL_IN_USE }, { status: 409 });
    }
    update.email = newEmail;
  }

  if (body.credits !== undefined) {
    const n = Number(body.credits);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: ApiError.INVALID_CREDITS }, { status: 400 });
    }
    update.credits = n;
  }

  if (Object.keys(update).length === 0) {
    // Nothing to update — return current
    const [current] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!current) {
      return NextResponse.json({ error: ApiError.USER_NOT_FOUND }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const result = await db
    .update(users)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(users.id, id));

  if ((result.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: ApiError.USER_NOT_FOUND }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/admin/users/[id] — hard delete. Cascades to designs, unlocks,
 * quest completions and api keys via existing FK constraints.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: ApiError.FORBIDDEN }, { status: 403 });
  }

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json({ error: ApiError.CANNOT_DELETE_SELF }, { status: 400 });
  }

  const result = await db.delete(users).where(eq(users.id, id));
  if ((result.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: ApiError.USER_NOT_FOUND }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

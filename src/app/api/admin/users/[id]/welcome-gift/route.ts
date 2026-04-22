import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getAdminUser } from "@/lib/admin";
import { ApiError } from "@/lib/errors";
import { sendWelcomeGiftEmail } from "@/lib/email";

const GIFT_AMOUNT = 1000;

/**
 * POST /api/admin/users/[id]/welcome-gift — admin-only.
 *
 * Atomically adds `GIFT_AMOUNT` credits to the target user and sends the
 * bilingual "thank you" email. Errors on email delivery don't roll back
 * credits (email is fire-and-forget on the happy path, but we surface
 * provider errors so admin can retry or investigate).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: ApiError.FORBIDDEN }, { status: 403 });
  }

  const { id } = await params;

  // Load target user first so we can address them by name in the email.
  const [target] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!target) {
    return NextResponse.json({ error: ApiError.USER_NOT_FOUND }, { status: 404 });
  }

  // Credit first — DB is the source of truth. If the update doesn't affect
  // a row, bail before sending the email.
  const update = await db
    .update(users)
    .set({
      credits: sql`${users.credits} + ${GIFT_AMOUNT}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  if ((update.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: ApiError.USER_NOT_FOUND }, { status: 404 });
  }

  // Return the new balance for the UI to show immediately.
  const [row] = await db
    .select({ credits: users.credits })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  try {
    await sendWelcomeGiftEmail(target.email, target.name, GIFT_AMOUNT);
  } catch (err) {
    console.error("[welcome-gift email]", err);
    // Credits already added — report success but flag the email issue so admin
    // can resend manually. The 1,000 credits are not worth rolling back.
    return NextResponse.json({
      ok: true,
      credits: row?.credits ?? null,
      emailSent: false,
    });
  }

  return NextResponse.json({
    ok: true,
    credits: row?.credits ?? null,
    creditsAdded: GIFT_AMOUNT,
    emailSent: true,
  });
}

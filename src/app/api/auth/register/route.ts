import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateReferralCode, processReferral } from "@/lib/quests";
import { ApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password, referralCode: refCode } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: ApiError.EMAIL_NAME_PASSWORD_REQUIRED },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: ApiError.PASSWORD_TOO_SHORT },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: ApiError.EMAIL_ALREADY_REGISTERED },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = nanoid();

    await db.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
      referralCode: generateReferralCode(),
    });

    // Process referral if provided
    let referrerName: string | undefined;
    if (refCode && typeof refCode === "string") {
      const result = await processReferral(userId, refCode.trim());
      if (result.success) referrerName = result.referrerName;
    }

    return NextResponse.json({ success: true, referrerName });
  } catch {
    return NextResponse.json(
      { error: ApiError.REGISTRATION_FAILED },
      { status: 500 }
    );
  }
}

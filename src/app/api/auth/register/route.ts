import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateReferralCode, processReferral } from "@/lib/quests";
import { ApiError } from "@/lib/errors";
import { sendVerificationEmail } from "@/lib/email";
import { LOCALES, type Locale } from "@/lib/i18n";
import { trackServer, identifyServer } from "@/lib/analytics/posthog-server";
import { EVENTS } from "@/lib/analytics/events";

const LOCALE_CODES = new Set<string>(LOCALES.map((l) => l.code));

export async function POST(req: NextRequest) {
  try {
    const { email, name, password, referralCode: refCode, locale: rawLocale } = await req.json();
    const locale: Locale = typeof rawLocale === "string" && LOCALE_CODES.has(rawLocale)
      ? (rawLocale as Locale)
      : "en";

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

    // Generate verification token (24h expiry)
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpires = new Date();
    verifyTokenExpires.setHours(verifyTokenExpires.getHours() + 24);

    await db.insert(users).values({
      id: userId,
      email,
      name,
      passwordHash,
      referralCode: generateReferralCode(),
      verifyToken,
      verifyTokenExpires,
    });

    // Process referral if provided
    let referrerName: string | undefined;
    if (refCode && typeof refCode === "string") {
      const result = await processReferral(userId, refCode.trim());
      if (result.success) referrerName = result.referrerName;
    }

    // Send verification email — don't fail registration if email delivery fails,
    // but always log the error so we can diagnose in production.
    try {
      const result = await sendVerificationEmail(email, name, verifyToken, locale);
      if (result?.error) {
        console.error("[register] Resend returned error:", result.error);
      }
    } catch (err) {
      console.error("[register] Verification email threw:", err);
    }

    identifyServer(userId, { email, name });
    trackServer(userId, EVENTS.USER_SIGNED_UP, { hasReferral: !!referrerName });

    return NextResponse.json({
      success: true,
      referrerName,
      requiresVerification: true,
    });
  } catch (err) {
    console.error("[register] Failed:", err);
    return NextResponse.json(
      { error: ApiError.REGISTRATION_FAILED },
      { status: 500 }
    );
  }
}

import { Resend } from "resend";
import type { Locale } from "@/lib/i18n";
import {
  VerificationEmail,
  VERIFY_SUBJECT,
} from "@/emails/VerificationEmail";
import {
  PurchaseEmail,
  purchaseSubject,
  type StripePurchaseKind,
} from "@/emails/PurchaseEmail";
import {
  WelcomeGiftEmail,
  welcomeGiftSubject,
} from "@/emails/WelcomeGiftEmail";

let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    resendClient = new Resend(key);
  }
  return resendClient;
}

const FROM = process.env.RESEND_FROM || "Ditto <noreply@dittodesign.dev>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ── Verify email ──

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
  locale: Locale = "en",
) {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;
  const subject = VERIFY_SUBJECT[locale] ?? VERIFY_SUBJECT.en;

  return getResend().emails.send({
    from: FROM,
    to,
    subject,
    react: VerificationEmail({ name, verifyUrl, locale }),
  });
}

// ── Stripe purchase (pack or plan) ──

export async function sendStripePurchaseEmail(
  to: string,
  name: string,
  purchase: {
    kind: StripePurchaseKind;
    productName: string;
    credits: number;
    amountCents: number;
    currency: string;
    balanceAfter: number;
    locale?: Locale;
  },
) {
  const locale: Locale = purchase.locale ?? "en";
  const dashboardUrl = `${APP_URL}/${locale}/dashboard`;
  const subject = purchaseSubject(purchase.kind, purchase.productName, locale);

  return getResend().emails.send({
    from: FROM,
    to,
    subject,
    react: PurchaseEmail({
      name,
      kind: purchase.kind,
      productName: purchase.productName,
      credits: purchase.credits,
      amountCents: purchase.amountCents,
      currency: purchase.currency,
      balanceAfter: purchase.balanceAfter,
      dashboardUrl,
      locale,
    }),
  });
}

// ── Admin welcome gift (bilingual EN + IT) ──

export async function sendWelcomeGiftEmail(
  to: string,
  name: string,
  credits: number = 1000,
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: welcomeGiftSubject(credits),
    react: WelcomeGiftEmail({ name, credits }),
  });
}

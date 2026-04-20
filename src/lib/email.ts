import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Ditto <noreply@ditto.design>";

// ── Shared styles ──

const BRAND = {
  primary: "#03e65b",
  bg: "#0a0a0a",
  surface: "#141414",
  text: "#e5e5e5",
  muted: "#94a3b8",
  border: "rgba(161,161,161,0.2)",
};

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <!-- Logo -->
    <div style="margin-bottom:32px;">
      <div style="display:inline-block;width:28px;height:28px;border-radius:42% 58% 70% 30%/45% 45% 55% 55%;background:linear-gradient(135deg,${BRAND.primary},#33d0ff,#ffc533);vertical-align:middle;"></div>
      <span style="font-size:18px;font-weight:700;color:${BRAND.text};vertical-align:middle;margin-left:8px;letter-spacing:-0.3px;">Ditto</span>
    </div>
    <!-- Content -->
    <div style="background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:12px;padding:32px 28px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="margin-top:24px;text-align:center;">
      <p style="font-size:11px;color:${BRAND.muted};margin:0;">
        Ditto &mdash; Design System Extractor
      </p>
    </div>
  </div>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;padding:12px 28px;background:${BRAND.primary};color:#0a0a0a;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;margin-top:20px;">${text}</a>`;
}

// ── Email: Verify Email ──

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND.text};">Verify your email</h2>
    <p style="margin:0 0 16px;font-size:14px;color:${BRAND.muted};line-height:1.6;">
      Hey ${name}, welcome to Ditto! Click below to verify your email and start extracting design systems.
    </p>
    ${button("Verify my email", verifyUrl)}
    <p style="margin:24px 0 0;font-size:12px;color:${BRAND.muted};line-height:1.5;">
      If you didn't create an account, you can safely ignore this email. This link expires in 24 hours.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your email — Ditto",
    html,
  });
}

// ── Email: Purchase Confirmation ──

export async function sendPurchaseEmail(
  to: string,
  name: string,
  purchase: {
    type: "catalog" | "devkit" | "complete" | "wordpress";
    designName: string;
    creditsSpent: number;
    creditsRemaining: number;
  }
) {
  const typeLabels: Record<string, string> = {
    catalog: "Catalog Design",
    devkit: "Dev Kit",
    complete: "Complete Kit",
    wordpress: "WordPress Theme",
  };
  const label = typeLabels[purchase.type] || purchase.type;

  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:${BRAND.text};">Purchase confirmed</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.muted};line-height:1.6;">
      Hey ${name}, your unlock is ready!
    </p>
    <!-- Receipt -->
    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:8px;padding:16px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="padding:6px 0;color:${BRAND.muted};">Design</td>
          <td style="padding:6px 0;color:${BRAND.text};text-align:right;font-weight:600;">${purchase.designName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:${BRAND.muted};">Item</td>
          <td style="padding:6px 0;color:${BRAND.text};text-align:right;">${label}</td>
        </tr>
        <tr style="border-top:1px solid ${BRAND.border};">
          <td style="padding:8px 0 6px;color:${BRAND.muted};">Credits spent</td>
          <td style="padding:8px 0 6px;color:${BRAND.primary};text-align:right;font-weight:700;">-${purchase.creditsSpent}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:${BRAND.muted};">Balance</td>
          <td style="padding:6px 0;color:${BRAND.text};text-align:right;font-weight:600;">${purchase.creditsRemaining} credits</td>
        </tr>
      </table>
    </div>
    ${button("Go to your design", process.env.NEXTAUTH_URL || "http://localhost:3000")}
    <p style="margin:24px 0 0;font-size:12px;color:${BRAND.muted};line-height:1.5;">
      This purchase is permanent and non-refundable as per our <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/terms" style="color:${BRAND.primary};text-decoration:underline;">Terms and Conditions</a>.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Purchase confirmed: ${label} — ${purchase.designName}`,
    html,
  });
}

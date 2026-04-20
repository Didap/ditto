import { Resend } from "resend";
import type { Locale } from "@/lib/i18n";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM || "Ditto <noreply@dittodesign.dev>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

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

interface VerifyCopy {
  subject: string;
  heading: (name: string) => string;
  intro: string;
  featuresTitle: string;
  features: string[];
  creditsHint: string;
  cta: string;
  expiryNote: string;
  ignoreNote: string;
  signoff: string;
}

const VERIFY_COPY: Record<Locale, VerifyCopy> = {
  en: {
    subject: "Welcome to Ditto — verify your email",
    heading: (name) => `Welcome, ${name} 👋`,
    intro: "Thanks for joining Ditto. One last step: verify your email to activate your account and start building.",
    featuresTitle: "Here's what you can do on Ditto:",
    features: [
      "<strong>Extract a full design system</strong> from any URL in ~30 seconds — colors, typography, spacing, shadows, components.",
      "<strong>Blend 2–10 sites</strong> into a unique hybrid: pick inspirations, tune the mood, and get a design system that's never existed before.",
      "<strong>Preview across 6 real layouts</strong> — Landing, Dashboard, Auth, Pricing, Blog and a Components catalog — themed live with your tokens.",
      "<strong>Download production-ready kits</strong>: Dev Kit (Storybook + Tailwind + CSS tokens + TypeScript + Figma tokens), WordPress block theme, or the Complete Kit with HTML pages and React components.",
      "<strong>Push tokens directly to Figma</strong> via Tokens Studio or the Variables API.",
    ],
    creditsHint: "You start with <strong>300 free credits</strong> — enough for about 3 extractions or 6 unlocks.",
    cta: "Verify my email",
    expiryNote: "This link expires in 24 hours.",
    ignoreNote: "If you didn't create an account, you can safely ignore this email.",
    signoff: "— The Ditto team",
  },
  it: {
    subject: "Benvenuto su Ditto — verifica la tua email",
    heading: (name) => `Benvenuto, ${name} 👋`,
    intro: "Grazie per esserti unito a Ditto. Ultimo passaggio: verifica la tua email per attivare l'account e iniziare a creare.",
    featuresTitle: "Ecco cosa puoi fare con Ditto:",
    features: [
      "<strong>Estrarre un intero design system</strong> da qualsiasi URL in ~30 secondi — colori, tipografia, spacing, ombre, componenti.",
      "<strong>Fondere da 2 a 10 siti</strong> in un ibrido unico: scegli le ispirazioni, regola il mood e ottieni un design system mai visto prima.",
      "<strong>Anteprima su 6 layout reali</strong> — Landing, Dashboard, Auth, Pricing, Blog e un catalogo Componenti — tutti tematizzati live con i tuoi token.",
      "<strong>Scaricare kit pronti per la produzione</strong>: Dev Kit (Storybook + Tailwind + token CSS + TypeScript + token Figma), tema WordPress block-based, o il Complete Kit con pagine HTML e componenti React.",
      "<strong>Inviare i token direttamente in Figma</strong> via Tokens Studio o Variables API.",
    ],
    creditsHint: "Ti regaliamo <strong>300 crediti gratuiti</strong> — sufficienti per circa 3 estrazioni o 6 unlock.",
    cta: "Verifica la mia email",
    expiryNote: "Questo link scade tra 24 ore.",
    ignoreNote: "Se non hai creato un account, puoi tranquillamente ignorare questa email.",
    signoff: "— Il team di Ditto",
  },
  fr: {
    subject: "Bienvenue sur Ditto — vérifiez votre email",
    heading: (name) => `Bienvenue, ${name} 👋`,
    intro: "Merci d'avoir rejoint Ditto. Dernière étape : vérifiez votre email pour activer votre compte et commencer à créer.",
    featuresTitle: "Voici ce que vous pouvez faire sur Ditto :",
    features: [
      "<strong>Extraire un design system complet</strong> depuis n'importe quelle URL en ~30 secondes — couleurs, typographie, espacements, ombres, composants.",
      "<strong>Fusionner 2 à 10 sites</strong> en un hybride unique : choisissez vos inspirations, ajustez l'ambiance et obtenez un design system inédit.",
      "<strong>Prévisualiser sur 6 vraies mises en page</strong> — Landing, Dashboard, Auth, Pricing, Blog et un catalogue de Composants — thémisées en live avec vos tokens.",
      "<strong>Télécharger des kits prêts pour la production</strong> : Dev Kit (Storybook + Tailwind + tokens CSS + TypeScript + tokens Figma), thème WordPress block, ou le Complete Kit avec pages HTML et composants React.",
      "<strong>Envoyer les tokens directement dans Figma</strong> via Tokens Studio ou l'API Variables.",
    ],
    creditsHint: "Vous démarrez avec <strong>300 crédits offerts</strong> — de quoi faire environ 3 extractions ou 6 déblocages.",
    cta: "Vérifier mon email",
    expiryNote: "Ce lien expire dans 24 heures.",
    ignoreNote: "Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.",
    signoff: "— L'équipe Ditto",
  },
  es: {
    subject: "Bienvenido a Ditto — verifica tu email",
    heading: (name) => `Bienvenido, ${name} 👋`,
    intro: "Gracias por unirte a Ditto. Último paso: verifica tu email para activar la cuenta y empezar a crear.",
    featuresTitle: "Esto es lo que puedes hacer en Ditto:",
    features: [
      "<strong>Extraer un design system completo</strong> desde cualquier URL en ~30 segundos — colores, tipografía, espaciado, sombras, componentes.",
      "<strong>Combinar entre 2 y 10 sitios</strong> en un híbrido único: elige inspiraciones, ajusta el estado de ánimo y obtén un sistema de diseño que nunca ha existido.",
      "<strong>Previsualizar en 6 layouts reales</strong> — Landing, Dashboard, Auth, Pricing, Blog y un catálogo de Componentes — todos estilizados en vivo con tus tokens.",
      "<strong>Descargar kits listos para producción</strong>: Dev Kit (Storybook + Tailwind + tokens CSS + TypeScript + tokens Figma), tema WordPress en bloques, o el Complete Kit con páginas HTML y componentes React.",
      "<strong>Enviar los tokens directamente a Figma</strong> mediante Tokens Studio o la API de Variables.",
    ],
    creditsHint: "Empiezas con <strong>300 créditos gratis</strong> — suficientes para unas 3 extracciones o 6 desbloqueos.",
    cta: "Verificar mi email",
    expiryNote: "Este enlace caduca en 24 horas.",
    ignoreNote: "Si no has creado una cuenta, puedes ignorar este email.",
    signoff: "— El equipo de Ditto",
  },
};

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
  locale: Locale = "en"
) {
  const copy = VERIFY_COPY[locale] ?? VERIFY_COPY.en;
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const featuresList = copy.features
    .map(
      (f) =>
        `<li style="margin:0 0 10px;padding-left:0;font-size:14px;color:${BRAND.text};line-height:1.55;">${f}</li>`
    )
    .join("");

  const html = layout(`
    <h2 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};letter-spacing:-0.3px;">${copy.heading(name)}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.muted};line-height:1.6;">
      ${copy.intro}
    </p>

    <p style="margin:0 0 12px;font-size:14px;color:${BRAND.text};font-weight:600;">${copy.featuresTitle}</p>
    <ul style="margin:0 0 20px;padding:0 0 0 18px;list-style:disc;color:${BRAND.muted};">
      ${featuresList}
    </ul>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:8px;padding:12px 14px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.5;">
        🎁 ${copy.creditsHint}
      </p>
    </div>

    ${button(copy.cta, verifyUrl)}

    <p style="margin:24px 0 4px;font-size:12px;color:${BRAND.muted};line-height:1.5;">
      ${copy.expiryNote} ${copy.ignoreNote}
    </p>
    <p style="margin:20px 0 0;font-size:13px;color:${BRAND.muted};">
      ${copy.signoff}
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: copy.subject,
    html,
  });
}

// ── Email: Stripe Purchase (credit pack or plan activation) ──

type StripePurchaseKind = "pack" | "plan";

interface StripePurchaseCopy {
  subjectPack: (packName: string) => string;
  subjectPlan: (planName: string) => string;
  headingPack: (name: string) => string;
  headingPlan: (name: string, planName: string) => string;
  introPack: (credits: number) => string;
  introPlan: (credits: number) => string;
  receiptItem: string;
  receiptCredits: string;
  receiptAmount: string;
  receiptBalance: string;
  cta: string;
  ctaHref: string;
  note: string;
  signoff: string;
}

const PURCHASE_COPY: Record<Locale, StripePurchaseCopy> = {
  en: {
    subjectPack: (pack) => `Thanks for your purchase — ${pack}`,
    subjectPlan: (plan) => `Welcome to ${plan} — your plan is active`,
    headingPack: (name) => `Thanks, ${name} 🎉`,
    headingPlan: (name, plan) => `Welcome to ${plan}, ${name} 🎉`,
    introPack: (c) => `Your payment went through. We've just topped up your balance with <strong>${c} credits</strong> — ready to use on extractions, hybrids and kit unlocks.`,
    introPlan: (c) => `Your plan is active and we've added <strong>${c} credits</strong> to your balance. You'll get the same top-up at each renewal.`,
    receiptItem: "Item",
    receiptCredits: "Credits added",
    receiptAmount: "Amount paid",
    receiptBalance: "New balance",
    cta: "Go to your dashboard",
    ctaHref: "/dashboard",
    note: "A Stripe receipt has been sent to this address separately. Need help? Reply to this email.",
    signoff: "— The Ditto team",
  },
  it: {
    subjectPack: (pack) => `Grazie per l'acquisto — ${pack}`,
    subjectPlan: (plan) => `Benvenuto su ${plan} — piano attivo`,
    headingPack: (name) => `Grazie, ${name} 🎉`,
    headingPlan: (name, plan) => `Benvenuto su ${plan}, ${name} 🎉`,
    introPack: (c) => `Pagamento confermato. Abbiamo ricaricato il tuo saldo di <strong>${c} crediti</strong> — pronti per estrazioni, ibridi e unlock dei kit.`,
    introPlan: (c) => `Il tuo piano è attivo e abbiamo aggiunto <strong>${c} crediti</strong> al saldo. Riceverai la stessa ricarica a ogni rinnovo.`,
    receiptItem: "Prodotto",
    receiptCredits: "Crediti aggiunti",
    receiptAmount: "Importo pagato",
    receiptBalance: "Saldo attuale",
    cta: "Vai alla dashboard",
    ctaHref: "/dashboard",
    note: "Riceverai la ricevuta ufficiale di Stripe separatamente. Serve aiuto? Rispondi a questa email.",
    signoff: "— Il team di Ditto",
  },
  fr: {
    subjectPack: (pack) => `Merci pour votre achat — ${pack}`,
    subjectPlan: (plan) => `Bienvenue sur ${plan} — plan actif`,
    headingPack: (name) => `Merci, ${name} 🎉`,
    headingPlan: (name, plan) => `Bienvenue sur ${plan}, ${name} 🎉`,
    introPack: (c) => `Paiement confirmé. Nous avons crédité votre solde de <strong>${c} crédits</strong> — prêts pour les extractions, les hybrides et les déblocages de kits.`,
    introPlan: (c) => `Votre plan est actif et nous avons ajouté <strong>${c} crédits</strong> à votre solde. Vous recevrez la même recharge à chaque renouvellement.`,
    receiptItem: "Article",
    receiptCredits: "Crédits ajoutés",
    receiptAmount: "Montant payé",
    receiptBalance: "Nouveau solde",
    cta: "Aller au tableau de bord",
    ctaHref: "/dashboard",
    note: "Un reçu Stripe a été envoyé à cette adresse séparément. Besoin d'aide ? Répondez à cet email.",
    signoff: "— L'équipe Ditto",
  },
  es: {
    subjectPack: (pack) => `Gracias por tu compra — ${pack}`,
    subjectPlan: (plan) => `Bienvenido a ${plan} — plan activo`,
    headingPack: (name) => `Gracias, ${name} 🎉`,
    headingPlan: (name, plan) => `Bienvenido a ${plan}, ${name} 🎉`,
    introPack: (c) => `Pago confirmado. Hemos recargado tu saldo con <strong>${c} créditos</strong> — listos para extracciones, híbridos y desbloqueos de kits.`,
    introPlan: (c) => `Tu plan está activo y hemos añadido <strong>${c} créditos</strong> a tu saldo. Recibirás la misma recarga en cada renovación.`,
    receiptItem: "Producto",
    receiptCredits: "Créditos añadidos",
    receiptAmount: "Importe pagado",
    receiptBalance: "Saldo actual",
    cta: "Ir al panel",
    ctaHref: "/dashboard",
    note: "Recibirás el recibo oficial de Stripe por separado. ¿Necesitas ayuda? Responde a este email.",
    signoff: "— El equipo de Ditto",
  },
};

function formatAmount(amountCents: number, currency: string, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

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
  }
) {
  const locale: Locale = purchase.locale ?? "en";
  const copy = PURCHASE_COPY[locale] ?? PURCHASE_COPY.en;
  const isPlan = purchase.kind === "plan";

  const subject = isPlan
    ? copy.subjectPlan(purchase.productName)
    : copy.subjectPack(purchase.productName);
  const heading = isPlan
    ? copy.headingPlan(name, purchase.productName)
    : copy.headingPack(name);
  const intro = isPlan ? copy.introPlan(purchase.credits) : copy.introPack(purchase.credits);
  const amountLabel = formatAmount(purchase.amountCents, purchase.currency, locale);

  const html = layout(`
    <h2 style="margin:0 0 12px;font-size:22px;color:${BRAND.text};letter-spacing:-0.3px;">${heading}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:${BRAND.muted};line-height:1.6;">
      ${intro}
    </p>

    <div style="background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:8px;padding:16px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="padding:6px 0;color:${BRAND.muted};">${copy.receiptItem}</td>
          <td style="padding:6px 0;color:${BRAND.text};text-align:right;font-weight:600;">${purchase.productName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:${BRAND.muted};">${copy.receiptCredits}</td>
          <td style="padding:6px 0;color:${BRAND.primary};text-align:right;font-weight:700;">+${purchase.credits}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:${BRAND.muted};">${copy.receiptAmount}</td>
          <td style="padding:6px 0;color:${BRAND.text};text-align:right;">${amountLabel}</td>
        </tr>
        <tr style="border-top:1px solid ${BRAND.border};">
          <td style="padding:8px 0 6px;color:${BRAND.muted};">${copy.receiptBalance}</td>
          <td style="padding:8px 0 6px;color:${BRAND.text};text-align:right;font-weight:600;">${purchase.balanceAfter} credits</td>
        </tr>
      </table>
    </div>

    ${button(copy.cta, `${APP_URL}/${locale}${copy.ctaHref}`)}

    <p style="margin:24px 0 0;font-size:12px;color:${BRAND.muted};line-height:1.5;">
      ${copy.note}
    </p>
    <p style="margin:20px 0 0;font-size:13px;color:${BRAND.muted};">
      ${copy.signoff}
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });
}

// ── Email: Unlock Confirmation (design kit unlocks) ──

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
    ${button("Go to your design", APP_URL)}
    <p style="margin:24px 0 0;font-size:12px;color:${BRAND.muted};line-height:1.5;">
      This purchase is permanent and non-refundable as per our <a href="${APP_URL}/terms" style="color:${BRAND.primary};text-decoration:underline;">Terms and Conditions</a>.
    </p>
  `);

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Purchase confirmed: ${label} — ${purchase.designName}`,
    html,
  });
}

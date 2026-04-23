import type { Locale } from "@/lib/i18n";
import {
  Heading,
  Layout,
  Lead,
  Muted,
  PrimaryButton,
  ReceiptRow,
  ReceiptTable,
  Signature,
  Small,
  tokens,
} from "./_shared";

export type StripePurchaseKind = "pack" | "plan";

export interface PurchaseEmailProps {
  name: string;
  kind: StripePurchaseKind;
  productName: string;
  credits: number;
  amountCents: number;
  currency: string;
  balanceAfter: number;
  dashboardUrl: string;
  locale?: Locale;
}

interface Copy {
  previewPack: (pack: string) => string;
  previewPlan: (plan: string) => string;
  headingPack: (name: string) => string;
  headingPlan: (name: string, plan: string) => string;
  introPack: (credits: string) => { pre: string; bold: string; post: string };
  introPlan: (credits: string) => { pre: string; bold: string; post: string };
  receiptItem: string;
  receiptCredits: string;
  receiptAmount: string;
  receiptBalance: string;
  cta: string;
  note: string;
  signoff: string;
  creditsWord: string;
  footerNote: string;
}

const COPY: Record<Locale, Copy> = {
  en: {
    previewPack: (p) => `Your ${p} purchase is confirmed.`,
    previewPlan: (p) => `Your ${p} plan is active.`,
    headingPack: (n) => `Thanks, ${n} 🎉`,
    headingPlan: (n, p) => `Welcome to ${p}, ${n} 🎉`,
    introPack: (c) => ({
      pre: "Your payment went through. We've just topped up your balance with ",
      bold: `${c} credits`,
      post: " — ready to use on extractions, hybrids and kit unlocks.",
    }),
    introPlan: (c) => ({
      pre: "Your plan is active and we've added ",
      bold: `${c} credits`,
      post: " to your balance. You'll get the same top-up at each renewal.",
    }),
    receiptItem: "Item",
    receiptCredits: "Credits added",
    receiptAmount: "Amount paid",
    receiptBalance: "New balance",
    cta: "Go to your dashboard",
    note: "A Stripe receipt has been sent to this address separately. Need help? Reply to this email.",
    signoff: "— The Ditto team",
    creditsWord: "credits",
    footerNote: "You received this confirmation for a purchase on Ditto.",
  },
  it: {
    previewPack: (p) => `Acquisto confermato: ${p}.`,
    previewPlan: (p) => `Piano ${p} attivo.`,
    headingPack: (n) => `Grazie, ${n} 🎉`,
    headingPlan: (n, p) => `Benvenuto su ${p}, ${n} 🎉`,
    introPack: (c) => ({
      pre: "Pagamento confermato. Abbiamo ricaricato il tuo saldo di ",
      bold: `${c} crediti`,
      post: " — pronti per estrazioni, ibridi e unlock dei kit.",
    }),
    introPlan: (c) => ({
      pre: "Il tuo piano è attivo e abbiamo aggiunto ",
      bold: `${c} crediti`,
      post: " al saldo. Riceverai la stessa ricarica a ogni rinnovo.",
    }),
    receiptItem: "Prodotto",
    receiptCredits: "Crediti aggiunti",
    receiptAmount: "Importo pagato",
    receiptBalance: "Saldo attuale",
    cta: "Vai alla dashboard",
    note: "Riceverai la ricevuta ufficiale di Stripe separatamente. Serve aiuto? Rispondi a questa email.",
    signoff: "— Il team di Ditto",
    creditsWord: "crediti",
    footerNote: "Hai ricevuto questa conferma per un acquisto su Ditto.",
  },
  fr: {
    previewPack: (p) => `Achat ${p} confirmé.`,
    previewPlan: (p) => `Plan ${p} actif.`,
    headingPack: (n) => `Merci, ${n} 🎉`,
    headingPlan: (n, p) => `Bienvenue sur ${p}, ${n} 🎉`,
    introPack: (c) => ({
      pre: "Paiement confirmé. Nous avons crédité votre solde de ",
      bold: `${c} crédits`,
      post: " — prêts pour les extractions, les hybrides et les déblocages de kits.",
    }),
    introPlan: (c) => ({
      pre: "Votre plan est actif et nous avons ajouté ",
      bold: `${c} crédits`,
      post: " à votre solde. Vous recevrez la même recharge à chaque renouvellement.",
    }),
    receiptItem: "Article",
    receiptCredits: "Crédits ajoutés",
    receiptAmount: "Montant payé",
    receiptBalance: "Nouveau solde",
    cta: "Aller au tableau de bord",
    note: "Un reçu Stripe a été envoyé à cette adresse séparément. Besoin d'aide ? Répondez à cet email.",
    signoff: "— L'équipe Ditto",
    creditsWord: "crédits",
    footerNote: "Vous recevez cette confirmation suite à un achat sur Ditto.",
  },
  es: {
    previewPack: (p) => `Compra ${p} confirmada.`,
    previewPlan: (p) => `Plan ${p} activo.`,
    headingPack: (n) => `Gracias, ${n} 🎉`,
    headingPlan: (n, p) => `Bienvenido a ${p}, ${n} 🎉`,
    introPack: (c) => ({
      pre: "Pago confirmado. Hemos recargado tu saldo con ",
      bold: `${c} créditos`,
      post: " — listos para extracciones, híbridos y desbloqueos de kits.",
    }),
    introPlan: (c) => ({
      pre: "Tu plan está activo y hemos añadido ",
      bold: `${c} créditos`,
      post: " a tu saldo. Recibirás la misma recarga en cada renovación.",
    }),
    receiptItem: "Producto",
    receiptCredits: "Créditos añadidos",
    receiptAmount: "Importe pagado",
    receiptBalance: "Saldo actual",
    cta: "Ir al panel",
    note: "Recibirás el recibo oficial de Stripe por separado. ¿Necesitas ayuda? Responde a este email.",
    signoff: "— El equipo de Ditto",
    creditsWord: "créditos",
    footerNote: "Has recibido esta confirmación por una compra en Ditto.",
  },
};

export function purchaseSubject(
  kind: StripePurchaseKind,
  productName: string,
  locale: Locale,
): string {
  const m: Record<Locale, { pack: (p: string) => string; plan: (p: string) => string }> = {
    en: {
      pack: (p) => `Thanks for your purchase — ${p}`,
      plan: (p) => `Welcome to ${p} — your plan is active`,
    },
    it: {
      pack: (p) => `Grazie per l'acquisto — ${p}`,
      plan: (p) => `Benvenuto su ${p} — piano attivo`,
    },
    fr: {
      pack: (p) => `Merci pour votre achat — ${p}`,
      plan: (p) => `Bienvenue sur ${p} — plan actif`,
    },
    es: {
      pack: (p) => `Gracias por tu compra — ${p}`,
      plan: (p) => `Bienvenido a ${p} — plan activo`,
    },
  };
  const bundle = m[locale] ?? m.en;
  return kind === "plan" ? bundle.plan(productName) : bundle.pack(productName);
}

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

export function PurchaseEmail({
  name,
  kind,
  productName,
  credits,
  amountCents,
  currency,
  balanceAfter,
  dashboardUrl,
  locale = "en",
}: PurchaseEmailProps) {
  const c = COPY[locale] ?? COPY.en;
  const isPlan = kind === "plan";

  const preview = isPlan ? c.previewPlan(productName) : c.previewPack(productName);
  const heading = isPlan ? c.headingPlan(name, productName) : c.headingPack(name);
  const creditsStr = credits.toLocaleString(locale);
  const intro = isPlan ? c.introPlan(creditsStr) : c.introPack(creditsStr);
  const amountLabel = formatAmount(amountCents, currency, locale);
  const balanceStr = balanceAfter.toLocaleString(locale);

  return (
    <Layout preview={preview} locale={locale} footerNote={c.footerNote}>
      <Signature />
      <Heading>{heading}</Heading>
      <Lead>
        {intro.pre}
        <strong style={{ color: tokens.textStrong, fontWeight: 700 }}>{intro.bold}</strong>
        {intro.post}
      </Lead>

      <ReceiptTable>
        <ReceiptRow label={c.receiptItem} value={productName} emphasis="strong" />
        <ReceiptRow
          label={c.receiptCredits}
          value={`+${creditsStr}`}
          emphasis="primary"
        />
        <ReceiptRow label={c.receiptAmount} value={amountLabel} />
        <ReceiptRow
          label={c.receiptBalance}
          value={`${balanceStr} ${c.creditsWord}`}
          emphasis="strong"
          divider
        />
      </ReceiptTable>

      <PrimaryButton href={dashboardUrl}>{c.cta}</PrimaryButton>

      <Small style={{ margin: "26px 0 0" }}>{c.note}</Small>
      <Muted style={{ margin: "18px 0 0" }}>{c.signoff}</Muted>
    </Layout>
  );
}

PurchaseEmail.PreviewProps = {
  name: "Cristiano",
  kind: "pack",
  productName: "Starter Pack",
  credits: 500,
  amountCents: 1900,
  currency: "eur",
  balanceAfter: 1800,
  dashboardUrl: "https://dittodesign.dev/en/dashboard",
  locale: "en",
} satisfies PurchaseEmailProps;

export default PurchaseEmail;

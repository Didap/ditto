import type { Locale } from "@/lib/i18n";
import {
  Body14,
  Heading,
  Layout,
  Lead,
  Muted,
  Signature,
  tokens,
} from "./_shared";

export interface WelcomeGiftEmailProps {
  name: string;
  credits?: number;
  locale?: Locale;
}

interface Copy {
  subject: (credits: string) => string;
  preview: (credits: string) => string;
  fallbackName: string;
  heading: (name: string) => string;
  lead: string;
  bodyPre: string;
  bodyPost: string;
  creditsWord: string;
  feedback: string;
  thanks: string;
  signoff: string;
  team: string;
  footerNote: string;
  numberLocale: string;
}

const COPY: Record<Locale, Copy> = {
  en: {
    subject: (c) => `A little thank-you from Ditto — ${c} credits for you`,
    preview: (c) => `A thank-you from Ditto — ${c} credits added to your account.`,
    fallbackName: "there",
    heading: (n) => `Hi ${n},`,
    lead: "Thank you for using Ditto — it genuinely means a lot to us that you've chosen our platform as part of your workflow.",
    bodyPre: "As a small token of our appreciation, we've added ",
    bodyPost: " to your account. They're already available and ready to use whenever you need them.",
    creditsWord: "credits",
    feedback: "If you have any feedback, ideas, or run into anything we can help with, just reply to this email — we'd love to hear from you.",
    thanks: "Thanks again for being part of Ditto.",
    signoff: "Best,",
    team: "The Ditto Team",
    footerNote: "Sent with thanks from the Ditto team.",
    numberLocale: "en-US",
  },
  it: {
    subject: (c) => `Un piccolo grazie da Ditto — ${c} crediti per te`,
    preview: (c) => `Un grazie da Ditto — ${c} crediti aggiunti al tuo account.`,
    fallbackName: "ciao",
    heading: (n) => `Ciao ${n},`,
    lead: "Grazie per aver scelto Ditto — significa davvero molto per noi che tu abbia deciso di includere la nostra piattaforma nel tuo flusso di lavoro.",
    bodyPre: "Come piccolo segno di apprezzamento, abbiamo aggiunto ",
    bodyPost: " al tuo account. Sono già disponibili e pronti per essere usati quando ti servono.",
    creditsWord: "crediti",
    feedback: "Se hai qualche feedback, idee o qualcosa in cui possiamo aiutarti, rispondi pure a questa email — ci fa piacere sentirti.",
    thanks: "Grazie ancora per far parte di Ditto.",
    signoff: "Un saluto,",
    team: "Il team di Ditto",
    footerNote: "Inviata con gratitudine dal team Ditto.",
    numberLocale: "it-IT",
  },
  fr: {
    subject: (c) => `Un petit merci de Ditto — ${c} crédits pour toi`,
    preview: (c) => `Un merci de Ditto — ${c} crédits ajoutés à ton compte.`,
    fallbackName: "toi",
    heading: (n) => `Salut ${n},`,
    lead: "Merci d'utiliser Ditto — cela compte vraiment pour nous que tu aies choisi notre plateforme dans ton flux de travail.",
    bodyPre: "En petit signe de reconnaissance, nous avons ajouté ",
    bodyPost: " à ton compte. Ils sont déjà disponibles et prêts à être utilisés dès que tu en as besoin.",
    creditsWord: "crédits",
    feedback: "Si tu as des retours, des idées, ou besoin d'aide sur quoi que ce soit, réponds simplement à cet email — on serait ravis de te lire.",
    thanks: "Merci encore de faire partie de Ditto.",
    signoff: "À bientôt,",
    team: "L'équipe Ditto",
    footerNote: "Envoyé avec gratitude par l'équipe Ditto.",
    numberLocale: "fr-FR",
  },
  es: {
    subject: (c) => `Un pequeño gracias de Ditto — ${c} créditos para ti`,
    preview: (c) => `Un gracias de Ditto — ${c} créditos añadidos a tu cuenta.`,
    fallbackName: "hola",
    heading: (n) => `Hola ${n},`,
    lead: "Gracias por usar Ditto — significa mucho para nosotros que hayas elegido nuestra plataforma como parte de tu flujo de trabajo.",
    bodyPre: "Como pequeño gesto de agradecimiento, hemos añadido ",
    bodyPost: " a tu cuenta. Ya están disponibles y listos para usar cuando los necesites.",
    creditsWord: "créditos",
    feedback: "Si tienes comentarios, ideas o algo en lo que podamos ayudarte, responde a este email — nos encantará saber de ti.",
    thanks: "Gracias de nuevo por formar parte de Ditto.",
    signoff: "Un saludo,",
    team: "El equipo de Ditto",
    footerNote: "Enviado con gratitud por el equipo de Ditto.",
    numberLocale: "es-ES",
  },
};

export function welcomeGiftSubject(credits: number, locale: Locale = "en"): string {
  const c = COPY[locale] ?? COPY.en;
  return c.subject(credits.toLocaleString(c.numberLocale));
}

export function WelcomeGiftEmail({
  name,
  credits = 1000,
  locale = "en",
}: WelcomeGiftEmailProps) {
  const c = COPY[locale] ?? COPY.en;
  const safeName = name?.trim() || c.fallbackName;
  const creditsStr = credits.toLocaleString(c.numberLocale);

  return (
    <Layout
      preview={c.preview(creditsStr)}
      locale={locale}
      footerNote={c.footerNote}
    >
      <Signature />
      <Heading>{c.heading(safeName)}</Heading>
      <Lead>{c.lead}</Lead>
      <Body14>
        {c.bodyPre}
        <strong style={{ color: tokens.primary, fontWeight: 700 }}>
          {creditsStr} {c.creditsWord}
        </strong>
        {c.bodyPost}
      </Body14>
      <Body14>{c.feedback}</Body14>
      <Body14>{c.thanks}</Body14>

      <div style={{ marginTop: 20 }}>
        <Body14 style={{ margin: "0 0 2px" }}>{c.signoff}</Body14>
        <Body14
          style={{
            margin: "0 0 2px",
            color: tokens.textStrong,
            fontWeight: 700,
          }}
        >
          William
        </Body14>
        <Muted>{c.team}</Muted>
      </div>
    </Layout>
  );
}

WelcomeGiftEmail.PreviewProps = {
  name: "Cristiano",
  credits: 1000,
  locale: "en",
} satisfies WelcomeGiftEmailProps;

export default WelcomeGiftEmail;

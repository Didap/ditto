import type { Locale } from "@/lib/i18n";
import {
  Body14,
  Callout,
  FeatureItem,
  Heading,
  Layout,
  Lead,
  Muted,
  PrimaryButton,
  Signature,
  Small,
  tokens,
} from "./_shared";

export interface VerificationEmailProps {
  name: string;
  verifyUrl: string;
  locale?: Locale;
}

type Feature = { bold: string; rest: string };

interface Copy {
  preview: string;
  heading: (name: string) => string;
  intro: string;
  featuresTitle: string;
  features: Feature[];
  creditsHint: { pre: string; bold: string; post: string };
  cta: string;
  expiryNote: string;
  ignoreNote: string;
  signoff: string;
  footerNote: string;
}

const COPY: Record<Locale, Copy> = {
  en: {
    preview: "Verify your email to activate your Ditto account.",
    heading: (name) => `Welcome, ${name} 👋`,
    intro:
      "Thanks for joining Ditto. One last step: verify your email to activate your account and start building.",
    featuresTitle: "Here's what you can do on Ditto",
    features: [
      {
        bold: "Extract a full design system",
        rest: " from any URL in ~30 seconds — colors, typography, spacing, shadows, components.",
      },
      {
        bold: "Blend 2–10 sites",
        rest: " into a unique hybrid: pick inspirations, tune the mood, and get a design system that's never existed before.",
      },
      {
        bold: "Preview across 6 real layouts",
        rest: " — Landing, Dashboard, Auth, Pricing, Blog and a Components catalog — themed live with your tokens.",
      },
      {
        bold: "Download production-ready kits",
        rest: ": Dev Kit (Storybook + Tailwind + CSS tokens + TypeScript + Figma tokens), WordPress block theme, or the Complete Kit with HTML pages and React components.",
      },
      {
        bold: "Push tokens directly to Figma",
        rest: " via Tokens Studio or the Variables API.",
      },
    ],
    creditsHint: {
      pre: "You start with ",
      bold: "300 free credits",
      post: " — enough for about 3 extractions or 6 unlocks.",
    },
    cta: "Verify my email",
    expiryNote: "This link expires in 24 hours.",
    ignoreNote: "If you didn't create an account, you can safely ignore this email.",
    signoff: "— The Ditto team",
    footerNote: "This email was sent because you signed up for Ditto.",
  },
  it: {
    preview: "Verifica la tua email per attivare l'account Ditto.",
    heading: (name) => `Benvenuto, ${name} 👋`,
    intro:
      "Grazie per esserti unito a Ditto. Ultimo passaggio: verifica la tua email per attivare l'account e iniziare a creare.",
    featuresTitle: "Ecco cosa puoi fare con Ditto",
    features: [
      {
        bold: "Estrarre un intero design system",
        rest: " da qualsiasi URL in ~30 secondi — colori, tipografia, spacing, ombre, componenti.",
      },
      {
        bold: "Fondere da 2 a 10 siti",
        rest: " in un ibrido unico: scegli le ispirazioni, regola il mood e ottieni un design system mai visto prima.",
      },
      {
        bold: "Anteprima su 6 layout reali",
        rest: " — Landing, Dashboard, Auth, Pricing, Blog e un catalogo Componenti — tutti tematizzati live con i tuoi token.",
      },
      {
        bold: "Scaricare kit pronti per la produzione",
        rest: ": Dev Kit (Storybook + Tailwind + token CSS + TypeScript + token Figma), tema WordPress block-based, o il Complete Kit con pagine HTML e componenti React.",
      },
      {
        bold: "Inviare i token direttamente in Figma",
        rest: " via Tokens Studio o Variables API.",
      },
    ],
    creditsHint: {
      pre: "Ti regaliamo ",
      bold: "300 crediti gratuiti",
      post: " — sufficienti per circa 3 estrazioni o 6 unlock.",
    },
    cta: "Verifica la mia email",
    expiryNote: "Questo link scade tra 24 ore.",
    ignoreNote: "Se non hai creato un account, puoi tranquillamente ignorare questa email.",
    signoff: "— Il team di Ditto",
    footerNote: "Questa email è stata inviata perché ti sei registrato a Ditto.",
  },
  fr: {
    preview: "Vérifiez votre email pour activer votre compte Ditto.",
    heading: (name) => `Bienvenue, ${name} 👋`,
    intro:
      "Merci d'avoir rejoint Ditto. Dernière étape : vérifiez votre email pour activer votre compte et commencer à créer.",
    featuresTitle: "Voici ce que vous pouvez faire sur Ditto",
    features: [
      {
        bold: "Extraire un design system complet",
        rest: " depuis n'importe quelle URL en ~30 secondes — couleurs, typographie, espacements, ombres, composants.",
      },
      {
        bold: "Fusionner 2 à 10 sites",
        rest: " en un hybride unique : choisissez vos inspirations, ajustez l'ambiance et obtenez un design system inédit.",
      },
      {
        bold: "Prévisualiser sur 6 vraies mises en page",
        rest: " — Landing, Dashboard, Auth, Pricing, Blog et un catalogue de Composants — thémisées en live avec vos tokens.",
      },
      {
        bold: "Télécharger des kits prêts pour la production",
        rest: " : Dev Kit (Storybook + Tailwind + tokens CSS + TypeScript + tokens Figma), thème WordPress block, ou le Complete Kit avec pages HTML et composants React.",
      },
      {
        bold: "Envoyer les tokens directement dans Figma",
        rest: " via Tokens Studio ou l'API Variables.",
      },
    ],
    creditsHint: {
      pre: "Vous démarrez avec ",
      bold: "300 crédits offerts",
      post: " — de quoi faire environ 3 extractions ou 6 déblocages.",
    },
    cta: "Vérifier mon email",
    expiryNote: "Ce lien expire dans 24 heures.",
    ignoreNote: "Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.",
    signoff: "— L'équipe Ditto",
    footerNote: "Email envoyé suite à votre inscription sur Ditto.",
  },
  es: {
    preview: "Verifica tu email para activar tu cuenta de Ditto.",
    heading: (name) => `Bienvenido, ${name} 👋`,
    intro:
      "Gracias por unirte a Ditto. Último paso: verifica tu email para activar la cuenta y empezar a crear.",
    featuresTitle: "Esto es lo que puedes hacer en Ditto",
    features: [
      {
        bold: "Extraer un design system completo",
        rest: " desde cualquier URL en ~30 segundos — colores, tipografía, espaciado, sombras, componentes.",
      },
      {
        bold: "Combinar entre 2 y 10 sitios",
        rest: " en un híbrido único: elige inspiraciones, ajusta el estado de ánimo y obtén un sistema de diseño que nunca ha existido.",
      },
      {
        bold: "Previsualizar en 6 layouts reales",
        rest: " — Landing, Dashboard, Auth, Pricing, Blog y un catálogo de Componentes — todos estilizados en vivo con tus tokens.",
      },
      {
        bold: "Descargar kits listos para producción",
        rest: ": Dev Kit (Storybook + Tailwind + tokens CSS + TypeScript + tokens Figma), tema WordPress en bloques, o el Complete Kit con páginas HTML y componentes React.",
      },
      {
        bold: "Enviar los tokens directamente a Figma",
        rest: " mediante Tokens Studio o la API de Variables.",
      },
    ],
    creditsHint: {
      pre: "Empiezas con ",
      bold: "300 créditos gratis",
      post: " — suficientes para unas 3 extracciones o 6 desbloqueos.",
    },
    cta: "Verificar mi email",
    expiryNote: "Este enlace caduca en 24 horas.",
    ignoreNote: "Si no has creado una cuenta, puedes ignorar este email.",
    signoff: "— El equipo de Ditto",
    footerNote: "Email enviado porque te registraste en Ditto.",
  },
};

export const VERIFY_SUBJECT: Record<Locale, string> = {
  en: "Welcome to Ditto — verify your email",
  it: "Benvenuto su Ditto — verifica la tua email",
  fr: "Bienvenue sur Ditto — vérifiez votre email",
  es: "Bienvenido a Ditto — verifica tu email",
};

export function VerificationEmail({
  name,
  verifyUrl,
  locale = "en",
}: VerificationEmailProps) {
  const c = COPY[locale] ?? COPY.en;

  return (
    <Layout preview={c.preview} locale={locale} footerNote={c.footerNote}>
      <Signature />
      <Heading>{c.heading(name)}</Heading>
      <Lead>{c.intro}</Lead>

      <Body14
        style={{
          color: tokens.textStrong,
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.4px",
          textTransform: "uppercase",
          margin: "4px 0 14px",
        }}
      >
        {c.featuresTitle}
      </Body14>

      <div style={{ margin: "0 0 22px" }}>
        {c.features.map((f, i) => (
          <FeatureItem key={i}>
            <strong style={{ color: tokens.textStrong, fontWeight: 700 }}>
              {f.bold}
            </strong>
            {f.rest}
          </FeatureItem>
        ))}
      </div>

      <Callout tone="primary">
        {c.creditsHint.pre}
        <strong style={{ color: tokens.primary, fontWeight: 700 }}>
          {c.creditsHint.bold}
        </strong>
        {c.creditsHint.post}
      </Callout>

      <PrimaryButton href={verifyUrl}>{c.cta}</PrimaryButton>

      <Small style={{ margin: "26px 0 0" }}>
        {c.expiryNote} {c.ignoreNote}
      </Small>

      <Muted style={{ margin: "18px 0 0" }}>{c.signoff}</Muted>
    </Layout>
  );
}

VerificationEmail.PreviewProps = {
  name: "Cristiano",
  verifyUrl: "https://dittodesign.dev/api/auth/verify-email?token=preview",
  locale: "en",
} satisfies VerificationEmailProps;

export default VerificationEmail;

import {
  Body14,
  Divider,
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
}

export function welcomeGiftSubject(credits: number): string {
  return `A little thank-you from Ditto — ${credits.toLocaleString("en-US")} credits for you`;
}

export function WelcomeGiftEmail({
  name,
  credits = 1000,
}: WelcomeGiftEmailProps) {
  const safeName = name?.trim() || "there";
  const safeNameIt = name?.trim() || "ciao";
  const enCredits = credits.toLocaleString("en-US");
  const itCredits = credits.toLocaleString("it-IT");

  return (
    <Layout
      preview={`A thank-you from Ditto — ${enCredits} credits added to your account.`}
      locale="en"
      footerNote="Sent with thanks from the Ditto team."
    >
      {/* English */}
      <Signature />
      <Heading>Hi {safeName},</Heading>
      <Lead>
        {"Thank you for using Ditto — it genuinely means a lot to us that you've chosen our platform as part of your workflow."}
      </Lead>
      <Body14>
        {"As a small token of our appreciation, we've added "}
        <strong style={{ color: tokens.primary, fontWeight: 700 }}>
          {enCredits} credits
        </strong>
        {" to your account. They're already available and ready to use whenever you need them."}
      </Body14>
      <Body14>
        {"If you have any feedback, ideas, or run into anything we can help with, just reply to this email — we'd love to hear from you."}
      </Body14>
      <Body14>Thanks again for being part of Ditto.</Body14>

      <div style={{ marginTop: 20 }}>
        <Body14 style={{ margin: "0 0 2px" }}>Best,</Body14>
        <Body14
          style={{
            margin: "0 0 2px",
            color: tokens.textStrong,
            fontWeight: 700,
          }}
        >
          William
        </Body14>
        <Muted>The Ditto Team</Muted>
      </div>

      <Divider />

      {/* Italian */}
      <Muted
        style={{
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          fontSize: 10,
          margin: "0 0 14px",
        }}
      >
        Versione italiana
      </Muted>
      <Signature />
      <Heading>Ciao {safeNameIt},</Heading>
      <Lead>
        Grazie per aver scelto Ditto — significa davvero molto per noi che tu
        abbia deciso di includere la nostra piattaforma nel tuo flusso di lavoro.
      </Lead>
      <Body14>
        Come piccolo segno di apprezzamento, abbiamo aggiunto{" "}
        <strong style={{ color: tokens.primary, fontWeight: 700 }}>
          {itCredits} crediti
        </strong>{" "}
        al tuo account. Sono già disponibili e pronti per essere usati quando ti
        servono.
      </Body14>
      <Body14>
        Se hai qualche feedback, idee o qualcosa in cui possiamo aiutarti,
        rispondi pure a questa email — ci fa piacere sentirti.
      </Body14>
      <Body14>Grazie ancora per far parte di Ditto.</Body14>

      <div style={{ marginTop: 20 }}>
        <Body14 style={{ margin: "0 0 2px" }}>Un saluto,</Body14>
        <Body14
          style={{
            margin: "0 0 2px",
            color: tokens.textStrong,
            fontWeight: 700,
          }}
        >
          William
        </Body14>
        <Muted>Il team di Ditto</Muted>
      </div>
    </Layout>
  );
}

WelcomeGiftEmail.PreviewProps = {
  name: "Cristiano",
  credits: 1000,
} satisfies WelcomeGiftEmailProps;

export default WelcomeGiftEmail;

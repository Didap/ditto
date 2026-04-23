import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

export const tokens = {
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceRaised: "#1e1e1e",
  border: "rgba(161,161,161,0.18)",
  borderStrong: "rgba(161,161,161,0.28)",
  text: "#ededed",
  textStrong: "#ffffff",
  muted: "#9ca3af",
  mutedStrong: "#c7c9cc",
  primary: "#03e65b",
  primaryInk: "#06190c",
  accent: "#ff3386",
  info: "#33d0ff",
  amber: "#ffc533",
  fontSans:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif',
  fontDisplay:
    '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  fontMono:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const;

const rootBody: CSSProperties = {
  backgroundColor: tokens.bg,
  margin: 0,
  padding: "40px 16px",
  fontFamily: tokens.fontSans,
  color: tokens.text,
  WebkitFontSmoothing: "antialiased",
};

const container: CSSProperties = {
  maxWidth: 560,
  width: "100%",
  margin: "0 auto",
};

const logoRow: CSSProperties = {
  padding: "0 4px 24px",
};

const wordmark: CSSProperties = {
  fontFamily: tokens.fontDisplay,
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: "-0.4px",
  color: tokens.textStrong,
  margin: 0,
  lineHeight: "28px",
  display: "inline-block",
  verticalAlign: "middle",
  paddingLeft: 10,
};

const blobWrap: CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle",
  lineHeight: 0,
};

const surface: CSSProperties = {
  backgroundColor: tokens.surface,
  border: `1px solid ${tokens.border}`,
  borderRadius: 14,
  padding: "36px 32px",
};

const footer: CSSProperties = {
  padding: "20px 4px 0",
};

const footerLine: CSSProperties = {
  fontSize: 11,
  lineHeight: "18px",
  color: tokens.muted,
  margin: 0,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
};

const footerSub: CSSProperties = {
  fontSize: 11,
  lineHeight: "18px",
  color: tokens.muted,
  margin: "4px 0 0",
};

export function Layout({
  preview,
  locale = "en",
  children,
  footerNote,
}: {
  preview: string;
  locale?: string;
  children: ReactNode;
  footerNote?: string;
}) {
  return (
    <Html lang={locale}>
      <Head>
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="dark light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={rootBody}>
        <Container style={container}>
          <Section style={logoRow}>
            <span style={blobWrap}>
              <BrandBlob />
            </span>
            <span style={wordmark}>Ditto</span>
          </Section>

          <Section style={surface}>{children}</Section>

          <Section style={footer}>
            <Text style={footerLine}>Ditto — Design System Extractor</Text>
            {footerNote ? <Text style={footerSub}>{footerNote}</Text> : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function BrandBlob() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="blob-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tokens.primary} />
          <stop offset="55%" stopColor={tokens.info} />
          <stop offset="100%" stopColor={tokens.amber} />
        </linearGradient>
      </defs>
      <path
        d="M15 1.2c5.6 0 11.4 3.8 12.6 8.7 1.2 4.9-2 10.2-5.9 13.4-3.9 3.2-8.9 4.3-12.5 2.3C5.5 23.6 3 19.8 2 15.6 1 11.4 1.6 6.9 4.7 4.1 7.8 1.3 12.2 1.2 15 1.2Z"
        fill="url(#blob-g)"
      />
    </svg>
  );
}

export function Signature({ color = tokens.primary }: { color?: string }) {
  return (
    <div
      style={{
        width: 28,
        height: 2,
        backgroundColor: color,
        borderRadius: 2,
        margin: "0 0 18px",
      }}
    />
  );
}

const headingStyle: CSSProperties = {
  fontFamily: tokens.fontDisplay,
  fontSize: 26,
  lineHeight: "32px",
  fontWeight: 800,
  letterSpacing: "-0.5px",
  color: tokens.textStrong,
  margin: "0 0 14px",
};

const leadStyle: CSSProperties = {
  fontSize: 15,
  lineHeight: "24px",
  color: tokens.mutedStrong,
  margin: "0 0 22px",
};

const bodyStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: "22px",
  color: tokens.text,
  margin: "0 0 14px",
};

const mutedStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: "20px",
  color: tokens.muted,
  margin: "0",
};

const smallStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: "18px",
  color: tokens.muted,
  margin: "0",
};

export function Heading({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <h1 style={{ ...headingStyle, ...style }}>{children}</h1>;
}

export function Lead({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <Text style={{ ...leadStyle, ...style }}>{children}</Text>;
}

export function Body14({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <Text style={{ ...bodyStyle, ...style }}>{children}</Text>;
}

export function Muted({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <Text style={{ ...mutedStyle, ...style }}>{children}</Text>;
}

export function Small({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <Text style={{ ...smallStyle, ...style }}>{children}</Text>;
}

export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: tokens.primary,
        color: tokens.primaryInk,
        fontFamily: tokens.fontDisplay,
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: "-0.1px",
        padding: "13px 26px",
        borderRadius: 10,
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {children}
    </Button>
  );
}

export function FeatureItem({ children }: { children: ReactNode }) {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{ borderCollapse: "collapse", width: "100%", margin: "0 0 10px" }}
    >
      <tbody>
        <tr>
          <td
            style={{
              width: 22,
              verticalAlign: "top",
              paddingTop: 9,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: 1,
                backgroundColor: tokens.primary,
              }}
            />
          </td>
          <td
            style={{
              fontSize: 14,
              lineHeight: "22px",
              color: tokens.text,
              verticalAlign: "top",
            }}
          >
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function Callout({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "neutral";
}) {
  const accent = tone === "primary" ? tokens.primary : tokens.mutedStrong;
  return (
    <Section
      style={{
        backgroundColor: tokens.bg,
        border: `1px solid ${tokens.border}`,
        borderRadius: 10,
        padding: "14px 16px",
        margin: "0 0 22px",
      }}
    >
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <tbody>
          <tr>
            <td style={{ width: 24, verticalAlign: "top", paddingTop: 6 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: accent,
                  boxShadow: `0 0 0 3px ${accent}22`,
                }}
              />
            </td>
            <td
              style={{
                fontSize: 13,
                lineHeight: "20px",
                color: tokens.mutedStrong,
              }}
            >
              {children}
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export function ReceiptTable({ children }: { children: ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: tokens.bg,
        border: `1px solid ${tokens.border}`,
        borderRadius: 12,
        padding: 6,
        margin: "0 0 26px",
      }}
    >
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        border={0}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: tokens.fontSans,
        }}
      >
        <tbody>{children}</tbody>
      </table>
    </Section>
  );
}

export function ReceiptRow({
  label,
  value,
  emphasis,
  divider,
}: {
  label: string;
  value: ReactNode;
  emphasis?: "primary" | "strong";
  divider?: boolean;
}) {
  const valueColor =
    emphasis === "primary"
      ? tokens.primary
      : emphasis === "strong"
        ? tokens.textStrong
        : tokens.text;
  const weight = emphasis ? 700 : 500;
  return (
    <tr style={divider ? { borderTop: `1px solid ${tokens.border}` } : undefined}>
      <td
        style={{
          padding: "12px 14px",
          fontSize: 12,
          lineHeight: "16px",
          color: tokens.muted,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "12px 14px",
          fontSize: 14,
          lineHeight: "20px",
          color: valueColor,
          fontWeight: weight,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export function Divider({ style }: { style?: CSSProperties }) {
  return (
    <Hr
      style={{
        border: 0,
        borderTop: `1px solid ${tokens.border}`,
        margin: "28px 0",
        ...style,
      }}
    />
  );
}

export const emailStyles = {
  headingStyle,
  leadStyle,
  bodyStyle,
  mutedStyle,
  smallStyle,
};

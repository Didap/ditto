import type { Metadata } from "next";
import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { CursorFollower } from "@/components/CursorFollower";
import { QuestsWidget } from "@/components/QuestsWidget";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { CreditsProvider } from "@/lib/credits-context";
import { OnboardingProvider } from "@/components/OnboardingProvider";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { canvaSans, leoSans } from "@/lib/fonts";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default:
      "Ditto: Design Systems for Claude, ChatGPT, Cursor, Stitch, Figma, WordPress, Elementor",
    template: "%s | Ditto",
  },
  description:
    "Extract a design system from any URL in 30 seconds. Export DESIGN.md for Claude, Cursor, ChatGPT, Lovable, v0, or the strict Google DESIGN.md spec for Stitch. Generate full WordPress FSE themes, Elementor themes, Figma tokens, Tailwind config, Storybook, React components.",
  keywords: [
    // Core category
    "design system",
    "design tokens",
    "DESIGN.md",
    "DESIGN.md generator",
    "design system generator",
    "CSS extraction",
    "reverse engineer website design",

    // AI coding tools
    "Claude design system",
    "Claude context file",
    "Cursor design tokens",
    "ChatGPT design system",
    "Lovable design context",
    "v0 design tokens",
    "Vercel v0",
    "Anthropic Claude",

    // Google Stitch
    "Google Stitch",
    "Stitch design.md",
    "Google DESIGN.md spec",
    "Stitch compatible",

    // Design tools
    "Figma tokens",
    "Figma Variables",
    "Tokens Studio",
    "Webflow AI",
    "Framer AI",

    // Developer exports
    "Tailwind config generator",
    "Storybook design system",
    "React components design tokens",
    "WordPress FSE theme",
    "Elementor theme generator",
    "Hello Elementor",
    "block theme generator",
  ],
  openGraph: {
    title:
      "Ditto: Design System Exporter for Claude, Stitch, Figma, WordPress & more",
    description:
      "Extract a design system from any URL. Export to Claude, Cursor, ChatGPT, Stitch (Google), Lovable, v0, Figma, WordPress, Elementor, Tailwind, Storybook, React. One click, in 30 seconds.",
    url: "https://ditto.design",
    siteName: "Ditto",
    type: "website",
    images: [
      {
        url: "https://ditto.design/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ditto: Extract design systems for Claude, Stitch, Figma, WordPress",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Ditto: Design Systems for Claude, Cursor, Stitch, Figma, WordPress",
    description:
      "Paste any URL → 100+ tokens in 30 seconds → export to Claude, Stitch, Figma, WordPress. Free DESIGN.md generator.",
    images: ["https://ditto.design/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://ditto.design",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/icon-192.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let user: { id: string; name: string; email: string; avatarUrl: string | null } | null = null;
  if (session?.user?.id) {
    const [row] = await db
      .select({
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    if (row) {
      user = {
        id: session.user.id,
        name: row.name,
        email: row.email,
        avatarUrl: row.avatarUrl,
      };
    }
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://ditto.design/#organization",
        name: "Ditto",
        url: "https://ditto.design",
        logo: "https://ditto.design/icon-512.png",
        description:
          "Design system extraction tool that reverse-engineers websites and blends multiple inspirations into unique design tokens.",
      },
      {
        "@type": "WebSite",
        "@id": "https://ditto.design/#website",
        url: "https://ditto.design",
        name: "Ditto",
        publisher: { "@id": "https://ditto.design/#organization" },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://ditto.design/#app",
        name: "Ditto",
        description:
          "Extract design systems from any website and blend multiple inspirations into unique design tokens.",
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: "https://ditto.design",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "19",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "19",
              priceCurrency: "USD",
              billingDuration: "P1M",
            },
          },
          {
            "@type": "Offer",
            name: "Team",
            price: "49",
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "49",
              priceCurrency: "USD",
              billingDuration: "P1M",
            },
          },
        ],
        featureList: [
          "Design system extraction from any URL",
          "Blend 2-10 website inspirations",
          "100+ design tokens in 30 seconds",
          "6 live preview templates",
          "CSS variables and React component export",
          "Figma integration",
        ],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning className={`dark ${canvaSans.variable} ${leoSans.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("ditto-theme");if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.classList.add("light")}}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <CreditsProvider>
          <OnboardingProvider>
            <CursorFollower />
            <NavBar user={user} isAdmin={isAdminEmail(user?.email)} />
            <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
            <QuestsWidget authed={!!user} />
            <Suspense fallback={null}>
              <PostHogProvider user={user ? { id: user.id, email: user.email, name: user.name } : null} />
            </Suspense>
            <ConsentBanner />
          </OnboardingProvider>
        </CreditsProvider>
      </body>
    </html>
  );
}

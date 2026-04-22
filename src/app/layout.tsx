import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { CursorFollower } from "@/components/CursorFollower";
import { QuestsWidget } from "@/components/QuestsWidget";
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
    default: "Ditto — Extract Design Systems from Any Website",
    template: "%s | Ditto",
  },
  description:
    "Paste any URL and extract a complete design system in seconds. Blend multiple site inspirations into unique design tokens. Export CSS, React components, or push to Figma.",
  keywords: [
    "design system",
    "design tokens",
    "CSS extraction",
    "design system generator",
    "Figma tokens",
    "reverse engineer website design",
    "design inspiration tool",
  ],
  openGraph: {
    title: "Ditto — Extract Design Systems from Any Website",
    description:
      "Paste a URL, get 100+ design tokens in 30 seconds. Blend multiple sites into a unique design system.",
    url: "https://ditto.design",
    siteName: "Ditto",
    type: "website",
    images: [
      {
        url: "https://ditto.design/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ditto — Extract design systems from any website",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ditto — Extract Design Systems from Any Website",
    description:
      "Paste a URL, get 100+ design tokens in 30 seconds. Blend multiple sites into a unique design system.",
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
  let user: { name: string; email: string; avatarUrl: string | null } | null = null;
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
          </OnboardingProvider>
        </CreditsProvider>
      </body>
    </html>
  );
}

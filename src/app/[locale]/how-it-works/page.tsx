import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { HowItWorksClient } from "./how-it-works-client";

const VALID_LOCALES = new Set(["en", "it", "fr", "es"]);

export const metadata: Metadata = {
  title: "How it works",
};

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (VALID_LOCALES.has(raw) ? raw : "en") as Locale;

  return <HowItWorksClient locale={locale} />;
}

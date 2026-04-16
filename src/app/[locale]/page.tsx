import { getUser } from "@/lib/data";
import { LandingClient } from "./landing-client";
import type { Locale } from "@/lib/i18n";

const VALID_LOCALES = new Set(["en", "it", "fr", "es"]);

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (VALID_LOCALES.has(rawLocale) ? rawLocale : "en") as Locale;
  const user = await getUser();

  return <LandingClient locale={locale} isAuthenticated={!!user} />;
}

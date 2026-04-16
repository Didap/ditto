import { notFound } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/locale-context";

const VALID_LOCALES = new Set(LOCALES.map((l) => l.code));

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!VALID_LOCALES.has(locale as Locale)) {
    notFound();
  }

  return (
    <LocaleProvider locale={locale as Locale}>{children}</LocaleProvider>
  );
}

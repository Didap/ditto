"use client";

import { createContext, useContext, useCallback } from "react";
import { usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n";
import { t as translate, type TranslationKey } from "@/lib/i18n";

const LOCALE_SET = new Set<string>(LOCALES.map((l) => l.code));

const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT() {
  const locale = useContext(LocaleContext);
  return (key: TranslationKey) => translate(locale, key);
}

/** Returns the current locale extracted from pathname (client-side fallback) */
export function usePathnameLocale(): Locale {
  const pathname = usePathname();
  const seg = pathname.split("/")[1];
  return LOCALE_SET.has(seg) ? (seg as Locale) : "en";
}

/** Returns a function that prefixes paths with the current locale */
export function useLocalePath() {
  const locale = usePathnameLocale();
  return useCallback(
    (path: string) => `/${locale}${path === "/" ? "" : path}`,
    [locale],
  );
}

/** Strip locale prefix from pathname to get the bare path */
export function useBarePath(): string {
  const pathname = usePathname();
  const seg = pathname.split("/")[1];
  if (LOCALE_SET.has(seg)) {
    return pathname.replace(`/${seg}`, "") || "/";
  }
  return pathname;
}

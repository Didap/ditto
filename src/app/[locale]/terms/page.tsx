import type { Metadata } from "next";
import { t, type Locale } from "@/lib/i18n";

const VALID_LOCALES = new Set(["en", "it", "fr", "es"]);

export const metadata: Metadata = {
  title: "Terms and Conditions",
};

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (VALID_LOCALES.has(raw) ? raw : "en") as Locale;

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold tracking-tight text-(--ditto-text) mb-2">
        {t(locale, "termsTitle")}
      </h1>
      <p className="text-sm text-(--ditto-text-muted) mb-10">
        {t(locale, "termsLastUpdated")}
      </p>

      <div className="prose-ditto space-y-8 text-sm text-(--ditto-text-secondary) leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">{t(locale, "termsSection1Title")}</h2>
          <p>{t(locale, "termsSection1Body")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">{t(locale, "termsSection2Title")}</h2>
          <p>{t(locale, "termsSection2Body")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">{t(locale, "termsSection3Title")}</h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>{t(locale, "termsSection3Item1")}</li>
            <li>{t(locale, "termsSection3Item2")}</li>
            <li>{t(locale, "termsSection3Item3")}</li>
            <li>{t(locale, "termsSection3Item4")}</li>
            <li>{t(locale, "termsSection3Item5")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">{t(locale, "termsSection4Title")}</h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>{t(locale, "termsSection4Item1")}</li>
            <li>{t(locale, "termsSection4Item2")}</li>
            <li>{t(locale, "termsSection4Item3")}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">{t(locale, "termsSection5Title")}</h2>
          <p>{t(locale, "termsSection5Body")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">{t(locale, "termsSection6Title")}</h2>
          <p>{t(locale, "termsSection6Body")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">{t(locale, "termsSection7Title")}</h2>
          <p>{t(locale, "termsSection7Body")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">{t(locale, "termsSection8Title")}</h2>
          <p>{t(locale, "termsSection8Body")}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-(--ditto-text) mb-3">{t(locale, "termsSection9Title")}</h2>
          <p>
            {t(locale, "termsSection9Body")}{" "}
            <a href="mailto:support@ditto.design" className="text-(--ditto-primary) underline underline-offset-2">
              support@ditto.design
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

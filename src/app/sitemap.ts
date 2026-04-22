import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";

const BASE_URL = "https://dittodesign.dev";
const DEFAULT_LOCALE = "en";

// Public, user-facing pages (kept in sync with PUBLIC_PATHS in src/proxy.ts).
// Each is served per-locale at `/{locale}{path}`.
const PUBLIC_PAGES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/register", changeFrequency: "yearly", priority: 0.6 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, changeFrequency, priority } of PUBLIC_PAGES) {
    // hreflang alternates for this logical page across all locales
    const languages: Record<string, string> = {};
    for (const { code } of LOCALES) {
      languages[code] = `${BASE_URL}/${code}${path}`;
    }
    languages["x-default"] = `${BASE_URL}/${DEFAULT_LOCALE}${path}`;

    // Emit one entry per locale — each declares its alternates so Google
    // groups them as translations of the same page.
    for (const { code } of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${code}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages },
      });
    }
  }

  return entries;
}

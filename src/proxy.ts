import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { LOCALES, type Locale } from "@/lib/i18n";

const LOCALE_CODES = LOCALES.map((l) => l.code);
const DEFAULT_LOCALE: Locale = "en";
const LOCALE_SET = new Set<string>(LOCALE_CODES);

const PUBLIC_PATHS = ["/", "/login", "/register", "/pricing", "/how-it-works", "/terms"];

const { auth } = NextAuth(authConfig);

/** Extract locale prefix from pathname, e.g. "/it/pricing" → "it" */
function extractLocale(pathname: string): Locale | null {
  const seg = pathname.split("/")[1];
  return LOCALE_SET.has(seg) ? (seg as Locale) : null;
}

/** Detect preferred locale from headers */
function detectLocale(req: Request): Locale {
  // Geo headers (Vercel / Cloudflare)
  const country = (
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    ""
  ).toUpperCase();
  if (country === "IT") return "it";
  if (["FR"].includes(country)) return "fr";
  if (["ES", "MX", "AR", "CO", "CL"].includes(country)) return "es";
  if (country) return DEFAULT_LOCALE; // known country, not mapped → default

  // Accept-Language: parse q-values and pick highest-priority match
  // e.g. "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7" → it wins
  const accept = req.headers.get("accept-language") ?? "";
  const langs = accept
    .split(",")
    .map((part) => {
      const [lang, qPart] = part.trim().split(";");
      const q = qPart ? parseFloat(qPart.split("=")[1] || "1") : 1;
      return { code: lang.trim().slice(0, 2).toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { code } of langs) {
    if (LOCALE_SET.has(code)) return code as Locale;
  }

  return DEFAULT_LOCALE;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // ── Locale redirect: bare paths → /locale/path ──
  const locale = extractLocale(pathname);
  if (!locale) {
    // No locale prefix → redirect to detected locale
    const detected = detectLocale(req as unknown as Request);
    const url = req.nextUrl.clone();
    url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`;
    return Response.redirect(url, 307);
  }

  // ── Strip locale prefix for auth checks ──
  const barePath = pathname.replace(`/${locale}`, "") || "/";

  // Allow public routes and auth API
  if (
    PUBLIC_PATHS.includes(barePath) ||
    pathname.startsWith("/api/auth")
  ) {
    return;
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|pricing\\.md|site\\.webmanifest|api/|mcp(?:/|$)|.*\\.json|.*\\.gif|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp|.*\\.ico|.*\\.woff2?).*)"],
};

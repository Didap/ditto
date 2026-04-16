/** Geo-based pricing regions and launch coupon config */

export type PricingRegion = "it" | "eu" | "us";

export const LAUNCH_COUPON_ID = "DITTO_LAUNCH_30";
export const LAUNCH_COUPON_EXPIRES = new Date("2026-05-18T23:59:59Z");
export const LAUNCH_DISCOUNT = 0.3;

const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "LV", "LT", "LU", "MT", "NL", "PL",
  "PT", "RO", "SK", "SI", "ES", "SE",
]);

/** Detect pricing region from geo-IP headers (Vercel / Cloudflare).
 *  In local dev without geo headers, set PRICING_REGION=it|eu|us in .env */
export function detectRegion(headers: Headers): PricingRegion {
  // Env override for local development
  const envRegion = process.env.PRICING_REGION as PricingRegion | undefined;
  if (envRegion && ["it", "eu", "us"].includes(envRegion)) return envRegion;

  const country = (
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    ""
  ).toUpperCase();

  if (country === "IT") return "it";
  if (EU_COUNTRY_CODES.has(country)) return "eu";
  return "us"; // US + rest of world
}

export function isLaunchActive(): boolean {
  return new Date() < LAUNCH_COUPON_EXPIRES;
}

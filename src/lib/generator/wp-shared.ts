/**
 * Helpers shared between the WordPress block theme generator (`kit-wordpress.ts`)
 * and the WordPress plugin generator (`kit-wordpress-plugin.ts`). Pure string
 * and byte utilities — no token mapping lives here.
 */

export function slugDashed(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugUnderscore(s: string): string {
  return s.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
}

export function phpEscape(s: string): string {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

export function htmlEscape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Pick a readable text color against a primary background. */
export function onPrimaryColor(primary: string, fallbackDark: string): string {
  const hex = (primary || "#000000").replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return lum > 0.5 ? fallbackDark : "#ffffff";
}

export function normalizeFontFormat(format: string): string {
  const f = (format || "").toLowerCase();
  if (f === "woff2") return "woff2";
  if (f === "woff") return "woff";
  if (f === "otf") return "opentype";
  if (f === "ttf") return "truetype";
  if (f === "eot") return "embedded-opentype";
  return f || "woff2";
}

/** Best-effort weight extraction from filenames like "0-Family-300.woff2". */
export function parseWeightFromFilename(filename: string): string {
  const m = filename.match(/-(\d{3})\.(?:woff2?|otf|ttf|eot)$/i);
  return m ? m[1] : "400";
}

/** Best-effort italic detection. */
export function parseStyleFromFilename(filename: string): string {
  return /italic/i.test(filename) ? "italic" : "normal";
}

export async function fetchFontBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export interface SharedFontFaceEntry {
  filename: string;
  format: string;
  weight: string;
  style: string;
}

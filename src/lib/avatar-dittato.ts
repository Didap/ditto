/**
 * Dittato avatar generator.
 *
 * Deterministic geometric avatars inspired by Boring Avatars' "beam" style,
 * but using the Ditto brand palette (lavender + primary green + accent pink +
 * warm yellow). Pure function, renders to SVG string — no deps.
 *
 * Storage convention (field `users.avatarUrl`):
 *   - `null`                     → no avatar set (render with email as seed)
 *   - `"dittato:<seed>"`         → user saved a generated avatar
 *   - `"https://..."`            → uploaded photo (Cloudinary, etc.)
 */

const PALETTE = [
  "#c4a8d8", // lavender — Ditto pokemon
  "#03e65b", // primary green
  "#2aff7a", // primary hover
  "#ff3386", // accent pink
  "#ffc533", // warm yellow
  "#8b5cf6", // secondary violet
  "#6366f1", // indigo
];

const DARK_TEXT = "#0f172a";

const DITTATO_PREFIX = "dittato:";

// ── Hash ────────────────────────────────────────────────────────────────

function fnv1a(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** Deterministic PRNG seeded from the hash — cheap xorshift. */
function makeRng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10_000) / 10_000;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Seed normalization ─────────────────────────────────────────────────

/** Turn a fallback input (email, user id) into a clean seed. */
export function normalizeSeed(raw: string): string {
  return (raw || "dittato").trim().toLowerCase();
}

/** Read the seed from whatever is stored in avatarUrl. Returns null if not a dittato avatar. */
export function extractDittatoSeed(value: string | null | undefined): string | null {
  if (!value || !value.startsWith(DITTATO_PREFIX)) return null;
  return value.slice(DITTATO_PREFIX.length);
}

export function encodeDittatoSeed(seed: string): string {
  return `${DITTATO_PREFIX}${seed}`;
}

/** Whether avatarUrl points to a real uploaded image (http/https). */
export function isUploadedAvatar(value: string | null | undefined): boolean {
  return !!value && /^https?:\/\//.test(value);
}

/** Generate a random seed — used by the "shuffle" button. */
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ── SVG generator ──────────────────────────────────────────────────────

export interface DittatoAvatarOptions {
  /** Seed string — anything stable (email, user id, random). */
  seed: string;
  /** Pixel size (the SVG is a square). */
  size?: number;
  /** Round mask. Default true. */
  round?: boolean;
}

/**
 * Build an SVG avatar for the given seed. Returns a self-contained `<svg>` string
 * that can be embedded inline or as a data URL.
 */
export function dittatoAvatarSvg({ seed, size = 80, round = true }: DittatoAvatarOptions): string {
  const rng = makeRng(fnv1a(normalizeSeed(seed)));

  // Two layered colors for bg + shape; always different
  const bg = pick(rng, PALETTE);
  let shape = pick(rng, PALETTE);
  if (shape === bg) shape = PALETTE[(PALETTE.indexOf(bg) + 3) % PALETTE.length];

  // Eye/mouth stroke: dark text vs white, biased by bg brightness
  const bgIsLight = isLight(bg);
  const faceStroke = bgIsLight ? DARK_TEXT : "#ffffff";

  // Choose layout: "beam" style (2 stacked shapes + 2 eye dots + mouth arc)
  const rotate = Math.floor(rng() * 360);
  const translateX = Math.floor(rng() * 30) - 15;
  const translateY = Math.floor(rng() * 30) - 15;

  const shapeType = rng() < 0.5 ? "circle" : "rect";
  const shapeR = 32 + Math.floor(rng() * 20);

  // Eye positions — biased towards the upper half
  const eyeY = 32 + Math.floor(rng() * 8);
  const eyeDx = 10 + Math.floor(rng() * 4);

  // Mouth — quadratic arc, curvature depends on rng
  const mouthY = 55 + Math.floor(rng() * 6);
  const mouthCurve = 4 + Math.floor(rng() * 6);

  const clip = round
    ? `<clipPath id="clip"><rect width="80" height="80" rx="40" ry="40"/></clipPath>`
    : `<clipPath id="clip"><rect width="80" height="80"/></clipPath>`;

  const shapeSvg =
    shapeType === "circle"
      ? `<circle cx="40" cy="40" r="${shapeR}" fill="${shape}" transform="translate(${translateX} ${translateY}) rotate(${rotate} 40 40)"/>`
      : `<rect x="${40 - shapeR}" y="${40 - shapeR}" width="${shapeR * 2}" height="${shapeR * 2}" fill="${shape}" transform="translate(${translateX} ${translateY}) rotate(${rotate} 40 40)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="${size}" height="${size}" fill="none" role="img" aria-label="Avatar">
<defs>${clip}</defs>
<g clip-path="url(#clip)">
<rect width="80" height="80" fill="${bg}"/>
${shapeSvg}
<g transform="translate(40 40)">
<circle cx="${-eyeDx}" cy="${eyeY - 40}" r="1.8" fill="${faceStroke}"/>
<circle cx="${eyeDx}" cy="${eyeY - 40}" r="1.8" fill="${faceStroke}"/>
<path d="M ${-eyeDx} ${mouthY - 40} Q 0 ${mouthY - 40 + mouthCurve} ${eyeDx} ${mouthY - 40}" stroke="${faceStroke}" stroke-width="1.5" stroke-linecap="round" fill="none"/>
</g>
</g>
</svg>`;
}

/** Base64-encoded data URL, safe to use in `<img src>` or CSS. */
export function dittatoAvatarDataUrl(seed: string, size = 80): string {
  const svg = dittatoAvatarSvg({ seed, size });
  // SVG is pure ASCII (all our strings use plain chars), so btoa is safe here.
  const base64 =
    typeof window !== "undefined"
      ? window.btoa(svg)
      : Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

// ── Colour math helpers ───────────────────────────────────────────────

function isLight(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Perceived brightness (ITU-R BT.601)
  return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}

// ── Resolver: storage value → rendering hint ──────────────────────────

export interface ResolvedAvatar {
  kind: "uploaded" | "dittato";
  /** For `uploaded`: the URL; for `dittato`: the data URL of the generated SVG. */
  src: string;
  /** For `dittato` only — the seed that produced it (useful for shuffling). */
  seed?: string;
}

/**
 * Given the DB field and a fallback seed (typically the user's email or id),
 * return a ready-to-render avatar descriptor.
 */
export function resolveAvatar(
  avatarUrl: string | null | undefined,
  fallbackSeed: string,
  size = 80,
): ResolvedAvatar {
  if (isUploadedAvatar(avatarUrl)) {
    return { kind: "uploaded", src: avatarUrl as string };
  }
  const seed = extractDittatoSeed(avatarUrl) ?? normalizeSeed(fallbackSeed);
  return { kind: "dittato", src: dittatoAvatarDataUrl(seed, size), seed };
}

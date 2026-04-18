import { PNG } from "pngjs";

/**
 * Pixel-level analysis of the Puppeteer screenshot.
 *
 * Used as a "visual ground truth" to corroborate the CSS-based token
 * extraction: some colors only appear in rendered images/SVGs (invisible to
 * getComputedStyle), and some CSS-extracted colors rank too high simply
 * because they're set on invisible wrapper elements. Correlating rendered
 * pixels with DOM bounding rects (see `sampleRects`) gives us the actual
 * visible color of buttons/CTAs regardless of gradients, background-images,
 * or filters.
 *
 * No AI, no external APIs — median-cut quantization in ~200 LoC.
 */

export interface RectSample {
  /** Stable identifier for the source, e.g. "button-0" or "card-2". */
  id: string;
  /** Bounding rect in CSS pixels at the screenshot's device-pixel ratio. */
  rect: { x: number; y: number; w: number; h: number };
}

export interface SampledColor {
  hex: string;
  count: number;
}

export interface PixelAnalysis {
  /** Overall dominant colors, quantized across the whole screenshot. */
  dominantColors: SampledColor[];
  /** Header strip (top N px) dominant colors. */
  headerColors: SampledColor[];
  /** Hero region (upper 40%) dominant colors. */
  heroColors: SampledColor[];
  /** Per-rect dominant color for elements the caller asked about. */
  rectColors: Array<{ id: string; hex: string; alpha: number }>;
  /** Luminance bucket counts — used to judge dark vs light theme. */
  lightness: {
    dark: number; // pct of pixels with luma < 0.2
    mid: number; // pct with 0.2 ≤ luma ≤ 0.8
    light: number; // pct with luma > 0.8
  };
}

/**
 * Parse a base64 PNG data URL or plain base64 into a PNG instance.
 * Accepts either "data:image/png;base64,xxx" or just "xxx".
 */
export function parsePng(base64OrDataUrl: string): PNG {
  const commaIdx = base64OrDataUrl.indexOf(",");
  const b64 = commaIdx >= 0 ? base64OrDataUrl.slice(commaIdx + 1) : base64OrDataUrl;
  const buf = Buffer.from(b64, "base64");
  return PNG.sync.read(buf);
}

/**
 * Run all the pixel analyses the extractor needs. One parse, many reads.
 */
export function analyzeScreenshot(
  base64PngOrDataUrl: string,
  rectSamples: RectSample[] = []
): PixelAnalysis | null {
  try {
    const png = parsePng(base64PngOrDataUrl);

    const dominantColors = quantizePalette(png, 14, /*stride*/ 6);
    const headerColors = quantizePalette(png, 6, /*stride*/ 3, {
      y0: 0,
      y1: Math.min(120, Math.floor(png.height * 0.12)),
    });
    const heroColors = quantizePalette(png, 10, /*stride*/ 5, {
      y0: Math.floor(png.height * 0.05),
      y1: Math.floor(png.height * 0.45),
    });

    const rectColors: Array<{ id: string; hex: string; alpha: number }> = [];
    for (const rs of rectSamples) {
      const sampled = sampleRect(png, rs.rect);
      if (sampled) rectColors.push({ id: rs.id, ...sampled });
    }

    const lightness = measureLightness(png);

    return {
      dominantColors,
      headerColors,
      heroColors,
      rectColors,
      lightness,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Median-cut color quantization
// ─────────────────────────────────────────────────────────────────────────────

interface RgbPixel {
  r: number;
  g: number;
  b: number;
}

interface Region {
  y0: number;
  y1: number;
}

function quantizePalette(
  png: PNG,
  k: number,
  stride: number,
  region?: Region
): SampledColor[] {
  const y0 = region?.y0 ?? 0;
  const y1 = region?.y1 ?? png.height;
  const pixels: RgbPixel[] = [];

  for (let y = y0; y < y1; y += stride) {
    for (let x = 0; x < png.width; x += stride) {
      const idx = (png.width * y + x) * 4;
      const a = png.data[idx + 3];
      if (a < 200) continue; // skip semi-transparent
      pixels.push({
        r: png.data[idx],
        g: png.data[idx + 1],
        b: png.data[idx + 2],
      });
    }
  }

  if (pixels.length === 0) return [];

  const buckets = medianCut(pixels, k);
  const result: SampledColor[] = buckets
    .map((bucket) => {
      const avg = averageColor(bucket);
      return { hex: toHex(avg), count: bucket.length };
    })
    .sort((a, b) => b.count - a.count);

  // Deduplicate near-identical colors (happens when a bucket splits badly).
  const dedup: SampledColor[] = [];
  for (const c of result) {
    if (dedup.some((d) => colorDistance(d.hex, c.hex) < 8)) continue;
    dedup.push(c);
  }
  return dedup.slice(0, k);
}

function medianCut(pixels: RgbPixel[], targetBuckets: number): RgbPixel[][] {
  const buckets: RgbPixel[][] = [pixels];
  while (buckets.length < targetBuckets) {
    // Find the bucket with the largest range along any axis
    let worstBucket = -1;
    let worstRange = 0;
    let worstAxis: "r" | "g" | "b" = "r";
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      if (b.length < 2) continue;
      const { range, axis } = largestRange(b);
      if (range > worstRange) {
        worstRange = range;
        worstBucket = i;
        worstAxis = axis;
      }
    }
    if (worstBucket < 0) break;
    const [a, bSplit] = splitBucket(buckets[worstBucket], worstAxis);
    buckets.splice(worstBucket, 1, a, bSplit);
  }
  return buckets.filter((b) => b.length > 0);
}

function largestRange(bucket: RgbPixel[]): { range: number; axis: "r" | "g" | "b" } {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const p of bucket) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }
  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;
  if (rRange >= gRange && rRange >= bRange) return { range: rRange, axis: "r" };
  if (gRange >= bRange) return { range: gRange, axis: "g" };
  return { range: bRange, axis: "b" };
}

function splitBucket(
  bucket: RgbPixel[],
  axis: "r" | "g" | "b"
): [RgbPixel[], RgbPixel[]] {
  const sorted = [...bucket].sort((a, b) => a[axis] - b[axis]);
  const mid = Math.floor(sorted.length / 2);
  return [sorted.slice(0, mid), sorted.slice(mid)];
}

function averageColor(bucket: RgbPixel[]): RgbPixel {
  let r = 0, g = 0, b = 0;
  for (const p of bucket) {
    r += p.r;
    g += p.g;
    b += p.b;
  }
  const n = bucket.length;
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rect sampling — dominant color of a bounding box in the screenshot
// ─────────────────────────────────────────────────────────────────────────────

function sampleRect(
  png: PNG,
  rect: { x: number; y: number; w: number; h: number }
): { hex: string; alpha: number } | null {
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(png.width, Math.floor(rect.x + rect.w));
  const y1 = Math.min(png.height, Math.floor(rect.y + rect.h));
  if (x1 <= x0 || y1 <= y0) return null;

  const pixels: RgbPixel[] = [];
  let totalAlpha = 0;
  let alphaCount = 0;
  const stride = Math.max(1, Math.floor(Math.min(x1 - x0, y1 - y0) / 40));

  for (let y = y0; y < y1; y += stride) {
    for (let x = x0; x < x1; x += stride) {
      const idx = (png.width * y + x) * 4;
      const a = png.data[idx + 3];
      totalAlpha += a;
      alphaCount++;
      if (a < 200) continue;
      pixels.push({
        r: png.data[idx],
        g: png.data[idx + 1],
        b: png.data[idx + 2],
      });
    }
  }
  if (pixels.length === 0) return null;

  // Pick the single most dominant bucket from a small quantization.
  const buckets = medianCut(pixels, 3);
  buckets.sort((a, b) => b.length - a.length);
  const dominant = averageColor(buckets[0]);
  const avgAlpha = alphaCount > 0 ? totalAlpha / alphaCount / 255 : 1;
  return { hex: toHex(dominant), alpha: Math.round(avgAlpha * 100) / 100 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightness analysis (light-vs-dark theme signal)
// ─────────────────────────────────────────────────────────────────────────────

function measureLightness(png: PNG): PixelAnalysis["lightness"] {
  let dark = 0, mid = 0, light = 0, total = 0;
  const stride = 8;
  for (let y = 0; y < png.height; y += stride) {
    for (let x = 0; x < png.width; x += stride) {
      const idx = (png.width * y + x) * 4;
      const a = png.data[idx + 3];
      if (a < 200) continue;
      const r = png.data[idx] / 255;
      const g = png.data[idx + 1] / 255;
      const b = png.data[idx + 2] / 255;
      // Perceptual luminance (BT.709)
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (luma < 0.2) dark++;
      else if (luma > 0.8) light++;
      else mid++;
      total++;
    }
  }
  if (total === 0) return { dark: 0, mid: 0, light: 0 };
  return {
    dark: Math.round((dark / total) * 100) / 100,
    mid: Math.round((mid / total) * 100) / 100,
    light: Math.round((light / total) * 100) / 100,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function toHex({ r, g, b }: RgbPixel): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

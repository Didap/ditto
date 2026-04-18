import { NextRequest, NextResponse } from "next/server";
import { extractDesign } from "@/lib/extractor";
import { WafBlockedError } from "@/lib/extractor/browser";
import { generateHybridDesign } from "@/lib/generator/hybrid";
import { saveDesign, generateSlug } from "@/lib/store";
import { getUserFromBearerOrSession, unauthorized } from "@/lib/auth-helpers";
import { deductCredits, refundCredits, COSTS } from "@/lib/credits";
import { aggregateProfiles, autoDetectMood, type MoodProfile } from "@/lib/mood";
import { ApiError, insufficientCredits } from "@/lib/errors";
import { nanoid } from "nanoid";
import type { StoredDesign, DesignTokens } from "@/lib/types";

export const maxDuration = 300;

/**
 * One-shot hybrid extraction for the CLI. Headless version of the web
 * /inspire flow: takes N URLs + optional weights, extracts each, auto-detects
 * the mood profile of each (no user prompts), aggregates them into a target
 * profile, and returns the hybrid DESIGN.md as text/markdown.
 *
 * Cost: N × COSTS.ADD_DESIGN (extractions) + 1 × COSTS.GENERATE_MIX (blend).
 * Atomic credit accounting: all-or-nothing. If any extraction fails, full
 * refund. If the blend succeeds, credits stay deducted.
 *
 * Query flags:
 *   - save=true → persist the hybrid to the user's library
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromBearerOrSession(req);
  if (!user) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const urls: unknown = body.urls;
  const rawWeights: unknown = body.weights;
  const customName: string | undefined = typeof body.name === "string" ? body.name : undefined;

  if (!Array.isArray(urls) || urls.length < 2 || urls.length > 10) {
    return NextResponse.json(
      { error: "urls must be an array of 2 to 10 strings" },
      { status: 400 }
    );
  }
  if (!urls.every((u) => typeof u === "string" && u.length > 0)) {
    return NextResponse.json({ error: "invalid urls" }, { status: 400 });
  }

  // Normalize weights — default to 1 per URL.
  const weights: number[] =
    Array.isArray(rawWeights) && rawWeights.length === urls.length
      ? rawWeights.map((w) => (typeof w === "number" && w > 0 ? w : 1))
      : urls.map(() => 1);

  const save = new URL(req.url).searchParams.get("save") === "true";

  const totalCost =
    urls.length * COSTS.ADD_DESIGN + COSTS.GENERATE_MIX;

  const { success, remaining } = await deductCredits(user.id, totalCost);
  if (!success) {
    return NextResponse.json(
      { error: insufficientCredits(totalCost, remaining) },
      { status: 402 }
    );
  }

  try {
    // Extract all URLs in parallel
    const extractions = await Promise.all(
      (urls as string[]).map(async (raw) => {
        const url = raw.startsWith("http") ? raw : `https://${raw}`;
        const { tokens, resolved } = await extractDesign(url);
        const name =
          tokens.meta.title ||
          new URL(url).hostname.replace("www.", "").split(".")[0];
        const moodProfile: MoodProfile = autoDetectMood(resolved, tokens).profile;
        return { url, name, tokens, resolved, moodProfile };
      })
    );

    const inspirations = extractions.map((e, i) => ({
      ...e,
      weight: weights[i],
    }));

    const profiles = inspirations.map((i) => ({
      profile: i.moodProfile,
      weight: i.weight,
    }));
    const targetProfile = aggregateProfiles(profiles);

    const { resolved, designMd: generatedMd } = generateHybridDesign(
      inspirations,
      targetProfile
    );

    // Build the hybrid tokens + metadata (mirrors the web /inspire generate flow)
    const primary = inspirations.reduce((a, b) => (a.weight > b.weight ? a : b));
    const names = inspirations.map((i) => i.name);
    const hybridName =
      customName || `Hybrid — ${names.join(" + ")}`;
    const slug = generateSlug(hybridName);

    const allFontSources = dedupeBy(
      inspirations.flatMap((i) => i.tokens.fontSources || []),
      (f) => f.href
    );
    const allFontFaces = dedupeBy(
      inspirations.flatMap((i) => i.tokens.fontFaces || []),
      (f) => `${f.family}-${f.weight}-${f.style}`
    );
    const allDownloadedFonts = dedupeBy(
      inspirations.flatMap((i) => i.tokens.downloadedFonts || []),
      (f) => f.url
    );

    const tokens: DesignTokens = {
      ...primary.tokens,
      fontSources: allFontSources,
      fontFaces: allFontFaces,
      downloadedFonts: allDownloadedFonts,
      meta: {
        url: inspirations.map((i) => i.url).join(", "),
        title: hybridName,
        extractedAt: new Date().toISOString(),
      },
    };

    // Persist if requested
    let saved = false;
    if (save) {
      const design: StoredDesign = {
        id: nanoid(),
        slug,
        name: hybridName,
        url: inspirations.map((i) => i.url).join(", "),
        description: `Hybrid blend of: ${inspirations.map((i) => i.name).join(", ")}`,
        tokens,
        resolved,
        designMd: generatedMd,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: "extracted",
      };
      await saveDesign(user.id, design);
      saved = true;
    }

    return new NextResponse(generatedMd, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Ditto-Name": encodeURIComponent(hybridName),
        "X-Ditto-Slug": slug,
        "X-Ditto-Saved": saved ? "true" : "false",
        "X-Ditto-Credits-Charged": String(totalCost),
        "X-Ditto-Sources": String(inspirations.length),
      },
    });
  } catch (err) {
    // Full refund on any extraction/generation failure.
    await refundCredits(user.id, totalCost).catch(() => {});
    if (err instanceof WafBlockedError) {
      return NextResponse.json(
        { error: err.message, refunded: totalCost, waf: true },
        { status: 422 }
      );
    }
    console.error("[inspire/md] failed:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : ApiError.EXTRACTION_FAILED,
        refunded: totalCost,
      },
      { status: 500 }
    );
  }
}

function dedupeBy<T>(arr: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

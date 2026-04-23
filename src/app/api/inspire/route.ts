import { NextRequest, NextResponse } from "next/server";
import { extractDesign } from "@/lib/extractor";
import { generateHybridDesign } from "@/lib/generator/hybrid";
import { generateSlug } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { deductCredits, COSTS } from "@/lib/credits";
import type { MoodProfile } from "@/lib/mood";
import { aggregateProfiles } from "@/lib/mood";
import { ApiError, insufficientCredits } from "@/lib/errors";
import { trackServer } from "@/lib/analytics/posthog-server";
import { EVENTS } from "@/lib/analytics/events";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  const body = await req.json();

  // Extract a single URL
  if (body.action === "extract-one") {
    const { url } = body as { url: string };
    try {
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      trackServer(user.id, EVENTS.EXTRACT_STARTED, { source: "inspire", url: fullUrl });
      const { tokens, resolved, quality } = await extractDesign(fullUrl);
      const name =
        tokens.meta.title ||
        new URL(fullUrl).hostname.replace("www.", "").split(".")[0];
      const screenshot = tokens.meta.screenshot || "";

      const allFonts = tokens.typography.map((t) => t.fontFamily);
      const downloadedFamilies = (tokens.downloadedFonts || [])
        .filter((f) => f.family)
        .map((f) => f.family);
      const fonts = [...new Set([...allFonts, ...downloadedFamilies])];

      return NextResponse.json({
        url: fullUrl,
        name,
        tokens,
        resolved,
        quality,
        screenshot,
        fonts,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : ApiError.EXTRACTION_FAILED },
        { status: 500 }
      );
    }
  }

  // Generate the hybrid design — does NOT save automatically
  if (body.action === "generate") {
    // Check and deduct credits for mix generation
    const { success, remaining } = await deductCredits(user.id, COSTS.GENERATE_MIX);
    if (!success) {
      return NextResponse.json(
        { error: insufficientCredits(COSTS.GENERATE_MIX, remaining) },
        { status: 402 }
      );
    }

    const { inspirations } = body;

    const profiles = inspirations.map((i: { moodProfile: MoodProfile; weight: number }) => ({
      profile: i.moodProfile,
      weight: i.weight,
    }));
    const targetProfile = aggregateProfiles(profiles);

    const { resolved, designMd } = generateHybridDesign(inspirations, targetProfile);

    const names = inspirations.map((i: { name: string }) => i.name);
    const hybridName = `Hybrid · ${names.join(" + ")}`;
    const slug = generateSlug(hybridName);

    const primaryInspiration = inspirations.reduce(
      (a: { weight: number }, b: { weight: number }) => (a.weight > b.weight ? a : b)
    );

    // Merge font data from ALL inspirations
    const allFontSources = dedupeBy(
      inspirations.flatMap((i: { tokens: { fontSources?: { href: string }[] } }) => i.tokens?.fontSources || []),
      (f: { href: string }) => f.href
    );
    const allFontFaces = dedupeBy(
      inspirations.flatMap((i: { tokens: { fontFaces?: { family: string; weight: string; style: string }[] } }) => i.tokens?.fontFaces || []),
      (f: { family: string; weight: string; style: string }) => `${f.family}-${f.weight}-${f.style}`
    );
    const allDownloadedFonts = dedupeBy(
      inspirations.flatMap((i: { tokens: { downloadedFonts?: { family: string; url: string }[] } }) => i.tokens?.downloadedFonts || []),
      (f: { family: string; url: string }) => f.url
    );

    const tokens = {
      ...primaryInspiration.tokens,
      fontSources: allFontSources,
      fontFaces: allFontFaces,
      downloadedFonts: allDownloadedFonts,
      meta: {
        url: inspirations.map((i: { url: string }) => i.url).join(", "),
        title: hybridName,
        extractedAt: new Date().toISOString(),
      },
    };

    trackServer(user.id, EVENTS.HYBRID_GENERATED, {
      inspirationCount: inspirations.length,
      slug,
    });

    // Return full data without saving — client will use /api/designs/save
    return NextResponse.json({
      slug,
      name: hybridName,
      url: inspirations.map((i: { url: string }) => i.url).join(", "),
      tokens,
      resolved,
      designMd,
    });
  }

  return NextResponse.json({ error: ApiError.UNKNOWN_ACTION }, { status: 400 });
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

import { NextRequest, NextResponse } from "next/server";
import { extractDesign } from "@/lib/extractor";
import { WafBlockedError, type ProxyConfig } from "@/lib/extractor/browser";
import { generateDesignMd } from "@/lib/generator/design-md";
import { saveDesign, generateSlug } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { deductCredits, refundCredits, COSTS } from "@/lib/credits";
import { nanoid } from "nanoid";
import type { StoredDesign } from "@/lib/types";
import { ApiError, insufficientCredits } from "@/lib/errors";
import {
  reserveSpecialExtraction,
  releaseSpecialExtraction,
  markSpecialExtractionUsed,
  SPECIAL_EXTRACTION_EXTRA_COST,
} from "@/lib/special-extraction-quota";

export const maxDuration = 120;

/** Build the ScraperAPI proxy config from env, or null if the key isn't set. */
function scraperApiProxy(): ProxyConfig | null {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) return null;
  return {
    server: "proxy-server.scraperapi.com:8001",
    // `premium=true` routes through residential IPs; good enough for most WAFs.
    // Each request costs ~5 credits against the free 5k monthly quota.
    username: "scraperapi.premium=true",
    password: key,
  };
}

export async function POST(req: NextRequest) {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  let deducted = false;

  try {
    const { url, name } = await req.json();

    if (!url) {
      return NextResponse.json({ error: ApiError.URL_REQUIRED }, { status: 400 });
    }

    // Check and deduct credits
    const { success, remaining } = await deductCredits(user.id, COSTS.ADD_DESIGN);
    if (!success) {
      return NextResponse.json(
        { error: insufficientCredits(COSTS.ADD_DESIGN, remaining) },
        { status: 402 }
      );
    }
    deducted = true;

    // Fallback chain: local Puppeteer → ScraperAPI residential proxy → bookmarklet UI
    let extraction;
    let specialExtractionCharged = 0;
    try {
      extraction = await extractDesign(url);
    } catch (firstError) {
      const proxy = scraperApiProxy();
      if (firstError instanceof WafBlockedError && proxy) {
        console.warn("[extract] WAF detected, retrying via ScraperAPI proxy");

        // Check monthly special-extraction quota; charge extra if free slot already used.
        const reserved = await reserveSpecialExtraction(user.id);
        if (reserved.insufficientCredits) {
          throw new WafBlockedError(
            `Site protected. Your free special extraction for this month is used; ${SPECIAL_EXTRACTION_EXTRA_COST} extra credits are required but you have ${reserved.remainingCredits}. Top up credits or use the browser bookmarklet.`
          );
        }
        specialExtractionCharged = reserved.extraCharged;

        try {
          extraction = await extractDesign(url, { proxy });
          await markSpecialExtractionUsed(user.id);
        } catch (secondError) {
          // ScraperAPI couldn't pass either — refund the surcharge (if any) and
          // surface as WAF so the UI offers the bookmarklet fallback.
          await releaseSpecialExtraction(user.id, reserved);
          specialExtractionCharged = 0;
          console.error("[extract] ScraperAPI fallback failed:", secondError);
          throw new WafBlockedError(
            secondError instanceof WafBlockedError
              ? secondError.message
              : `Site protected — proxy fallback failed. Try the browser bookmarklet below.`
          );
        }
      } else {
        throw firstError;
      }
    }
    const { tokens, resolved, quality } = extraction;

    const designName = name || tokens.meta.title || "Untitled";
    const designMd = generateDesignMd(designName, tokens, resolved);

    const slug = generateSlug(designName);
    const design: StoredDesign = {
      id: nanoid(),
      slug,
      name: designName,
      url,
      description: tokens.meta.description || "",
      tokens,
      resolved,
      quality,
      designMd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "extracted",
    };

    await saveDesign(user.id, design);

    return NextResponse.json({
      slug,
      name: designName,
      specialExtractionCharged,
    });
  } catch (error) {
    console.error("Extraction error:", error);

    // Refund credits only if they were actually deducted (not on JSON parse errors etc.)
    if (deducted) {
      await refundCredits(user.id, COSTS.ADD_DESIGN).catch(() => {});
    }

    if (error instanceof WafBlockedError) {
      return NextResponse.json(
        {
          error: error.message,
          refunded: deducted ? COSTS.ADD_DESIGN : 0,
          waf: true,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : ApiError.EXTRACTION_FAILED,
        refunded: deducted ? COSTS.ADD_DESIGN : 0,
      },
      { status: 500 }
    );
  }
}

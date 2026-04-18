import { extractDesign } from "@/lib/extractor";
import { WafBlockedError, type ProxyConfig } from "@/lib/extractor/browser";
import { generateDesignMd } from "@/lib/generator/design-md";
import { saveDesign, generateSlug } from "@/lib/store";
import { deductCredits, refundCredits, COSTS } from "@/lib/credits";
import { nanoid } from "nanoid";
import type { StoredDesign, DesignTokens, ResolvedDesign } from "@/lib/types";
import type { DesignQualityScore } from "@/lib/quality-scorer";
import {
  reserveSpecialExtraction,
  releaseSpecialExtraction,
  markSpecialExtractionUsed,
  SPECIAL_EXTRACTION_EXTRA_COST,
} from "@/lib/special-extraction-quota";

/**
 * Shared extraction pipeline used by both `/api/extract` (web, saves to DB)
 * and `/api/extract/md` (CLI, optional save).
 *
 * Handles: credit deduction, ScraperAPI WAF fallback with monthly quota,
 * credit refund on failure, extraction + markdown generation.
 */

function scraperApiProxy(): ProxyConfig | null {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) return null;
  return {
    server: "proxy-server.scraperapi.com:8001",
    username: "scraperapi.premium=true",
    password: key,
  };
}

export interface PipelineSuccess {
  ok: true;
  design: StoredDesign;
  tokens: DesignTokens;
  resolved: ResolvedDesign;
  quality: DesignQualityScore;
  designMd: string;
  slug: string;
  designName: string;
  specialExtractionCharged: number;
  saved: boolean;
}

export interface PipelineFailure {
  ok: false;
  status: 400 | 402 | 422 | 500;
  error: string;
  refunded: number;
  waf?: boolean;
}

export type PipelineResult = PipelineSuccess | PipelineFailure;

export async function runExtractionPipeline(
  userId: string,
  rawUrl: string,
  rawName: string | undefined,
  { save }: { save: boolean }
): Promise<PipelineResult> {
  if (!rawUrl) {
    return { ok: false, status: 400, error: "URL is required", refunded: 0 };
  }

  // Deduct base credits
  const { success, remaining } = await deductCredits(userId, COSTS.ADD_DESIGN);
  if (!success) {
    return {
      ok: false,
      status: 402,
      error: `Insufficient credits. ${COSTS.ADD_DESIGN} credits required, you have ${remaining}.`,
      refunded: 0,
    };
  }

  let deducted = true;
  let specialExtractionCharged = 0;

  try {
    // Fallback chain: local Puppeteer → ScraperAPI residential proxy → surface WAF
    let extraction;
    try {
      extraction = await extractDesign(rawUrl);
    } catch (firstError) {
      const proxy = scraperApiProxy();
      if (firstError instanceof WafBlockedError && proxy) {
        const reserved = await reserveSpecialExtraction(userId);
        if (reserved.insufficientCredits) {
          throw new WafBlockedError(
            `Site protected. Your free special extraction for this month is used; ${SPECIAL_EXTRACTION_EXTRA_COST} extra credits are required but you have ${reserved.remainingCredits}.`
          );
        }
        specialExtractionCharged = reserved.extraCharged;

        try {
          extraction = await extractDesign(rawUrl, { proxy });
          await markSpecialExtractionUsed(userId);
        } catch (secondError) {
          await releaseSpecialExtraction(userId, reserved);
          specialExtractionCharged = 0;
          throw new WafBlockedError(
            secondError instanceof WafBlockedError
              ? secondError.message
              : `Site protected — proxy fallback failed.`
          );
        }
      } else {
        throw firstError;
      }
    }

    const { tokens, resolved, quality } = extraction;
    const designName = rawName || tokens.meta.title || "Untitled";
    const designMd = generateDesignMd(designName, tokens, resolved);
    const slug = generateSlug(designName);

    const design: StoredDesign = {
      id: nanoid(),
      slug,
      name: designName,
      url: rawUrl,
      description: tokens.meta.description || "",
      tokens,
      resolved,
      quality,
      designMd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "extracted",
    };

    let saved = false;
    if (save) {
      await saveDesign(userId, design);
      saved = true;
    }

    // Mark success so the finally block doesn't refund.
    deducted = false;

    return {
      ok: true,
      design,
      tokens,
      resolved,
      quality,
      designMd,
      slug,
      designName,
      specialExtractionCharged,
      saved,
    };
  } catch (error) {
    if (deducted) {
      await refundCredits(userId, COSTS.ADD_DESIGN).catch(() => {});
    }
    if (error instanceof WafBlockedError) {
      return {
        ok: false,
        status: 422,
        error: error.message,
        refunded: COSTS.ADD_DESIGN,
        waf: true,
      };
    }
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : "Extraction failed",
      refunded: COSTS.ADD_DESIGN,
    };
  }
}

import { describe, it, expect } from "vitest";
import { boostDesignQuality, estimateBoostCost, BOOST_COST_PER_10_POINTS } from "@/lib/quality-improver";
import type { DesignTokens, ResolvedDesign } from "@/lib/types";

function makeWeakTokens(): DesignTokens {
  return {
    colors: [
      { hex: "#000000", rgb: "0,0,0", role: "text-primary", occurrences: 10 },
      { hex: "#ffffff", rgb: "255,255,255", role: "background", occurrences: 5 },
      { hex: "#6366f1", rgb: "99,102,241", role: "primary", occurrences: 5 },
    ],
    typography: [
      { fontFamily: "Inter", fallbacks: ["sans-serif"], weights: [400], role: "body" },
    ],
    typeScale: [
      { role: "base", fontFamily: "Inter", size: "1rem", weight: 400, lineHeight: "1.5", letterSpacing: "0" },
    ],
    spacing: [
      { value: "8px", px: 8, occurrences: 5 },
      { value: "16px", px: 16, occurrences: 5 },
    ],
    shadows: [],
    radii: [{ value: "4px", px: 4, occurrences: 5 }],
    components: [{ type: "button", styles: { padding: "8px 16px" } }],
    fontSources: [],
    fontFaces: [],
    downloadedFonts: [],
    cssVariables: {},
    meta: { url: "https://weak.com", title: "Weak", extractedAt: "2025-01-01" },
  };
}

function makeWeakResolved(): ResolvedDesign {
  return {
    colorPrimary: "#6366f1",
    colorSecondary: "#8b5cf6",
    colorAccent: "#ec4899",
    colorBackground: "#ffffff",
    colorSurface: "#f8fafc",
    colorTextPrimary: "#000000",
    colorTextSecondary: "#666666",
    colorTextMuted: "#999999",
    colorBorder: "#e2e8f0",
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    fontHeading: "Inter",
    fontBody: "Inter",
    fontMono: "Fira Code",
    fontWeightHeading: 400,
    fontWeightBody: 400,
    textXs: "0.75rem", textSm: "0.875rem", textBase: "1rem", textLg: "1.125rem",
    textXl: "1.25rem", text2xl: "1.5rem", text3xl: "1.875rem", text4xl: "2.25rem",
    spacingXs: "4px", spacingSm: "8px", spacingMd: "16px",
    spacingLg: "24px", spacingXl: "32px", spacing2xl: "48px",
    radiusSm: "4px", radiusMd: "8px", radiusLg: "12px", radiusFull: "9999px",
    shadowSm: "0 1px 2px rgba(0,0,0,0.05)",
    shadowMd: "0 4px 6px rgba(0,0,0,0.1)",
    shadowLg: "0 10px 15px rgba(0,0,0,0.1)",
    lineHeightTight: "1.15", lineHeightNormal: "1.5", lineHeightRelaxed: "1.75",
  };
}

describe("boostDesignQuality", () => {
  it("improves a weak design's score", () => {
    const result = boostDesignQuality(makeWeakTokens(), makeWeakResolved());
    expect(result.after.overall).toBeGreaterThan(result.before.overall);
    expect(result.pointsGained).toBeGreaterThan(0);
  });

  it("does not mutate original tokens", () => {
    const tokens = makeWeakTokens();
    const resolved = makeWeakResolved();
    const origColorCount = tokens.colors.length;
    boostDesignQuality(tokens, resolved);
    expect(tokens.colors.length).toBe(origColorCount);
  });

  it("charges credits proportional to improvement", () => {
    const result = boostDesignQuality(makeWeakTokens(), makeWeakResolved());
    const expectedCost = Math.ceil(result.pointsGained / 10) * BOOST_COST_PER_10_POINTS;
    expect(result.creditsCharged).toBe(expectedCost);
  });

  it("lists fixes applied", () => {
    const result = boostDesignQuality(makeWeakTokens(), makeWeakResolved());
    expect(result.fixesApplied.length).toBeGreaterThan(0);
  });

  it("adds missing shadows", () => {
    const result = boostDesignQuality(makeWeakTokens(), makeWeakResolved());
    expect(result.tokens.shadows.length).toBeGreaterThan(0);
  });

  it("adds missing semantic colors", () => {
    const result = boostDesignQuality(makeWeakTokens(), makeWeakResolved());
    const roles = new Set(result.tokens.colors.map((c) => c.role));
    expect(roles.has("success")).toBe(true);
    expect(roles.has("error")).toBe(true);
  });

  it("fixes heading weight", () => {
    const result = boostDesignQuality(makeWeakTokens(), makeWeakResolved());
    expect(result.resolved.fontWeightHeading).toBeGreaterThanOrEqual(600);
  });

  it("tints pure black/white", () => {
    const result = boostDesignQuality(makeWeakTokens(), makeWeakResolved());
    const blacks = result.tokens.colors.filter(
      (c) => c.hex.toLowerCase().replace("#", "") === "000000"
    );
    expect(blacks.length).toBe(0); // should be tinted
  });
});

describe("estimateBoostCost", () => {
  it("returns estimate without applying changes", () => {
    const tokens = makeWeakTokens();
    const resolved = makeWeakResolved();
    const estimate = estimateBoostCost(tokens, resolved);
    expect(estimate.currentScore).toBeLessThan(estimate.estimatedScore);
    expect(estimate.estimatedCost).toBeGreaterThan(0);
    // Original should be unchanged
    expect(tokens.shadows.length).toBe(0);
  });
});

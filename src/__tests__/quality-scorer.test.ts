import { describe, it, expect } from "vitest";
import {
  scoreDesignQuality,
  qualityLabel,
  qualityColor,
  friendlyIssueMessage,
} from "@/lib/quality-scorer";
import type { DesignTokens, ResolvedDesign } from "@/lib/types";

// ── Fixtures ──

function makeTokens(overrides: Partial<DesignTokens> = {}): DesignTokens {
  return {
    colors: [
      { hex: "#6366f1", rgb: "99,102,241", role: "primary", occurrences: 10 },
      { hex: "#f8fafc", rgb: "248,250,252", role: "background", occurrences: 5 },
      { hex: "#0f172a", rgb: "15,23,42", role: "text-primary", occurrences: 8 },
      { hex: "#475569", rgb: "71,85,105", role: "text-secondary", occurrences: 6 },
      { hex: "#94a3b8", rgb: "148,163,184", role: "text-muted", occurrences: 4 },
      { hex: "#e2e8f0", rgb: "226,232,240", role: "border", occurrences: 7 },
      { hex: "#22c55e", rgb: "34,197,94", role: "success", occurrences: 2 },
      { hex: "#f59e0b", rgb: "245,158,11", role: "warning", occurrences: 2 },
      { hex: "#ef4444", rgb: "239,68,68", role: "error", occurrences: 2 },
      { hex: "#3b82f6", rgb: "59,130,246", role: "info", occurrences: 2 },
    ],
    typography: [
      { fontFamily: "Geist Sans", fallbacks: ["sans-serif"], weights: [400, 700], role: "heading" },
      { fontFamily: "Geist Sans", fallbacks: ["sans-serif"], weights: [400], role: "body" },
    ],
    typeScale: [
      { role: "sm", fontFamily: "Geist Sans", size: "0.875rem", weight: 400, lineHeight: "1.5", letterSpacing: "0" },
      { role: "base", fontFamily: "Geist Sans", size: "1rem", weight: 400, lineHeight: "1.5", letterSpacing: "0" },
      { role: "lg", fontFamily: "Geist Sans", size: "1.25rem", weight: 400, lineHeight: "1.5", letterSpacing: "0" },
      { role: "xl", fontFamily: "Geist Sans", size: "1.5rem", weight: 700, lineHeight: "1.2", letterSpacing: "-0.02em" },
      { role: "2xl", fontFamily: "Geist Sans", size: "2rem", weight: 700, lineHeight: "1.2", letterSpacing: "-0.02em" },
    ],
    spacing: [
      { value: "4px", px: 4, occurrences: 10 },
      { value: "8px", px: 8, occurrences: 15 },
      { value: "16px", px: 16, occurrences: 20 },
      { value: "24px", px: 24, occurrences: 8 },
      { value: "32px", px: 32, occurrences: 5 },
      { value: "48px", px: 48, occurrences: 3 },
    ],
    shadows: [
      { value: "0 1px 2px rgba(0,0,0,0.05)", level: "sm", occurrences: 5 },
      { value: "0 4px 6px rgba(0,0,0,0.1)", level: "md", occurrences: 3 },
    ],
    radii: [
      { value: "4px", px: 4, occurrences: 10 },
      { value: "8px", px: 8, occurrences: 8 },
      { value: "12px", px: 12, occurrences: 4 },
    ],
    components: [
      { type: "button", styles: { padding: "8px 16px", borderRadius: "8px" } },
      { type: "card", styles: { padding: "16px", borderRadius: "12px" } },
      { type: "input", styles: { padding: "8px 12px", borderRadius: "8px" } },
    ],
    fontSources: [],
    fontFaces: [],
    downloadedFonts: [],
    cssVariables: { "--color-primary": "#6366f1", "--font-body": "Geist Sans" },
    meta: { url: "https://example.com", title: "Example", extractedAt: "2025-01-01" },
    ...overrides,
  };
}

function makeResolved(overrides: Partial<ResolvedDesign> = {}): ResolvedDesign {
  return {
    colorPrimary: "#6366f1",
    colorSecondary: "#8b5cf6",
    colorAccent: "#ec4899",
    colorBackground: "#f8fafc",
    colorSurface: "#ffffff",
    colorTextPrimary: "#0f172a",
    colorTextSecondary: "#475569",
    colorTextMuted: "#94a3b8",
    colorBorder: "#e2e8f0",
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    fontHeading: "Geist Sans",
    fontBody: "Geist Sans",
    fontMono: "Geist Mono",
    fontWeightHeading: 700,
    fontWeightBody: 400,
    textXs: "0.75rem",
    textSm: "0.875rem",
    textBase: "1rem",
    textLg: "1.125rem",
    textXl: "1.25rem",
    text2xl: "1.5rem",
    text3xl: "1.875rem",
    text4xl: "2.25rem",
    spacingXs: "4px",
    spacingSm: "8px",
    spacingMd: "16px",
    spacingLg: "24px",
    spacingXl: "32px",
    spacing2xl: "48px",
    radiusSm: "4px",
    radiusMd: "8px",
    radiusLg: "12px",
    radiusFull: "9999px",
    shadowSm: "0 1px 2px rgba(0,0,0,0.05)",
    shadowMd: "0 4px 6px rgba(0,0,0,0.1)",
    shadowLg: "0 10px 15px rgba(0,0,0,0.1)",
    lineHeightTight: "1.15",
    lineHeightNormal: "1.5",
    lineHeightRelaxed: "1.75",
    ...overrides,
  };
}

// ── Tests ──

describe("scoreDesignQuality", () => {
  it("returns overall score between 0-100", () => {
    const score = scoreDesignQuality(makeTokens(), makeResolved());
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it("returns all 5 dimension scores", () => {
    const score = scoreDesignQuality(makeTokens(), makeResolved());
    expect(score).toHaveProperty("color");
    expect(score).toHaveProperty("typography");
    expect(score).toHaveProperty("spacing");
    expect(score).toHaveProperty("contrast");
    expect(score).toHaveProperty("completeness");
  });

  it("scores a complete design system high", () => {
    const score = scoreDesignQuality(makeTokens(), makeResolved());
    expect(score.overall).toBeGreaterThanOrEqual(60);
  });

  it("penalizes pure black/white colors", () => {
    const tokens = makeTokens({
      colors: [
        { hex: "#000000", rgb: "0,0,0", role: "text-primary", occurrences: 10 },
        { hex: "#ffffff", rgb: "255,255,255", role: "background", occurrences: 5 },
        { hex: "#6366f1", rgb: "99,102,241", role: "primary", occurrences: 5 },
        { hex: "#22c55e", rgb: "34,197,94", role: "success", occurrences: 2 },
        { hex: "#ef4444", rgb: "239,68,68", role: "error", occurrences: 2 },
        { hex: "#f59e0b", rgb: "245,158,11", role: "warning", occurrences: 2 },
      ],
    });
    const resolved = makeResolved({ colorTextPrimary: "#000000", colorBackground: "#ffffff" });
    const score = scoreDesignQuality(tokens, resolved);
    const hasIssue = score.issues.some((i) => i.code === "pure-black-white");
    expect(hasIssue).toBe(true);
  });

  it("penalizes too few colors", () => {
    const tokens = makeTokens({
      colors: [
        { hex: "#6366f1", rgb: "99,102,241", role: "primary", occurrences: 5 },
        { hex: "#f8fafc", rgb: "248,250,252", role: "background", occurrences: 3 },
      ],
    });
    const score = scoreDesignQuality(tokens, makeResolved());
    const hasIssue = score.issues.some((i) => i.code === "too-few-colors");
    expect(hasIssue).toBe(true);
  });

  it("penalizes reflex/AI-default fonts", () => {
    const tokens = makeTokens({
      typography: [
        { fontFamily: "Inter", fallbacks: ["sans-serif"], weights: [400, 700], role: "heading" },
        { fontFamily: "Inter", fallbacks: ["sans-serif"], weights: [400], role: "body" },
      ],
    });
    const score = scoreDesignQuality(tokens, makeResolved());
    const hasIssue = score.issues.some((i) => i.code === "reflex-font");
    expect(hasIssue).toBe(true);
  });

  it("penalizes missing shadows", () => {
    const tokens = makeTokens({ shadows: [] });
    const score = scoreDesignQuality(tokens, makeResolved());
    const hasIssue = score.issues.some((i) => i.code === "no-shadows");
    expect(hasIssue).toBe(true);
  });

  it("penalizes low contrast text", () => {
    const resolved = makeResolved({
      colorTextPrimary: "#bbbbbb",
      colorBackground: "#ffffff",
    });
    const score = scoreDesignQuality(makeTokens(), resolved);
    const hasIssue = score.issues.some((i) => i.code === "low-contrast");
    expect(hasIssue).toBe(true);
  });

  it("overall is average of 5 dimensions", () => {
    const score = scoreDesignQuality(makeTokens(), makeResolved());
    const avg = Math.round(
      (score.color + score.typography + score.spacing + score.contrast + score.completeness) / 5
    );
    expect(score.overall).toBe(avg);
  });
});

describe("qualityLabel", () => {
  it("returns correct labels", () => {
    expect(qualityLabel(95)).toBe("Excellent");
    expect(qualityLabel(80)).toBe("Good");
    expect(qualityLabel(65)).toBe("Fair");
    expect(qualityLabel(45)).toBe("Needs Work");
    expect(qualityLabel(20)).toBe("Poor");
  });
});

describe("qualityColor", () => {
  it("returns hex colors", () => {
    expect(qualityColor(95)).toMatch(/^#/);
    expect(qualityColor(50)).toMatch(/^#/);
    expect(qualityColor(10)).toMatch(/^#/);
  });
});

describe("friendlyIssueMessage", () => {
  it("returns user-friendly messages for known codes", () => {
    const msg = friendlyIssueMessage({
      severity: "warning",
      category: "spacing",
      code: "no-shadows",
      message: "No shadows extracted",
    });
    expect(msg).toContain("shadow");
    expect(msg).not.toContain("no-shadows"); // no code in output
  });

  it("falls back to original message for unknown codes", () => {
    const msg = friendlyIssueMessage({
      severity: "info",
      category: "color",
      code: "unknown-thing",
      message: "Something happened",
    });
    expect(msg).toBe("Something happened");
  });
});

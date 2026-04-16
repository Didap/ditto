import type { DesignTokens, ResolvedDesign } from "@/lib/types";

/**
 * Parse a DESIGN.md file and extract tokens + resolved design.
 * Used by both the catalog unlock and the legacy import routes.
 */
export function parseDesignMd(
  content: string,
  name: string,
  url = ""
): { tokens: DesignTokens; resolved: ResolvedDesign } {
  const hexPattern = /#[0-9a-fA-F]{6}/g;
  const hexMatches = [...new Set(content.match(hexPattern) || [])];

  const colors = hexMatches.slice(0, 20).map((hex, i) => ({
    hex,
    rgb: `${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}`,
    occurrences: 1,
    name: `Color ${i + 1}`,
    role:
      i === 0
        ? ("primary" as const)
        : i === 1
          ? ("secondary" as const)
          : ("neutral" as const),
  }));

  const fontPattern =
    /\*\*(?:Primary|Heading|Font Family)\*\*[:\s]*`?([^`\n,]+)/gi;
  const fontMatches = content.matchAll(fontPattern);
  const fonts: string[] = [];
  for (const m of fontMatches) fonts.push(m[1].trim());

  const radiusPattern = /(\d+)px.*?(?:radius|rounded)/gi;
  const radiusMatches = [...content.matchAll(radiusPattern)];
  const radii = [...new Set(radiusMatches.map((m) => parseInt(m[1])))].sort(
    (a, b) => a - b
  );

  const headingFont = fonts[0] || "system-ui";
  const bodyFont = fonts[1] || fonts[0] || "system-ui";

  const resolved: ResolvedDesign = {
    colorPrimary: colors[0]?.hex || "#6366f1",
    colorSecondary: colors[1]?.hex || "#8b5cf6",
    colorAccent: colors[2]?.hex || "#ec4899",
    colorBackground:
      colors.find((c) => {
        const r = parseInt(c.hex.slice(1, 3), 16);
        const g = parseInt(c.hex.slice(3, 5), 16);
        const b = parseInt(c.hex.slice(5, 7), 16);
        return (r + g + b) / 3 > 200 || (r + g + b) / 3 < 30;
      })?.hex || "#ffffff",
    colorSurface: "#f8fafc",
    colorTextPrimary:
      colors.find((c) => {
        const r = parseInt(c.hex.slice(1, 3), 16);
        return r < 80;
      })?.hex || "#0f172a",
    colorTextSecondary: "#475569",
    colorTextMuted: "#94a3b8",
    colorBorder: "#e2e8f0",
    colorSuccess:
      colors.find((c) => {
        const g = parseInt(c.hex.slice(3, 5), 16);
        return g > 150 && parseInt(c.hex.slice(1, 3), 16) < 100;
      })?.hex || "#22c55e",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    fontHeading: headingFont,
    fontBody: bodyFont,
    fontMono: "ui-monospace",
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
    radiusSm: `${radii[0] || 4}px`,
    radiusMd: `${radii[1] || radii[0] || 8}px`,
    radiusLg: `${radii[2] || radii[1] || 12}px`,
    radiusFull: "9999px",
    shadowSm: "0 1px 2px 0 rgba(0,0,0,0.05)",
    shadowMd: "0 4px 6px -1px rgba(0,0,0,0.1)",
    shadowLg: "0 10px 15px -3px rgba(0,0,0,0.1)",
    lineHeightTight: "1.15",
    lineHeightNormal: "1.5",
    lineHeightRelaxed: "1.75",
  };

  const tokens: DesignTokens = {
    colors,
    typography: [
      {
        fontFamily: headingFont,
        fallbacks: ["system-ui"],
        weights: [700],
        role: "heading",
      },
      {
        fontFamily: bodyFont,
        fallbacks: ["system-ui"],
        weights: [400],
        role: "body",
      },
    ],
    typeScale: [],
    spacing: [],
    shadows: [],
    radii: radii.map((r) => ({ value: `${r}px`, px: r, occurrences: 1 })),
    components: [],
    fontSources: [],
    fontFaces: [],
    downloadedFonts: [],
    cssVariables: {},
    meta: { url, title: name, extractedAt: new Date().toISOString() },
  };

  return { tokens, resolved };
}

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { saveDesign, generateSlug, getDesign } from "@/lib/store";
import { getRequiredUser, unauthorized } from "@/lib/auth-helpers";
import { nanoid } from "nanoid";
import type { StoredDesign, ResolvedDesign, DesignTokens } from "@/lib/types";

const execAsync = promisify(exec);

function parseDesignMd(content: string, brandName: string, url: string): {
  tokens: DesignTokens;
  resolved: ResolvedDesign;
} {
  const hexPattern = /#[0-9a-fA-F]{6}/g;
  const hexMatches = [...new Set(content.match(hexPattern) || [])];

  const colors = hexMatches.slice(0, 20).map((hex, i) => ({
    hex,
    rgb: `${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}`,
    occurrences: 1,
    name: `Color ${i + 1}`,
    role: i === 0 ? "primary" as const : i === 1 ? "secondary" as const : "neutral" as const,
  }));

  const fontPattern = /\*\*(?:Primary|Heading|Font Family)\*\*[:\s]*`?([^`\n,]+)/gi;
  const fontMatches = content.matchAll(fontPattern);
  const fonts: string[] = [];
  for (const m of fontMatches) fonts.push(m[1].trim());

  const radiusPattern = /(\d+)px.*?(?:radius|rounded)/gi;
  const radiusMatches = [...content.matchAll(radiusPattern)];
  const radii = [...new Set(radiusMatches.map((m) => parseInt(m[1])))].sort((a, b) => a - b);

  const headingFont = fonts[0] || "system-ui";
  const bodyFont = fonts[1] || fonts[0] || "system-ui";

  const resolved: ResolvedDesign = {
    colorPrimary: colors[0]?.hex || "#6366f1",
    colorSecondary: colors[1]?.hex || "#8b5cf6",
    colorAccent: colors[2]?.hex || "#ec4899",
    colorBackground: colors.find((c) => {
      const r = parseInt(c.hex.slice(1, 3), 16);
      const g = parseInt(c.hex.slice(3, 5), 16);
      const b = parseInt(c.hex.slice(5, 7), 16);
      return (r + g + b) / 3 > 200 || (r + g + b) / 3 < 30;
    })?.hex || "#ffffff",
    colorSurface: "#f8fafc",
    colorTextPrimary: colors.find((c) => {
      const r = parseInt(c.hex.slice(1, 3), 16);
      return r < 80;
    })?.hex || "#0f172a",
    colorTextSecondary: "#475569",
    colorTextMuted: "#94a3b8",
    colorBorder: "#e2e8f0",
    colorSuccess: colors.find((c) => {
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
      { fontFamily: headingFont, fallbacks: ["system-ui"], weights: [700], role: "heading" },
      { fontFamily: bodyFont, fallbacks: ["system-ui"], weights: [400], role: "body" },
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
    meta: { url, title: brandName, extractedAt: new Date().toISOString() },
  };

  return { tokens, resolved };
}

export async function POST() {
  const user = await getRequiredUser();
  if (!user) return unauthorized();

  try {
    const { stdout: listOutput } = await execAsync("npx getdesign@latest list 2>/dev/null", {
      timeout: 30000,
    });

    const brands = listOutput
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const dashIdx = line.indexOf(" - ");
        if (dashIdx === -1) return { name: line.trim(), description: "" };
        return { name: line.slice(0, dashIdx).trim(), description: line.slice(dashIdx + 3).trim() };
      })
      .filter((b) => b.name);

    let imported = 0;
    const tmpDir = path.join(os.tmpdir(), `ditto-import-${nanoid(8)}`);
    await fs.mkdir(tmpDir, { recursive: true });

    const batchSize = 5;
    for (let i = 0; i < brands.length; i += batchSize) {
      const batch = brands.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (brand) => {
          const slug = generateSlug(brand.name);

          // Check if already exists in DB for this user
          const existing = await getDesign(user.id, slug);
          if (existing) return;

          try {
            const outPath = path.join(tmpDir, `${slug}.md`);
            await execAsync(
              `npx getdesign@latest add ${brand.name} --out "${outPath}" 2>/dev/null`,
              { timeout: 15000 }
            );

            const content = await fs.readFile(outPath, "utf-8");
            if (!content || content.length < 50) return;

            const { tokens, resolved } = parseDesignMd(content, brand.name, `https://${brand.name}.com`);

            const design: StoredDesign = {
              id: nanoid(),
              slug,
              name: brand.name.charAt(0).toUpperCase() + brand.name.slice(1),
              url: `https://${brand.name.replace(".app", "").replace(".ai", "")}.com`,
              description: brand.description,
              tokens,
              resolved,
              designMd: content,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              source: "imported",
            };

            await saveDesign(user.id, design);
            imported++;
          } catch {
            // Skip failed
          }
        })
      );
    }

    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    return NextResponse.json({ count: imported });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateWordPressPlugin } from "@/lib/generator/kit-wordpress-plugin";
import type { ResolvedDesign, DesignTokens } from "@/lib/types";

const resolved: ResolvedDesign = {
  colorPrimary: "#6366f1",
  colorSecondary: "#8b5cf6",
  colorAccent: "#ec4899",
  colorBackground: "#ffffff",
  colorSurface: "#f8fafc",
  colorTextPrimary: "#0f172a",
  colorTextSecondary: "#475569",
  colorTextMuted: "#94a3b8",
  colorBorder: "#e2e8f0",
  colorSuccess: "#22c55e",
  colorWarning: "#f59e0b",
  colorError: "#ef4444",
  fontHeading: "Inter",
  fontBody: "Inter",
  fontMono: "JetBrains Mono",
  fontWeightHeading: 700,
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

const baseTokens: DesignTokens = {
  colors: [],
  typography: [],
  typeScale: [],
  spacing: [],
  shadows: [],
  radii: [],
  components: [],
  fontSources: [],
  fontFaces: [],
  downloadedFonts: [],
  cssVariables: {},
  meta: {
    url: "https://example.com",
    title: "Example",
    extractedAt: new Date().toISOString(),
  },
};

const baseOpts = {
  designName: "Acme",
  designSlug: "acme",
  designUrl: "https://acme.example.com",
  resolved,
  tokens: baseTokens,
};

describe("generateWordPressPlugin — file structure", () => {
  it("emits core plugin files", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("acme-ditto.php");
    expect(paths).toContain("readme.txt");
    expect(paths).toContain("uninstall.php");
    expect(paths).toContain("assets/tokens.css");
    expect(paths).toContain("inc/helpers.php");
    expect(paths).toContain("inc/enqueue.php");
    expect(paths).toContain("inc/admin-page.php");
    expect(paths).toContain("inc/customizer.php");
    expect(paths).toContain("inc/register-blocks.php");
  });

  it("emits all 4 blocks with block.json + render.php + style.css + edit.js", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const paths = files.map((f) => f.path);
    const blocks = ["hero", "feature-grid", "cta", "pricing-card"];
    for (const b of blocks) {
      expect(paths).toContain(`blocks/${b}/block.json`);
      expect(paths).toContain(`blocks/${b}/render.php`);
      expect(paths).toContain(`blocks/${b}/style.css`);
      expect(paths).toContain(`blocks/${b}/edit.js`);
    }
  });

  it("does not emit assets/fonts/* when downloadedFonts is empty", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    expect(files.some((f) => f.path.startsWith("assets/fonts/"))).toBe(false);
  });
});

describe("generateWordPressPlugin — plugin main file", () => {
  it("contains a valid WP plugin header", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const main = files.find((f) => f.path === "acme-ditto.php")!.content as string;
    expect(main).toContain("Plugin Name:");
    expect(main).toContain("Acme — Ditto");
    expect(main).toContain("Text Domain:       acme-ditto");
    expect(main).toContain("License:           GPL-2.0-or-later");
    expect(main).toContain("Requires at least: 6.4");
  });

  it("wires require_once for all inc/* files", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const main = files.find((f) => f.path === "acme-ditto.php")!.content as string;
    expect(main).toContain("'inc/helpers.php'");
    expect(main).toContain("'inc/enqueue.php'");
    expect(main).toContain("'inc/admin-page.php'");
    expect(main).toContain("'inc/customizer.php'");
    expect(main).toContain("'inc/register-blocks.php'");
  });

  it("truncates long slugs to fit text-domain conventions", async () => {
    const longSlug = "this-is-an-extremely-long-design-slug-for-tests";
    const files = await generateWordPressPlugin({ ...baseOpts, designSlug: longSlug });
    const mainFile = files.find((f) => f.path.endsWith("-ditto.php"))!;
    const content = mainFile.content as string;
    const match = content.match(/Text Domain:\s+(\S+)/);
    expect(match).toBeTruthy();
    expect(match![1].length).toBeLessThanOrEqual(30);
  });
});

describe("generateWordPressPlugin — tokens.css", () => {
  it("emits :root with --d-* variables for all token categories", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const css = files.find((f) => f.path === "assets/tokens.css")!.content as string;
    expect(css).toContain(":root");
    expect(css).toContain("--d-primary: #6366f1;");
    expect(css).toContain("--d-accent: #ec4899;");
    expect(css).toContain("--d-font-heading:");
    expect(css).toContain("--d-radius-md: 8px;");
    expect(css).toContain("--d-space-md: 16px;");
    expect(css).toContain("--d-shadow-md:");
  });

  it("computes on-primary via WCAG luminance", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const css = files.find((f) => f.path === "assets/tokens.css")!.content as string;
    // #6366f1 is dark-ish → on-primary should be white
    expect(css).toContain("--d-on-primary: #ffffff;");
  });
});

describe("generateWordPressPlugin — block.json", () => {
  it("registers each block in the 'ditto' category with apiVersion 3", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const blocks = ["hero", "feature-grid", "cta", "pricing-card"];
    for (const b of blocks) {
      const raw = files.find((f) => f.path === `blocks/${b}/block.json`)!.content as string;
      const parsed = JSON.parse(raw);
      expect(parsed.apiVersion).toBe(3);
      expect(parsed.name).toBe(`ditto/${b}`);
      expect(parsed.category).toBe("ditto");
      expect(parsed.render).toBe("file:./render.php");
      expect(parsed.style).toBe("file:./style.css");
    }
  });

  it("hero block.json defaults come from microcopy when present", async () => {
    const tokens: DesignTokens = {
      ...baseTokens,
      microcopy: {
        heroHeadline: "Ship faster",
        heroSubheadline: "A platform for builders",
        ctaLabels: ["Start Free"],
        navLabels: [],
        sectionTitles: [],
        voiceTags: [],
      },
    };
    const files = await generateWordPressPlugin({ ...baseOpts, tokens });
    const parsed = JSON.parse(
      files.find((f) => f.path === "blocks/hero/block.json")!.content as string
    );
    expect(parsed.attributes.title.default).toBe("Ship faster");
    expect(parsed.attributes.subtitle.default).toBe("A platform for builders");
    expect(parsed.attributes.ctaText.default).toBe("Start Free");
  });

  it("hero uses default fallback when microcopy is missing", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const parsed = JSON.parse(
      files.find((f) => f.path === "blocks/hero/block.json")!.content as string
    );
    expect(parsed.attributes.title.default).toBe("Welcome to Acme");
  });
});

describe("generateWordPressPlugin — render.php", () => {
  it("uses CSS variables for hero styling, not inline colors", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const css = files.find((f) => f.path === "blocks/hero/style.css")!.content as string;
    expect(css).toContain("var(--d-primary)");
    expect(css).toContain("var(--d-text)");
    expect(css).not.toMatch(/#[0-9a-f]{6}/i); // no raw hex colors
  });

  it("render.php escapes user input via esc_html/esc_url", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const render = files.find((f) => f.path === "blocks/hero/render.php")!.content as string;
    expect(render).toContain("esc_html( $title )");
    expect(render).toContain("esc_url( $cta_url )");
  });
});

describe("generateWordPressPlugin — helpers.php", () => {
  it("embeds design defaults for ditto_color()", async () => {
    const files = await generateWordPressPlugin(baseOpts);
    const php = files.find((f) => f.path === "inc/helpers.php")!.content as string;
    expect(php).toContain("'primary' => '#6366f1'");
    expect(php).toContain("'accent' => '#ec4899'");
    expect(php).toContain("function ditto_color(");
    expect(php).toContain("function ditto_font(");
    expect(php).toContain("function ditto_spacing(");
  });

  it("escapes single quotes in color values safely", async () => {
    // Unrealistic but guards against PHP injection if resolved colors were ever user-supplied
    const bad: ResolvedDesign = { ...resolved, colorPrimary: "red';DROP" };
    const files = await generateWordPressPlugin({ ...baseOpts, resolved: bad });
    const php = files.find((f) => f.path === "inc/helpers.php")!.content as string;
    expect(php).toContain("red\\';DROP");
  });
});

describe("generateWordPressPlugin — fonts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("bundles fonts and emits @font-face rules when fetch succeeds", async () => {
    const fakeBytes = new Uint8Array([1, 2, 3, 4]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakeBytes.buffer),
    }));
    const tokens: DesignTokens = {
      ...baseTokens,
      downloadedFonts: [
        { family: "Inter", url: "https://x/Inter-400.woff2", localPath: "/fonts/x/0-Inter-400.woff2", format: "woff2" },
        { family: "Inter", url: "https://x/Inter-700.woff2", localPath: "/fonts/x/1-Inter-700.woff2", format: "woff2" },
      ],
    };
    const files = await generateWordPressPlugin({ ...baseOpts, tokens });
    const fontFiles = files.filter((f) => f.path.startsWith("assets/fonts/"));
    expect(fontFiles).toHaveLength(2);
    const css = files.find((f) => f.path === "assets/tokens.css")!.content as string;
    expect(css).toContain("@font-face");
    expect(css).toContain('url("./fonts/0-Inter-400.woff2")');
    expect(css).toContain("font-weight: 400;");
    expect(css).toContain("font-weight: 700;");
  });

  it("silently skips fonts when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const tokens: DesignTokens = {
      ...baseTokens,
      downloadedFonts: [
        { family: "Inter", url: "https://x/Inter-400.woff2", localPath: "/fonts/x/0-Inter-400.woff2", format: "woff2" },
      ],
    };
    const files = await generateWordPressPlugin({ ...baseOpts, tokens });
    expect(files.some((f) => f.path.startsWith("assets/fonts/"))).toBe(false);
    const css = files.find((f) => f.path === "assets/tokens.css")!.content as string;
    expect(css).not.toContain("@font-face");
  });
});

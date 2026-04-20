import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateWordPressTheme } from "@/lib/generator/kit-wordpress";
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
  designName: "Acme Theme",
  designSlug: "acme",
  designUrl: "https://acme.example.com",
  resolved,
  tokens: baseTokens,
};

describe("generateWordPressTheme — file structure", () => {
  it("emits the expected core file paths", async () => {
    const files = await generateWordPressTheme(baseOpts);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("style.css");
    expect(paths).toContain("theme.json");
    expect(paths).toContain("functions.php");
    expect(paths).toContain("readme.txt");
    expect(paths).toContain("screenshot.png");
    expect(paths).toContain("templates/index.html");
    expect(paths).toContain("templates/home.html");
    expect(paths).toContain("templates/front-page.html");
    expect(paths).toContain("templates/single.html");
    expect(paths).toContain("templates/page.html");
    expect(paths).toContain("templates/archive.html");
    expect(paths).toContain("templates/search.html");
    expect(paths).toContain("templates/404.html");
    expect(paths).toContain("parts/header.html");
    expect(paths).toContain("parts/footer.html");
    expect(paths).toContain("patterns/hero-default.php");
    expect(paths).toContain("patterns/feature-grid.php");
    expect(paths).toContain("patterns/cta.php");
  });

  it("does not emit assets/fonts/* when downloadedFonts is empty", async () => {
    const files = await generateWordPressTheme(baseOpts);
    expect(files.some((f) => f.path.startsWith("assets/fonts/"))).toBe(false);
  });

  it("does not emit assets/logo.svg when no logo is present", async () => {
    const files = await generateWordPressTheme(baseOpts);
    expect(files.some((f) => f.path === "assets/logo.svg")).toBe(false);
  });
});

describe("generateWordPressTheme — theme.json", () => {
  it("is valid JSON with version 3 and the expected presets", async () => {
    const files = await generateWordPressTheme(baseOpts);
    const themeJson = files.find((f) => f.path === "theme.json")!;
    const parsed = JSON.parse(themeJson.content as string);

    expect(parsed.version).toBe(3);
    expect(parsed.settings.color.palette).toHaveLength(12);
    expect(parsed.settings.typography.fontFamilies).toHaveLength(3);
    expect(parsed.settings.typography.fontSizes).toHaveLength(8);
    expect(parsed.settings.spacing.spacingSizes).toHaveLength(6);
    expect(parsed.settings.shadow.presets).toHaveLength(3);
    expect(parsed.settings.color.defaultPalette).toBe(false);
  });

  it("maps palette slugs to the expected role names", async () => {
    const files = await generateWordPressTheme(baseOpts);
    const parsed = JSON.parse(files.find((f) => f.path === "theme.json")!.content as string);
    const slugs = parsed.settings.color.palette.map((p: { slug: string }) => p.slug);
    expect(slugs).toEqual([
      "primary", "secondary", "accent", "background", "surface",
      "foreground", "text-secondary", "text-muted", "border",
      "success", "warning", "error",
    ]);
  });

  it("does not emit fontFace[] when downloadedFonts is empty", async () => {
    const files = await generateWordPressTheme(baseOpts);
    const parsed = JSON.parse(files.find((f) => f.path === "theme.json")!.content as string);
    for (const fam of parsed.settings.typography.fontFamilies) {
      expect(fam.fontFace).toBeUndefined();
    }
  });

  it("emits a hero pattern referencing front-page", async () => {
    const files = await generateWordPressTheme(baseOpts);
    const front = files.find((f) => f.path === "templates/front-page.html")!;
    expect(front.content).toContain('"acme/hero-default"');
    expect(front.content).toContain('"acme/feature-grid"');
    expect(front.content).toContain('"acme/cta"');
  });
});

describe("generateWordPressTheme — fallbacks for missing data", () => {
  it("uses default headline when microcopy is missing", async () => {
    const files = await generateWordPressTheme(baseOpts);
    const hero = files.find((f) => f.path === "patterns/hero-default.php")!;
    expect(hero.content).toContain("Welcome to Acme Theme");
  });

  it("uses microcopy when present", async () => {
    const tokens: DesignTokens = {
      ...baseTokens,
      microcopy: {
        heroHeadline: "Ship faster",
        heroSubheadline: "A platform for builders",
        ctaLabels: ["Start Free"],
        navLabels: ["Home", "Pricing"],
        sectionTitles: [],
        voiceTags: [],
      },
    };
    const files = await generateWordPressTheme({ ...baseOpts, tokens });
    const hero = files.find((f) => f.path === "patterns/hero-default.php")!;
    expect(hero.content).toContain("Ship faster");
    expect(hero.content).toContain("A platform for builders");
    expect(hero.content).toContain("Start Free");
    const header = files.find((f) => f.path === "parts/header.html")!;
    expect(header.content).toContain('"Pricing"');
  });

  it("uses default nav labels when navLabels are missing", async () => {
    const files = await generateWordPressTheme(baseOpts);
    const header = files.find((f) => f.path === "parts/header.html")!;
    expect(header.content).toContain('"Home"');
    expect(header.content).toContain('"Blog"');
  });
});

describe("generateWordPressTheme — PHP escaping", () => {
  it("escapes single quotes and backslashes in microcopy", async () => {
    const tokens: DesignTokens = {
      ...baseTokens,
      microcopy: {
        heroHeadline: "Don't 'panic' \\ go",
        heroSubheadline: "",
        ctaLabels: [],
        navLabels: [],
        sectionTitles: [],
        voiceTags: [],
      },
    };
    const files = await generateWordPressTheme({ ...baseOpts, tokens });
    const hero = files.find((f) => f.path === "patterns/hero-default.php")!;
    expect(hero.content).toContain("Don\\'t \\'panic\\' \\\\ go");
  });
});

describe("generateWordPressTheme — style.css header", () => {
  it("contains required WordPress theme metadata", async () => {
    const files = await generateWordPressTheme(baseOpts);
    const css = files.find((f) => f.path === "style.css")!.content as string;
    expect(css).toContain("Theme Name:        Acme Theme");
    expect(css).toContain("Text Domain:       acme-block-theme");
    expect(css).toContain("Requires at least:");
    expect(css).toContain("License:");
  });

  it("truncates long slugs to fit text-domain conventions", async () => {
    const longSlug = "this-is-an-extremely-long-design-slug-name";
    const files = await generateWordPressTheme({ ...baseOpts, designSlug: longSlug });
    const css = files.find((f) => f.path === "style.css")!.content as string;
    const match = css.match(/Text Domain:\s+(\S+)/);
    expect(match).toBeTruthy();
    expect(match![1].length).toBeLessThanOrEqual(34); // "<22 chars>-block-theme" = 34
  });
});

describe("generateWordPressTheme — fonts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("bundles fonts and emits fontFace[] entries when fetch succeeds", async () => {
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
    const files = await generateWordPressTheme({ ...baseOpts, tokens });
    const fontFiles = files.filter((f) => f.path.startsWith("assets/fonts/"));
    expect(fontFiles).toHaveLength(2);
    expect(fontFiles[0].path).toBe("assets/fonts/0-Inter-400.woff2");

    const parsed = JSON.parse(files.find((f) => f.path === "theme.json")!.content as string);
    const heading = parsed.settings.typography.fontFamilies.find((f: { slug: string }) => f.slug === "heading");
    expect(heading.fontFace).toBeDefined();
    expect(heading.fontFace).toHaveLength(2);
    expect(heading.fontFace[0].fontWeight).toBe("400");
    expect(heading.fontFace[1].fontWeight).toBe("700");
    expect(heading.fontFace[0].src[0]).toBe("file:./assets/fonts/0-Inter-400.woff2");
  });

  it("silently skips fonts when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const tokens: DesignTokens = {
      ...baseTokens,
      downloadedFonts: [
        { family: "Inter", url: "https://x/Inter-400.woff2", localPath: "/fonts/x/0-Inter-400.woff2", format: "woff2" },
      ],
    };
    const files = await generateWordPressTheme({ ...baseOpts, tokens });
    expect(files.some((f) => f.path.startsWith("assets/fonts/"))).toBe(false);
    const parsed = JSON.parse(files.find((f) => f.path === "theme.json")!.content as string);
    const heading = parsed.settings.typography.fontFamilies.find((f: { slug: string }) => f.slug === "heading");
    expect(heading.fontFace).toBeUndefined();
  });
});

describe("generateWordPressTheme — logo", () => {
  it("emits assets/logo.svg when inlineSvg is present", async () => {
    const tokens: DesignTokens = {
      ...baseTokens,
      logo: { url: "https://x/logo.svg", kind: "svg", inlineSvg: "<svg/>", colors: [] },
    };
    const files = await generateWordPressTheme({ ...baseOpts, tokens });
    const logo = files.find((f) => f.path === "assets/logo.svg");
    expect(logo).toBeDefined();
    expect(logo!.content).toBe("<svg/>");
  });
});

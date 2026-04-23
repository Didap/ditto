import { describe, it, expect } from "vitest";
import { generateElementorKit } from "@/lib/generator/kit-elementor";
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

describe("generateElementorKit — theme file structure", () => {
  it("emits the required WordPress theme files", async () => {
    const files = await generateElementorKit(baseOpts);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("style.css");
    expect(paths).toContain("functions.php");
    expect(paths).toContain("theme.json");
    expect(paths).toContain("index.php");
    expect(paths).toContain("header.php");
    expect(paths).toContain("footer.php");
    expect(paths).toContain("readme.txt");
    expect(paths).toContain("screenshot.png");
  });

  it("emits Elementor JSON templates for each page plus header/footer", async () => {
    const files = await generateElementorKit(baseOpts);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("elementor-templates/header.json");
    expect(paths).toContain("elementor-templates/footer.json");
    expect(paths).toContain("elementor-templates/page-home.json");
    expect(paths).toContain("elementor-templates/page-about.json");
    expect(paths).toContain("elementor-templates/page-services.json");
    expect(paths).toContain("elementor-templates/page-contact.json");
    expect(paths).toContain("elementor-templates/page-blog.json");
  });

  it("every Elementor JSON template is valid JSON with the expected wrapper shape", async () => {
    const files = await generateElementorKit(baseOpts);
    const tplFiles = files.filter(
      (f) => f.path.startsWith("elementor-templates/") && f.path.endsWith(".json"),
    );
    expect(tplFiles.length).toBeGreaterThan(0);
    for (const f of tplFiles) {
      const doc = JSON.parse(f.content as string);
      expect(doc.version).toBe("0.4");
      expect(["wp-page", "header", "footer", "section"]).toContain(doc.type);
      expect(Array.isArray(doc.content)).toBe(true);
      expect(doc.content.length).toBeGreaterThan(0);
      expect(doc.content[0].elType).toBe("section");
    }
  });
});

describe("generateElementorKit — style.css header", () => {
  it("contains WordPress theme metadata derived from designName", async () => {
    const files = await generateElementorKit(baseOpts);
    const css = files.find((f) => f.path === "style.css")!.content as string;
    expect(css).toContain("Theme Name: Acme");
    expect(css).toContain("Text Domain:");
  });
});

describe("generateElementorKit — theme.json", () => {
  it("is version 3 with a palette covering Ditto color roles", async () => {
    const files = await generateElementorKit(baseOpts);
    const parsed = JSON.parse(
      files.find((f) => f.path === "theme.json")!.content as string,
    );
    expect(parsed.version).toBe(3);
    const slugs: string[] = parsed.settings.color.palette.map(
      (p: { slug: string }) => p.slug,
    );
    expect(slugs).toEqual(
      expect.arrayContaining([
        "primary",
        "secondary",
        "accent",
        "background",
        "surface",
        "text-primary",
        "border",
      ]),
    );
    const primary = parsed.settings.color.palette.find(
      (p: { slug: string }) => p.slug === "primary",
    );
    expect(primary.color).toBe("#6366f1");
  });

  it("registers heading and body font families", async () => {
    const files = await generateElementorKit(baseOpts);
    const parsed = JSON.parse(
      files.find((f) => f.path === "theme.json")!.content as string,
    );
    const slugs = parsed.settings.typography.fontFamilies.map(
      (f: { slug: string }) => f.slug,
    );
    expect(slugs).toEqual(expect.arrayContaining(["heading", "body"]));
    const heading = parsed.settings.typography.fontFamilies.find(
      (f: { slug: string }) => f.slug === "heading",
    );
    expect(heading.fontFamily).toContain("Inter");
  });
});

describe("generateElementorKit — page-home template", () => {
  it("hero section uses microcopy when present", async () => {
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
    const files = await generateElementorKit({ ...baseOpts, tokens });
    const body = files.find(
      (f) => f.path === "elementor-templates/page-home.json",
    )!.content as string;
    expect(body).toContain("Ship faster");
    expect(body).toContain("A platform for builders");
    expect(body).toContain("Start Free");
  });

  it("hero section falls back to default headline without microcopy", async () => {
    const files = await generateElementorKit(baseOpts);
    const body = files.find(
      (f) => f.path === "elementor-templates/page-home.json",
    )!.content as string;
    expect(body).toContain("Welcome to Acme");
  });

  it("widgets reference resolved colors and fonts", async () => {
    const files = await generateElementorKit(baseOpts);
    const body = files.find(
      (f) => f.path === "elementor-templates/page-home.json",
    )!.content as string;
    expect(body).toContain('"#6366f1"');
    expect(body).toContain('"Inter"');
  });
});

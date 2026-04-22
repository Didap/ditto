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

describe("generateElementorKit — file structure", () => {
  it("emits manifest.json, site-settings.json, and 4 template files", async () => {
    const files = await generateElementorKit(baseOpts);
    const paths = files.map((f) => f.path);
    expect(paths).toContain("manifest.json");
    expect(paths).toContain("site-settings.json");
    const tplPaths = paths.filter((p) => p.startsWith("templates/") && p.endsWith(".json"));
    expect(tplPaths).toHaveLength(4);
  });

  it("all files are valid JSON", async () => {
    const files = await generateElementorKit(baseOpts);
    for (const f of files) {
      expect(() => JSON.parse(f.content as string)).not.toThrow();
    }
  });
});

describe("generateElementorKit — manifest.json", () => {
  it("includes required top-level fields", async () => {
    const files = await generateElementorKit(baseOpts);
    const manifest = JSON.parse(files.find((f) => f.path === "manifest.json")!.content as string);
    expect(manifest.name).toBe("acme");
    expect(manifest.title).toContain("Acme");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.elementor_version).toBeDefined();
    expect(typeof manifest.created).toBe("string");
    expect(manifest["site-settings"]).toBeDefined();
    expect(manifest.templates).toBeDefined();
    expect(Object.keys(manifest.templates)).toHaveLength(4);
  });

  it("references ids that match the template files on disk", async () => {
    const files = await generateElementorKit(baseOpts);
    const manifest = JSON.parse(files.find((f) => f.path === "manifest.json")!.content as string);
    const tplFilenames = files
      .filter((f) => f.path.startsWith("templates/") && f.path.endsWith(".json"))
      .map((f) => f.path.replace("templates/", "").replace(".json", ""));
    for (const id of Object.keys(manifest.templates)) {
      expect(tplFilenames).toContain(id);
    }
  });
});

describe("generateElementorKit — site-settings.json", () => {
  it("maps 4 system colors to Ditto roles", async () => {
    const files = await generateElementorKit(baseOpts);
    const settings = JSON.parse(
      files.find((f) => f.path === "site-settings.json")!.content as string
    ).settings;
    expect(settings.system_colors).toHaveLength(4);
    expect(settings.system_colors.find((c: { _id: string }) => c._id === "primary").color).toBe("#6366f1");
    expect(settings.system_colors.find((c: { _id: string }) => c._id === "accent").color).toBe("#ec4899");
    expect(settings.system_colors.find((c: { _id: string }) => c._id === "text").color).toBe("#0f172a");
  });

  it("maps 8 custom colors with unique ids", async () => {
    const files = await generateElementorKit(baseOpts);
    const settings = JSON.parse(
      files.find((f) => f.path === "site-settings.json")!.content as string
    ).settings;
    expect(settings.custom_colors).toHaveLength(8);
    const ids = settings.custom_colors.map((c: { _id: string }) => c._id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("maps 4 system typography definitions with font families", async () => {
    const files = await generateElementorKit(baseOpts);
    const settings = JSON.parse(
      files.find((f) => f.path === "site-settings.json")!.content as string
    ).settings;
    expect(settings.system_typography).toHaveLength(4);
    for (const t of settings.system_typography) {
      expect(t.typography_font_family).toBeTruthy();
    }
  });

  it("ships sensible button defaults from design tokens", async () => {
    const files = await generateElementorKit(baseOpts);
    const settings = JSON.parse(
      files.find((f) => f.path === "site-settings.json")!.content as string
    ).settings;
    expect(settings.button_background_color).toBe("#6366f1");
    expect(settings.button_hover_background_color).toBe("#ec4899");
    expect(settings.button_border_radius.top).toBe(8);
  });
});

describe("generateElementorKit — templates", () => {
  it("hero template uses microcopy when present", async () => {
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
    const heroFile = files.filter((f) => f.path.startsWith("templates/"))[0];
    const body = heroFile.content as string;
    expect(body).toContain("Ship faster");
    expect(body).toContain("A platform for builders");
    expect(body).toContain("Start Free");
  });

  it("hero template falls back to default headline without microcopy", async () => {
    const files = await generateElementorKit(baseOpts);
    const heroFile = files.filter((f) => f.path.startsWith("templates/"))[0];
    const body = heroFile.content as string;
    expect(body).toContain("Welcome to Acme");
  });

  it("each template has the expected wrapper shape", async () => {
    const files = await generateElementorKit(baseOpts);
    const tplFiles = files.filter((f) => f.path.startsWith("templates/"));
    for (const f of tplFiles) {
      const doc = JSON.parse(f.content as string);
      expect(doc.version).toBe("0.4");
      expect(doc.type).toBe("section");
      expect(Array.isArray(doc.content)).toBe(true);
      expect(doc.content.length).toBeGreaterThan(0);
      expect(doc.content[0].elType).toBe("section");
    }
  });

  it("templates reference design colors and fonts via widget settings", async () => {
    const files = await generateElementorKit(baseOpts);
    const tplFiles = files.filter((f) => f.path.startsWith("templates/"));
    const hero = tplFiles[0].content as string;
    expect(hero).toContain('"#6366f1"');
    expect(hero).toContain('"Inter"');
  });
});

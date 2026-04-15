import { describe, it, expect } from "vitest";
import { generateKitPages } from "@/lib/generator/kit-html";
import { generateStorybookProject } from "@/lib/generator/kit-storybook";
import type { ResolvedDesign } from "@/lib/types";

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
  fontHeading: "Geist Sans",
  fontBody: "Geist Sans",
  fontMono: "Geist Mono",
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

describe("generateKitPages", () => {
  const pages = generateKitPages("TestDesign", resolved, []);

  it("generates 5 HTML pages", () => {
    expect(pages.length).toBe(5);
  });

  it("generates correct filenames", () => {
    const names = pages.map((p) => p.filename);
    expect(names).toContain("landing.html");
    expect(names).toContain("dashboard.html");
    expect(names).toContain("auth.html");
    expect(names).toContain("pricing.html");
    expect(names).toContain("blog.html");
  });

  it("each page is valid HTML with doctype", () => {
    for (const page of pages) {
      expect(page.html).toContain("<!DOCTYPE html>");
      expect(page.html).toContain("<html");
      expect(page.html).toContain("</html>");
    }
  });

  it("injects CSS variables", () => {
    for (const page of pages) {
      expect(page.html).toContain("--d-primary: #6366f1");
      expect(page.html).toContain("--d-bg:");
    }
  });

  it("includes Tailwind CDN", () => {
    for (const page of pages) {
      expect(page.html).toContain("cdn.tailwindcss.com");
    }
  });

  it("includes design name in title", () => {
    for (const page of pages) {
      expect(page.title).toContain("TestDesign");
    }
  });

  it("landing page contains reviews section", () => {
    const landing = pages.find((p) => p.filename === "landing.html")!;
    expect(landing.html).toContain("What Our Users Say");
  });

  it("landing page contains FAQ section", () => {
    const landing = pages.find((p) => p.filename === "landing.html")!;
    expect(landing.html).toContain("Frequently Asked Questions");
  });

  it("dashboard page contains chart", () => {
    const dashboard = pages.find((p) => p.filename === "dashboard.html")!;
    expect(dashboard.html).toContain("Monthly Revenue");
  });

  it("blog page contains contact form", () => {
    const blog = pages.find((p) => p.filename === "blog.html")!;
    expect(blog.html).toContain("Get in Touch");
  });
});

describe("generateStorybookProject", () => {
  const files = generateStorybookProject("TestDesign", resolved, []);

  it("generates package.json", () => {
    const pkg = files.find((f) => f.path === "package.json");
    expect(pkg).toBeDefined();
    const json = JSON.parse(pkg!.content);
    expect(json.scripts.storybook).toBeDefined();
  });

  it("generates storybook config", () => {
    const main = files.find((f) => f.path === ".storybook/main.ts");
    expect(main).toBeDefined();
    expect(main!.content).toContain("stories");
  });

  it("generates tokens.css with design variables", () => {
    const tokens = files.find((f) => f.path === "src/tokens.css");
    expect(tokens).toBeDefined();
    expect(tokens!.content).toContain("--d-primary: #6366f1");
  });

  it("generates components.tsx", () => {
    const comps = files.find((f) => f.path === "src/components.tsx");
    expect(comps).toBeDefined();
    expect(comps!.content).toContain("export function Button");
  });

  it("generates stories for all components", () => {
    const storyFiles = files.filter((f) => f.path.endsWith(".stories.tsx"));
    expect(storyFiles.length).toBeGreaterThanOrEqual(14); // original 14 + 7 new
  });

  it("includes new component stories", () => {
    const storyPaths = files.map((f) => f.path);
    expect(storyPaths).toContain("src/BarChart.stories.tsx");
    expect(storyPaths).toContain("src/FAQ.stories.tsx");
    expect(storyPaths).toContain("src/Reviews.stories.tsx");
    expect(storyPaths).toContain("src/PaymentForm.stories.tsx");
    expect(storyPaths).toContain("src/ContactForm.stories.tsx");
  });

  it("generates README", () => {
    const readme = files.find((f) => f.path === "README.md");
    expect(readme).toBeDefined();
    expect(readme!.content).toContain("npm install");
  });
});

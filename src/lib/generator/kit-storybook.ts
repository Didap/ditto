/**
 * Storybook Project Generator
 *
 * Generates a self-contained Storybook project as a ZIP with:
 * - All design primitives as React components
 * - Stories for every component with controls
 * - Design tokens as CSS variables
 * - Ready to run: npm install && npm run storybook
 */

import type { ResolvedDesign, FontSource } from "../types";

export interface StorybookFile {
  path: string;
  content: string;
}

export function generateStorybookProject(
  designName: string,
  resolved: ResolvedDesign,
  fontSources: FontSource[]
): StorybookFile[] {
  const files: StorybookFile[] = [];

  // ── package.json ──
  files.push({
    path: "package.json",
    content: JSON.stringify(
      {
        name: `${slugify(designName)}-storybook`,
        version: "1.0.0",
        private: true,
        scripts: {
          storybook: "storybook dev -p 6006",
          "build-storybook": "storybook build",
        },
        dependencies: {
          react: "^18.3.0",
          "react-dom": "^18.3.0",
        },
        devDependencies: {
          "@storybook/react": "^8.6.0",
          "@storybook/react-vite": "^8.6.0",
          "@storybook/addon-essentials": "^8.6.0",
          "@storybook/blocks": "^8.6.0",
          storybook: "^8.6.0",
          vite: "^6.0.0",
          "@vitejs/plugin-react": "^4.3.0",
          typescript: "^5.5.0",
          "@types/react": "^18.3.0",
          "@types/react-dom": "^18.3.0",
        },
      },
      null,
      2
    ),
  });

  // ── tsconfig.json ──
  files.push({
    path: "tsconfig.json",
    content: JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
        include: ["src"],
      },
      null,
      2
    ),
  });

  // ── vite.config.ts ──
  files.push({
    path: "vite.config.ts",
    content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
  });

  // ── .storybook/main.ts ──
  files.push({
    path: ".storybook/main.ts",
    content: `import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
`,
  });

  // ── .storybook/preview.ts ──
  files.push({
    path: ".storybook/preview.ts",
    content: `import type { Preview } from "@storybook/react";
import "../src/tokens.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "design-bg",
      values: [
        { name: "design-bg", value: "${resolved.colorBackground}" },
        { name: "design-surface", value: "${resolved.colorSurface}" },
        { name: "white", value: "#ffffff" },
        { name: "dark", value: "#1a1a1a" },
      ],
    },
  },
};

export default preview;
`,
  });

  // ── Font links in preview-head.html ──
  const fontLinkTags = fontSources
    .filter((s) => s.type === "google-fonts" || s.type === "adobe-fonts" || s.type === "cdn")
    .map((s) => `<link rel="stylesheet" href="${s.href}">`)
    .join("\n");

  files.push({
    path: ".storybook/preview-head.html",
    content: `<!-- Design fonts -->\n${fontLinkTags}\n`,
  });

  // ── src/tokens.css ──
  files.push({
    path: "src/tokens.css",
    content: generateTokensCss(resolved),
  });

  // ── src/components.tsx ──
  files.push({
    path: "src/components.tsx",
    content: generateComponents(resolved),
  });

  // ── Stories ──
  files.push({ path: "src/Button.stories.tsx", content: buttonStories() });
  files.push({ path: "src/Card.stories.tsx", content: cardStories() });
  files.push({ path: "src/Input.stories.tsx", content: inputStories() });
  files.push({ path: "src/Badge.stories.tsx", content: badgeStories() });
  files.push({ path: "src/Avatar.stories.tsx", content: avatarStories() });
  files.push({ path: "src/Toggle.stories.tsx", content: toggleStories() });
  files.push({ path: "src/Table.stories.tsx", content: tableStories() });
  files.push({ path: "src/Tabs.stories.tsx", content: tabsStories() });
  files.push({ path: "src/Nav.stories.tsx", content: navStories() });
  files.push({ path: "src/StatCard.stories.tsx", content: statCardStories() });
  files.push({ path: "src/Select.stories.tsx", content: selectStories() });
  files.push({ path: "src/TextArea.stories.tsx", content: textAreaStories() });
  files.push({ path: "src/Footer.stories.tsx", content: footerStories() });
  files.push({ path: "src/Sidebar.stories.tsx", content: sidebarStories() });
  files.push({ path: "src/BarChart.stories.tsx", content: barChartStories() });
  files.push({ path: "src/LineChart.stories.tsx", content: lineChartStories() });
  files.push({ path: "src/ContactForm.stories.tsx", content: contactFormStories() });
  files.push({ path: "src/HeaderHero.stories.tsx", content: headerHeroStories() });
  files.push({ path: "src/FAQ.stories.tsx", content: faqStories() });
  files.push({ path: "src/PaymentForm.stories.tsx", content: paymentFormStories() });
  files.push({ path: "src/Reviews.stories.tsx", content: reviewsStories() });

  // ── README ──
  files.push({
    path: "README.md",
    content: `# ${designName} — Storybook

Component library generated by [Ditto](https://ditto.design).

## Quick Start

\`\`\`bash
npm install
npm run storybook
\`\`\`

Opens at **http://localhost:6006**

## What's Inside

- All design tokens as CSS variables (\`src/tokens.css\`)
- 14 React components (\`src/components.tsx\`)
- Interactive stories with controls for every component

## Build for Deployment

\`\`\`bash
npm run build-storybook
\`\`\`

Output goes to \`storybook-static/\` — deploy anywhere as a static site.
`,
  });

  return files;
}

// ── Helpers ──

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function generateTokensCss(r: ResolvedDesign): string {
  return `:root {
  --d-primary: ${r.colorPrimary};
  --d-secondary: ${r.colorSecondary};
  --d-accent: ${r.colorAccent};
  --d-bg: ${r.colorBackground};
  --d-surface: ${r.colorSurface};
  --d-text-primary: ${r.colorTextPrimary};
  --d-text-secondary: ${r.colorTextSecondary};
  --d-text-muted: ${r.colorTextMuted};
  --d-border: ${r.colorBorder};
  --d-success: ${r.colorSuccess};
  --d-warning: ${r.colorWarning};
  --d-error: ${r.colorError};
  --d-on-primary: ${getLuminance(r.colorPrimary) > 0.5 ? r.colorTextPrimary : "#ffffff"};
  --d-font-heading: '${r.fontHeading}', system-ui, sans-serif;
  --d-font-body: '${r.fontBody}', system-ui, sans-serif;
  --d-font-mono: '${r.fontMono}', ui-monospace, monospace;
  --d-weight-heading: ${r.fontWeightHeading};
  --d-weight-body: ${r.fontWeightBody};
  --d-radius-sm: ${r.radiusSm};
  --d-radius-md: ${r.radiusMd};
  --d-radius-lg: ${r.radiusLg};
  --d-radius-full: ${r.radiusFull};
  --d-shadow-sm: ${r.shadowSm};
  --d-shadow-md: ${r.shadowMd};
  --d-shadow-lg: ${r.shadowLg};
}

body {
  margin: 0;
  font-family: var(--d-font-body);
  color: var(--d-text-primary);
  background: var(--d-bg);
}
`;
}

function getLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// ── Components source (embedded as string for the generated project) ──

function generateComponents(resolved: ResolvedDesign): string {
  const brandNameLiteral = JSON.stringify(resolved.brandName || "Brand");
  const logoUrlLiteral = resolved.logoUrl ? JSON.stringify(resolved.logoUrl) : "null";
  const headerVariantLiteral = JSON.stringify(resolved.headerVariant || "classic");

  return `import React from "react";

// ── Brand ──

export type HeaderVariant = "classic" | "elegante" | "artistico" | "fresco";

export const brandConfig: {
  name: string;
  logoUrl: string | null;
  headerVariant: HeaderVariant;
} = {
  name: ${brandNameLiteral},
  logoUrl: ${logoUrlLiteral},
  headerVariant: ${headerVariantLiteral},
};

export function LogoPlaceholder({ size = 28, title = brandConfig.name }: { size?: number; title?: string }) {
  return (
    <svg role="img" aria-label={title} width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <path d="M16 0 A16 16 0 0 1 16 32 Z" fill="var(--d-primary)" />
      <path d="M16 0 A16 16 0 0 0 16 32 Z" fill="var(--d-secondary)" />
    </svg>
  );
}

export function BrandMark({
  size = 28,
  showName = true,
  nameSize = "1rem",
  nameWeight = 700,
  name = brandConfig.name,
  logoUrl = brandConfig.logoUrl,
}: {
  size?: number;
  showName?: boolean;
  nameSize?: string;
  nameWeight?: number;
  name?: string;
  logoUrl?: string | null;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} style={{ height: size, width: "auto", maxWidth: size * 3, objectFit: "contain", display: "block" }} />
      ) : (
        <LogoPlaceholder size={size} title={name} />
      )}
      {showName && (
        <span style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)", fontWeight: nameWeight, fontSize: nameSize, letterSpacing: "-0.01em" }}>
          {name}
        </span>
      )}
    </span>
  );
}

// ── Button ──

export function Button({
  children,
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer border-0";
  const sizes: Record<string, string> = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-2.5 text-base" };
  const styles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: "var(--d-primary)", color: "var(--d-on-primary)", borderRadius: "var(--d-radius-md)" },
    secondary: { backgroundColor: "transparent", color: "var(--d-primary)", borderRadius: "var(--d-radius-md)", border: "1px solid var(--d-border)" },
    ghost: { backgroundColor: "transparent", color: "var(--d-text-secondary)", borderRadius: "var(--d-radius-md)" },
    danger: { backgroundColor: "var(--d-error)", color: "#ffffff", borderRadius: "var(--d-radius-md)" },
  };
  return <button className={\`\${base} \${sizes[size]}\`} style={styles[variant]}>{children}</button>;
}

// ── Card ──

export function Card({ children, className = "", hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={\`\${className} \${hover ? "transition-shadow duration-200" : ""}\`}
      style={{ backgroundColor: "var(--d-surface)", border: "1px solid var(--d-border)", borderRadius: "var(--d-radius-lg)", boxShadow: "var(--d-shadow-sm)" }}>
      {children}
    </div>
  );
}

// ── Input ──

export function Input({ placeholder = "Enter text...", label, type = "text" }: { placeholder?: string; label?: string; type?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--d-text-primary)" }}>{label}</label>}
      <input type={type} placeholder={placeholder}
        style={{ width: "100%", padding: "8px 12px", fontSize: "0.875rem", backgroundColor: "var(--d-bg)", color: "var(--d-text-primary)", border: "1px solid var(--d-border)", borderRadius: "var(--d-radius-md)", outline: "none" }} />
    </div>
  );
}

// ── TextArea ──

export function TextArea({ placeholder = "Write something...", label, rows = 4 }: { placeholder?: string; label?: string; rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--d-text-primary)" }}>{label}</label>}
      <textarea placeholder={placeholder} rows={rows}
        style={{ width: "100%", padding: "8px 12px", fontSize: "0.875rem", backgroundColor: "var(--d-bg)", color: "var(--d-text-primary)", border: "1px solid var(--d-border)", borderRadius: "var(--d-radius-md)", outline: "none", resize: "none" }} />
    </div>
  );
}

// ── Select ──

export function Select({ label, options = ["Option 1", "Option 2", "Option 3"] }: { label?: string; options?: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--d-text-primary)" }}>{label}</label>}
      <select style={{ width: "100%", padding: "8px 12px", fontSize: "0.875rem", backgroundColor: "var(--d-bg)", color: "var(--d-text-primary)", border: "1px solid var(--d-border)", borderRadius: "var(--d-radius-md)", outline: "none" }}>
        {options.map((opt) => <option key={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

// ── Badge ──

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "error" | "info" }) {
  const colorMap: Record<string, React.CSSProperties> = {
    default: { backgroundColor: "color-mix(in srgb, var(--d-primary) 15%, transparent)", color: "var(--d-primary)", border: "1px solid color-mix(in srgb, var(--d-primary) 30%, transparent)" },
    success: { backgroundColor: "color-mix(in srgb, var(--d-success) 15%, transparent)", color: "var(--d-success)", border: "1px solid color-mix(in srgb, var(--d-success) 30%, transparent)" },
    warning: { backgroundColor: "color-mix(in srgb, var(--d-warning) 15%, transparent)", color: "var(--d-warning)", border: "1px solid color-mix(in srgb, var(--d-warning) 30%, transparent)" },
    error: { backgroundColor: "color-mix(in srgb, var(--d-error) 15%, transparent)", color: "var(--d-error)", border: "1px solid color-mix(in srgb, var(--d-error) 30%, transparent)" },
    info: { backgroundColor: "color-mix(in srgb, var(--d-primary) 10%, transparent)", color: "var(--d-primary)", border: "1px solid color-mix(in srgb, var(--d-primary) 20%, transparent)" },
  };
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", fontSize: "0.75rem", fontWeight: 500, borderRadius: "var(--d-radius-sm)", ...colorMap[variant] }}>{children}</span>;
}

// ── Avatar ──

export function Avatar({ name = "JD", size = 40 }: { name?: string; size?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, fontSize: "0.8125rem", fontWeight: 500, backgroundColor: "color-mix(in srgb, var(--d-primary) 20%, transparent)", color: "var(--d-primary)", borderRadius: "var(--d-radius-full)" }}>
      {name}
    </div>
  );
}

// ── Toggle ──

export function Toggle({ checked = false }: { checked?: boolean }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", height: 24, width: 44, borderRadius: 9999, backgroundColor: checked ? "var(--d-primary)" : "var(--d-border)", cursor: "pointer", transition: "background 0.2s" }}>
      <span style={{ position: "absolute", top: 2, height: 20, width: 20, borderRadius: 9999, backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transform: checked ? "translateX(20px)" : "translateX(2px)", transition: "transform 0.2s" }} />
    </div>
  );
}

// ── Table ──

export function Table({ headers = ["Name", "Status", "Amount", "Date"], rows = [["Project Alpha", "Active", "$12,400", "Jan 15"]] }: { headers?: string[]; rows?: string[][] }) {
  return (
    <div style={{ overflow: "hidden", border: "1px solid var(--d-border)", borderRadius: "var(--d-radius-lg)" }}>
      <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--d-surface)" }}>
            {headers.map((h) => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--d-text-muted)", borderBottom: "1px solid var(--d-border)" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--d-border)" : undefined }}>
              {row.map((cell, j) => <td key={j} style={{ padding: "12px 16px", color: j === 0 ? "var(--d-text-primary)" : "var(--d-text-secondary)" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tabs ──

export function Tabs({ items = ["Tab 1", "Tab 2", "Tab 3"], active = 0 }: { items?: string[]; active?: number }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--d-border)" }}>
      {items.map((item, i) => (
        <span key={item} style={{ padding: "10px 16px", fontSize: "0.875rem", cursor: "pointer", color: i === active ? "var(--d-primary)" : "var(--d-text-muted)", borderBottom: i === active ? "2px solid var(--d-primary)" : "2px solid transparent", fontWeight: i === active ? 600 : 400 }}>
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Nav (4 variants, picked by brandConfig.headerVariant or \`variant\` prop) ──

const DEFAULT_LINKS = ["Home", "Features", "Pricing", "Blog"];

function NavClassic({ links = DEFAULT_LINKS, cta = "Get Started" }: { links?: string[]; cta?: string }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", backgroundColor: "var(--d-bg)", borderBottom: "1px solid var(--d-border)" }}>
      <BrandMark />
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {links.map((link) => <span key={link} style={{ fontSize: "0.875rem", color: "var(--d-text-secondary)", cursor: "pointer" }}>{link}</span>)}
        <Button size="sm">{cta}</Button>
      </div>
    </nav>
  );
}

function NavElegante({ links = DEFAULT_LINKS, cta = "Get Started" }: { links?: string[]; cta?: string }) {
  return (
    <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 24px 0", backgroundColor: "var(--d-bg)" }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ width: 96 }} />
        <BrandMark size={32} nameSize="1.25rem" nameWeight={500} />
        <div style={{ width: 96, display: "flex", justifyContent: "flex-end" }}>
          <button style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--d-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>{cta}</button>
        </div>
      </div>
      <div style={{ width: "100%", height: 1, backgroundColor: "var(--d-border)" }} />
      <div style={{ display: "flex", justifyContent: "center", gap: 40, padding: "12px 0" }}>
        {links.map((link) => <span key={link} style={{ fontSize: "0.75rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--d-text-secondary)", cursor: "pointer" }}>{link}</span>)}
      </div>
      <div style={{ width: "100%", height: 1, backgroundColor: "var(--d-border)" }} />
    </nav>
  );
}

function NavArtistico({ links = DEFAULT_LINKS, cta = "Get Started" }: { links?: string[]; cta?: string }) {
  return (
    <nav style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", backgroundColor: "var(--d-bg)" }}>
      <div style={{ position: "relative" }}>
        <span aria-hidden style={{ position: "absolute", left: -8, top: -8, width: 40, height: 40, borderRadius: "50%", backgroundColor: "var(--d-accent)", opacity: 0.25, filter: "blur(2px)" }} />
        <span style={{ position: "relative" }}><BrandMark size={32} nameSize="1.125rem" nameWeight={800} /></span>
      </div>
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", backgroundColor: "color-mix(in srgb, var(--d-surface) 80%, transparent)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid var(--d-border)", borderRadius: "var(--d-radius-full)", boxShadow: "var(--d-shadow-sm)" }}>
        {links.map((link, i) => (
          <span key={link} style={{ padding: "4px 12px", fontSize: "0.8125rem", cursor: "pointer", color: i === 0 ? "var(--d-text-primary)" : "var(--d-text-secondary)", backgroundColor: i === 0 ? "color-mix(in srgb, var(--d-primary) 12%, transparent)" : "transparent", borderRadius: "var(--d-radius-full)", fontWeight: i === 0 ? 600 : 400 }}>{link}</span>
        ))}
      </div>
      <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", color: "var(--d-text-primary)", backgroundColor: "transparent", border: "2px solid var(--d-text-primary)", borderRadius: "var(--d-radius-full)" }}>
        {cta}<span aria-hidden style={{ color: "var(--d-accent)" }}>✦</span>
      </button>
    </nav>
  );
}

function NavFresco({ links = DEFAULT_LINKS, cta = "Start free" }: { links?: string[]; cta?: string }) {
  const dots = ["●", "◆", "■", "▲", "★", "◉"];
  return (
    <nav style={{ padding: "16px 16px 0", backgroundColor: "var(--d-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", backgroundColor: "var(--d-surface)", border: "1px solid var(--d-border)", borderRadius: "var(--d-radius-full)", boxShadow: "var(--d-shadow-sm)" }}>
        <BrandMark size={26} nameSize="0.9375rem" nameWeight={700} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {links.map((link, i) => (
            <span key={link} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: "0.8125rem", cursor: "pointer", color: "var(--d-text-secondary)", borderRadius: "var(--d-radius-full)" }}>
              <span aria-hidden style={{ fontSize: "0.625rem", color: "var(--d-primary)" }}>{dots[i % dots.length]}</span>{link}
            </span>
          ))}
        </div>
        <button style={{ display: "inline-flex", alignItems: "center", padding: "6px 16px", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", color: "var(--d-on-primary)", background: "linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%)", borderRadius: "var(--d-radius-full)", boxShadow: "var(--d-shadow-sm)", border: "none" }}>{cta}</button>
      </div>
    </nav>
  );
}

export function Nav({ links, cta, variant }: { links?: string[]; cta?: string; variant?: HeaderVariant }) {
  const v = variant || brandConfig.headerVariant;
  switch (v) {
    case "elegante": return <NavElegante links={links} cta={cta} />;
    case "artistico": return <NavArtistico links={links} cta={cta} />;
    case "fresco": return <NavFresco links={links} cta={cta} />;
    case "classic":
    default: return <NavClassic links={links} cta={cta} />;
  }
}

// ── Sidebar ──

export function Sidebar({ items = [{ label: "Dashboard", icon: "◫", active: true }, { label: "Analytics", icon: "◈" }, { label: "Customers", icon: "◉" }, { label: "Products", icon: "▦" }, { label: "Settings", icon: "⚙" }] }: { items?: Array<{ label: string; icon?: string; active?: boolean }> }) {
  return (
    <aside style={{ display: "flex", flexDirection: "column", width: 224, padding: "16px 0", backgroundColor: "var(--d-surface)", borderRight: "1px solid var(--d-border)" }}>
      <div style={{ padding: "0 16px 16px" }}><BrandMark size={22} nameSize="0.9375rem" /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
        {items.map((item) => (
          <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", fontSize: "0.875rem", cursor: "pointer", color: item.active ? "var(--d-primary)" : "var(--d-text-secondary)", backgroundColor: item.active ? "color-mix(in srgb, var(--d-primary) 10%, transparent)" : "transparent", borderRadius: "var(--d-radius-md)", fontWeight: item.active ? 600 : 400 }}>
            <span>{item.icon}</span>{item.label}
          </span>
        ))}
      </div>
    </aside>
  );
}

// ── StatCard ──

export function StatCard({ label = "Total Revenue", value = "$45,231", change = "+12.5%", positive = true }: { label?: string; value?: string; change?: string; positive?: boolean }) {
  return (
    <Card className="p-5">
      <div style={{ fontSize: "0.8125rem", marginBottom: 4, color: "var(--d-text-muted)" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4, color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}>{value}</div>
      <div style={{ fontSize: "0.8125rem", color: positive ? "var(--d-success)" : "var(--d-error)" }}>{change} from last month</div>
    </Card>
  );
}

// ── Footer ──

export function Footer() {
  return (
    <footer style={{ padding: "24px 32px", backgroundColor: "var(--d-surface)", borderTop: "1px solid var(--d-border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ marginBottom: 8 }}><BrandMark size={20} nameSize="0.9375rem" /></div>
          <div style={{ fontSize: "0.8125rem", color: "var(--d-text-muted)" }}>Building the future, one pixel at a time.</div>
        </div>
        <div style={{ display: "flex", gap: 48 }}>
          {["Product", "Company", "Legal"].map((section) => (
            <div key={section}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, marginBottom: 12, color: "var(--d-text-primary)" }}>{section}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Link One", "Link Two", "Link Three"].map((link) => (
                  <span key={link} style={{ fontSize: "0.8125rem", color: "var(--d-text-muted)", cursor: "pointer" }}>{link}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── BarChart ──

export function BarChart({ data = [{ label: "Jan", value: 65 }, { label: "Feb", value: 45 }, { label: "Mar", value: 78 }, { label: "Apr", value: 52 }, { label: "May", value: 90 }, { label: "Jun", value: 70 }], title = "Monthly Revenue" }: { data?: Array<{ label: string; value: number }>; title?: string }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div>
      {title && <div style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: 16, color: "var(--d-text-primary)" }}>{title}</div>}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160 }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", height: \`\${(d.value / max) * 140}px\`, backgroundColor: "var(--d-primary)", opacity: 0.8 + (d.value / max) * 0.2, borderRadius: "var(--d-radius-sm) var(--d-radius-sm) 0 0" }} />
            <span style={{ fontSize: "0.6875rem", color: "var(--d-text-muted)" }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LineChart ──

export function LineChart({ data = [30, 55, 40, 78, 60, 90, 72], title = "Weekly Trend" }: { data?: number[]; title?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 120, w = 100;
  const points = data.map((v, i) => \`\${(i / (data.length - 1)) * w},\${h - ((v - min) / (max - min || 1)) * (h - 10)}\`).join(" ");
  return (
    <div>
      {title && <div style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: 12, color: "var(--d-text-primary)" }}>{title}</div>}
      <svg viewBox={\`0 0 \${w} \${h}\`} style={{ width: "100%", height: 120 }}>
        <polyline points={points} fill="none" stroke="var(--d-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── ContactForm ──

export function ContactForm() {
  return (
    <Card className="p-6">
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: 4, color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}>Get in Touch</h3>
      <p style={{ fontSize: "0.875rem", marginBottom: 20, color: "var(--d-text-muted)" }}>We'd love to hear from you.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="First Name" placeholder="John" />
          <Input label="Last Name" placeholder="Doe" />
        </div>
        <Input label="Email" placeholder="john@example.com" type="email" />
        <TextArea label="Message" placeholder="How can we help?" rows={4} />
        <Button>Send Message</Button>
      </div>
    </Card>
  );
}

// ── HeaderHero ──

export function HeaderHero({ title = "Build something amazing", subtitle = "The all-in-one platform for modern teams.", cta = "Get Started", secondaryCta = "Learn More" }: { title?: string; subtitle?: string; cta?: string; secondaryCta?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 32px", background: "var(--d-bg)" }}>
      <Badge>Now Available</Badge>
      <h1 style={{ marginTop: 16, fontSize: "2.75rem", lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)", fontWeight: "var(--d-weight-heading)" } as any}>{title}</h1>
      <p style={{ marginTop: 16, fontSize: "1.125rem", maxWidth: 640, marginLeft: "auto", marginRight: "auto", color: "var(--d-text-secondary)" }}>{subtitle}</p>
      <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
        <Button size="lg">{cta}</Button>
        <Button variant="secondary" size="lg">{secondaryCta}</Button>
      </div>
    </div>
  );
}

// ── FAQ ──

export function FAQ({ items = [{ q: "What is included?", a: "Everything you need to get started." }, { q: "Can I cancel?", a: "Yes, anytime. No questions asked." }, { q: "Free trial?", a: "14 days, no credit card required." }], title = "FAQ" }: { items?: Array<{ q: string; a: string }>; title?: string }) {
  return (
    <div>
      {title && <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 24, textAlign: "center", color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}>{title}</h2>}
      {items.map((item, i) => (
        <details key={i} style={{ borderBottom: "1px solid var(--d-border)" }}>
          <summary style={{ padding: "16px 0", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", color: "var(--d-text-primary)" }}>{item.q}</summary>
          <p style={{ paddingBottom: 16, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--d-text-secondary)" }}>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

// ── PaymentForm ──

export function PaymentForm({ amount = "$29.00", plan = "Pro Plan" }: { amount?: string; plan?: string }) {
  return (
    <Card className="p-6" style={{ maxWidth: 420 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--d-text-primary)" }}>{plan}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--d-text-muted)" }}>Billed monthly</div>
        </div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}>{amount}</div>
      </div>
      <div style={{ height: 1, background: "var(--d-border)", marginBottom: 20 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Cardholder Name" placeholder="John Doe" />
        <Input label="Card Number" placeholder="4242 4242 4242 4242" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Expiry" placeholder="MM / YY" />
          <Input label="CVC" placeholder="123" />
        </div>
        <Button size="lg">Pay {amount}</Button>
      </div>
    </Card>
  );
}

// ── Reviews ──

export function Reviews({ items = [{ name: "Sarah Chen", role: "Designer", initials: "SC", text: "Incredible tool that changed our workflow.", rating: 5 }, { name: "James Wilson", role: "Developer", initials: "JW", text: "Best design system tool we've used.", rating: 5 }, { name: "Maria Lopez", role: "CTO", initials: "ML", text: "Game changer for our team.", rating: 4 }], title = "Reviews" }: { items?: Array<{ name: string; role: string; initials: string; text: string; rating: number }>; title?: string }) {
  return (
    <div>
      {title && <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 32, textAlign: "center", color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}>{title}</h2>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {items.map((item) => (
          <Card key={item.name} className="p-5">
            <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ fontSize: "0.875rem", color: i < item.rating ? "var(--d-warning)" : "var(--d-border)" }}>★</span>)}</div>
            <p style={{ fontSize: "0.875rem", marginBottom: 16, lineHeight: 1.6, color: "var(--d-text-secondary)" }}>"{item.text}"</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={item.initials} size={32} />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--d-text-primary)" }}>{item.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--d-text-muted)" }}>{item.role}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
`;
}

// ── Story generators ──

function buttonStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./components";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    children: { control: "text" },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: "Primary Button", variant: "primary", size: "md" } };
export const Secondary: Story = { args: { children: "Secondary", variant: "secondary", size: "md" } };
export const Ghost: Story = { args: { children: "Ghost", variant: "ghost", size: "md" } };
export const Danger: Story = { args: { children: "Delete", variant: "danger", size: "md" } };
export const Small: Story = { args: { children: "Small", variant: "primary", size: "sm" } };
export const Large: Story = { args: { children: "Large Button", variant: "primary", size: "lg" } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};
`;
}

function cardStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Card, Button, Avatar } from "./components";

const meta: Meta<typeof Card> = { title: "Components/Card", component: Card };
export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className="p-5" style={{ maxWidth: 320 }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8, color: "var(--d-text-primary)" }}>Card Title</h3>
      <p style={{ fontSize: "0.875rem", color: "var(--d-text-secondary)" }}>A basic card with text content and an action button.</p>
      <div style={{ marginTop: 16 }}><Button size="sm">Action</Button></div>
    </Card>
  ),
};

export const WithAvatar: Story = {
  render: () => (
    <Card className="p-5" hover style={{ maxWidth: 320 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Avatar name="AB" size={36} />
        <div>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--d-text-primary)" }}>Alice Brown</div>
          <div style={{ fontSize: "0.75rem", color: "var(--d-text-muted)" }}>Product Designer</div>
        </div>
      </div>
      <p style={{ fontSize: "0.875rem", color: "var(--d-text-secondary)" }}>Working on the new design system.</p>
    </Card>
  ),
};
`;
}

function inputStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./components";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    type: { control: "select", options: ["text", "email", "password", "number"] },
  },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { placeholder: "Enter text..." } };
export const WithLabel: Story = { args: { label: "Email", placeholder: "you@example.com", type: "email" } };
export const Password: Story = { args: { label: "Password", placeholder: "Enter password", type: "password" } };

export const FormGroup: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}>
      <Input label="Name" placeholder="John Doe" />
      <Input label="Email" placeholder="john@example.com" type="email" />
      <Input label="Password" placeholder="••••••••" type="password" />
    </div>
  ),
};
`;
}

function badgeStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./components";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  argTypes: {
    variant: { control: "select", options: ["default", "success", "warning", "error", "info"] },
    children: { control: "text" },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: "Badge", variant: "default" } };
export const Success: Story = { args: { children: "Active", variant: "success" } };
export const Warning: Story = { args: { children: "Pending", variant: "warning" } };
export const Error: Story = { args: { children: "Failed", variant: "error" } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <Badge>Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};
`;
}

function avatarStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./components";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  argTypes: { name: { control: "text" }, size: { control: { type: "range", min: 24, max: 80 } } },
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = { args: { name: "JD", size: 40 } };
export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar name="SM" size={24} />
      <Avatar name="MD" size={40} />
      <Avatar name="LG" size={56} />
    </div>
  ),
};
`;
}

function toggleStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "./components";

const meta: Meta<typeof Toggle> = {
  title: "Components/Toggle",
  component: Toggle,
  argTypes: { checked: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof Toggle>;

export const On: Story = { args: { checked: true } };
export const Off: Story = { args: { checked: false } };

export const Pair: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Toggle checked={true} /><span style={{ fontSize: "0.875rem", color: "var(--d-text-secondary)" }}>Enabled</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Toggle checked={false} /><span style={{ fontSize: "0.875rem", color: "var(--d-text-secondary)" }}>Disabled</span>
      </div>
    </div>
  ),
};
`;
}

function tableStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Table } from "./components";

const meta: Meta<typeof Table> = { title: "Components/Table", component: Table };
export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  args: {
    headers: ["Customer", "Status", "Amount", "Date"],
    rows: [
      ["Olivia Martin", "Completed", "+$1,999.00", "Apr 5, 2025"],
      ["Jackson Lee", "Processing", "+$39.00", "Apr 5, 2025"],
      ["Isabella Nguyen", "Completed", "+$299.00", "Apr 4, 2025"],
      ["William Kim", "Failed", "-$99.00", "Apr 4, 2025"],
    ],
  },
};
`;
}

function tabsStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./components";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  argTypes: { active: { control: { type: "range", min: 0, max: 3 } } },
};
export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = { args: { items: ["Overview", "Analytics", "Reports", "Settings"], active: 0 } };
export const SecondActive: Story = { args: { items: ["Overview", "Analytics", "Reports"], active: 1 } };
`;
}

function navStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Nav } from "./components";

const meta: Meta<typeof Nav> = {
  title: "Components/Nav",
  component: Nav,
  argTypes: {
    variant: { control: { type: "select" }, options: ["classic", "elegante", "artistico", "fresco"] },
    cta: { control: "text" },
  },
};
export default meta;
type Story = StoryObj<typeof Nav>;

export const Default: Story = { args: { links: ["Dashboard", "Products", "Customers", "Settings"] } };
export const Classic: Story = { args: { variant: "classic", links: ["Home", "Features", "Pricing", "Blog"] } };
export const Elegante: Story = { args: { variant: "elegante", links: ["Journal", "Shop", "About", "Stockists"] } };
export const Artistico: Story = { args: { variant: "artistico", links: ["Work", "Studio", "Process", "Contact"] } };
export const Fresco: Story = { args: { variant: "fresco", links: ["Product", "Docs", "Pricing", "Changelog"] } };
`;
}

function statCardStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { StatCard } from "./components";

const meta: Meta<typeof StatCard> = {
  title: "Components/StatCard",
  component: StatCard,
  argTypes: { positive: { control: "boolean" } },
};
export default meta;
type Story = StoryObj<typeof StatCard>;

export const Positive: Story = { args: { label: "Revenue", value: "$45,231", change: "+12.5%", positive: true } };
export const Negative: Story = { args: { label: "Churn Rate", value: "2.4%", change: "-0.5%", positive: false } };

export const Row: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      <StatCard label="Users" value="12,345" change="+5.2%" positive />
      <StatCard label="Revenue" value="$89.4K" change="+12.1%" positive />
      <StatCard label="Orders" value="1,234" change="-2.3%" positive={false} />
    </div>
  ),
};
`;
}

function selectStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./components";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  argTypes: { label: { control: "text" } },
};
export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = { args: { label: "Country", options: ["United States", "United Kingdom", "Italy", "Germany", "Japan"] } };
export const NoLabel: Story = { args: { options: ["Option A", "Option B", "Option C"] } };
`;
}

function textAreaStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { TextArea } from "./components";

const meta: Meta<typeof TextArea> = {
  title: "Components/TextArea",
  component: TextArea,
  argTypes: { label: { control: "text" }, placeholder: { control: "text" }, rows: { control: { type: "range", min: 2, max: 10 } } },
};
export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = { args: { label: "Message", placeholder: "Write your message here...", rows: 4 } };
`;
}

function footerStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "./components";

const meta: Meta<typeof Footer> = { title: "Components/Footer", component: Footer };
export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {};
`;
}

function sidebarStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./components";

const meta: Meta<typeof Sidebar> = { title: "Components/Sidebar", component: Sidebar };
export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  args: {
    items: [
      { label: "Dashboard", icon: "◫", active: true },
      { label: "Analytics", icon: "◈" },
      { label: "Customers", icon: "◉" },
      { label: "Products", icon: "▦" },
      { label: "Settings", icon: "⚙" },
    ],
  },
};
`;
}

function barChartStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { BarChart } from "./components";

const meta: Meta<typeof BarChart> = {
  title: "Data/BarChart",
  component: BarChart,
  argTypes: { title: { control: "text" } },
};
export default meta;
type Story = StoryObj<typeof BarChart>;

export const Default: Story = { args: { title: "Monthly Revenue" } };
`;
}

function lineChartStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { LineChart } from "./components";

const meta: Meta<typeof LineChart> = {
  title: "Data/LineChart",
  component: LineChart,
  argTypes: { title: { control: "text" } },
};
export default meta;
type Story = StoryObj<typeof LineChart>;

export const Default: Story = { args: { title: "Weekly Trend", data: [30, 55, 40, 78, 60, 90, 72] } };
`;
}

function contactFormStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { ContactForm } from "./components";

const meta: Meta<typeof ContactForm> = { title: "Forms/ContactForm", component: ContactForm };
export default meta;
type Story = StoryObj<typeof ContactForm>;

export const Default: Story = {};
`;
}

function headerHeroStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { HeaderHero } from "./components";

const meta: Meta<typeof HeaderHero> = {
  title: "Layout/HeaderHero",
  component: HeaderHero,
  argTypes: { title: { control: "text" }, subtitle: { control: "text" }, cta: { control: "text" }, secondaryCta: { control: "text" } },
};
export default meta;
type Story = StoryObj<typeof HeaderHero>;

export const Default: Story = { args: { title: "Build something amazing", subtitle: "The all-in-one platform for modern teams.", cta: "Get Started", secondaryCta: "Learn More" } };
`;
}

function faqStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { FAQ } from "./components";

const meta: Meta<typeof FAQ> = {
  title: "Content/FAQ",
  component: FAQ,
  argTypes: { title: { control: "text" } },
};
export default meta;
type Story = StoryObj<typeof FAQ>;

export const Default: Story = {
  args: {
    title: "Frequently Asked Questions",
    items: [
      { q: "What is included in the free plan?", a: "Up to 3 projects, basic analytics, community support, and 1 GB of storage." },
      { q: "Can I upgrade or downgrade?", a: "Yes, change your plan at any time." },
      { q: "Do you offer a free trial?", a: "Yes! 14-day free trial, no credit card required." },
    ],
  },
};
`;
}

function paymentFormStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { PaymentForm } from "./components";

const meta: Meta<typeof PaymentForm> = {
  title: "Forms/PaymentForm",
  component: PaymentForm,
  argTypes: { amount: { control: "text" }, plan: { control: "text" } },
};
export default meta;
type Story = StoryObj<typeof PaymentForm>;

export const Default: Story = { args: { amount: "$29.00", plan: "Pro Plan" } };
export const Enterprise: Story = { args: { amount: "$99.00", plan: "Enterprise" } };
`;
}

function reviewsStories(): string {
  return `import type { Meta, StoryObj } from "@storybook/react";
import { Reviews } from "./components";

const meta: Meta<typeof Reviews> = {
  title: "Content/Reviews",
  component: Reviews,
  argTypes: { title: { control: "text" } },
};
export default meta;
type Story = StoryObj<typeof Reviews>;

export const Default: Story = { args: { title: "What Our Users Say" } };
`;
}

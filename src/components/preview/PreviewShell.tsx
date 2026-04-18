"use client";

import React from "react";
import type { ResolvedDesign, FontSource, FontFace as FontFaceType } from "@/lib/types";

function getLuminance(hex: string): number {
  if (!hex.startsWith("#")) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

interface PreviewShellProps {
  resolved: ResolvedDesign;
  children: React.ReactNode;
  // Optional: font loading data from inspirations
  fontSources?: FontSource[];
  fontFaces?: FontFaceType[];
  downloadedFonts?: Array<{ family: string; localPath: string; format: string }>;
}

export function PreviewShell({
  resolved,
  children,
  fontSources = [],
  fontFaces = [],
  downloadedFonts = [],
}: PreviewShellProps) {
  const onPrimary =
    getLuminance(resolved.colorPrimary) > 0.5
      ? resolved.colorTextPrimary
      : "#ffffff";

  // Generate @font-face CSS for downloaded fonts
  const fontFaceRules: string[] = [];
  for (const dl of downloadedFonts) {
    if (!dl.family || !dl.localPath) continue;
    const format = dl.format === "woff2" ? "woff2" : dl.format === "woff" ? "woff" : dl.format === "ttf" ? "truetype" : "opentype";
    fontFaceRules.push(`@font-face {
  font-family: '${dl.family}';
  src: url('${dl.localPath}') format('${format}');
  font-display: swap;
}`);
  }
  for (const face of fontFaces) {
    if (!face.family || !face.src) continue;
    if (downloadedFonts.some((d) => d.family === face.family)) continue;
    fontFaceRules.push(`@font-face {
  font-family: '${face.family}';
  font-weight: ${face.weight};
  font-style: ${face.style};
  font-display: swap;
  src: ${face.src};
}`);
  }
  const fontFaceCss = fontFaceRules.join("\n\n");

  // Google Fonts / CDN link tags
  const fontLinks: string[] = [];
  const seen = new Set<string>();
  for (const src of fontSources) {
    if (seen.has(src.href)) continue;
    seen.add(src.href);
    if (src.type === "google-fonts" || src.type === "adobe-fonts" || src.type === "cdn") {
      fontLinks.push(src.href);
    }
  }

  const cssVars: Record<string, string> = {
    "--d-primary": resolved.colorPrimary,
    "--d-secondary": resolved.colorSecondary,
    "--d-accent": resolved.colorAccent,
    "--d-bg": resolved.colorBackground,
    "--d-surface": resolved.colorSurface,
    "--d-text-primary": resolved.colorTextPrimary,
    "--d-text-secondary": resolved.colorTextSecondary,
    "--d-text-muted": resolved.colorTextMuted,
    "--d-border": resolved.colorBorder,
    "--d-success": resolved.colorSuccess,
    "--d-warning": resolved.colorWarning,
    "--d-error": resolved.colorError,
    "--d-on-primary": onPrimary,
    "--d-font-heading": `'${resolved.fontHeading}', system-ui, sans-serif`,
    "--d-font-body": `'${resolved.fontBody}', system-ui, sans-serif`,
    "--d-font-mono": `'${resolved.fontMono}', ui-monospace, monospace`,
    "--d-weight-heading": String(resolved.fontWeightHeading),
    "--d-weight-body": String(resolved.fontWeightBody),
    "--d-radius-sm": resolved.radiusSm,
    "--d-radius-md": resolved.radiusMd,
    "--d-radius-lg": resolved.radiusLg,
    "--d-radius-full": resolved.radiusFull,
    "--d-shadow-sm": resolved.shadowSm,
    "--d-shadow-md": resolved.shadowMd,
    "--d-shadow-lg": resolved.shadowLg,
  };

  return (
    <div
      className="preview-shell overflow-hidden"
      style={{
        ...cssVars,
        backgroundColor: "var(--d-bg)",
        color: "var(--d-text-primary)",
        fontFamily: "var(--d-font-body)",
        borderRadius: "12px",
        border: "1px solid var(--d-border)",
      } as React.CSSProperties}
    >
      {/* Inject font link tags */}
      {fontLinks.map((href, i) => (
        <link key={i} rel="stylesheet" href={href} />
      ))}
      {/* Inject @font-face CSS */}
      {fontFaceCss && <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />}
      {/* Form-element font inheritance — browsers apply a system font to
          button/input/select/textarea by default, which overrides the
          brand fonts on things like FAQ triggers (Radix Accordion → <button>). */}
      <style dangerouslySetInnerHTML={{ __html: `
.preview-shell button,
.preview-shell input,
.preview-shell textarea,
.preview-shell select,
.preview-shell optgroup {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  color: inherit;
  letter-spacing: inherit;
}
` }} />
      {children}
    </div>
  );
}

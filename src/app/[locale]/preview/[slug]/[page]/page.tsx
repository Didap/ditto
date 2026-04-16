"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { useParams } from "next/navigation";
import type { StoredDesign } from "@/lib/types";
import { PreviewShell } from "@/components/preview/PreviewShell";
import { LandingPreview } from "@/components/preview/pages/LandingPreview";
import { DashboardPreview } from "@/components/preview/pages/DashboardPreview";
import { AuthPreview } from "@/components/preview/pages/AuthPreview";
import { PricingPreview } from "@/components/preview/pages/PricingPreview";
import { BlogPreview } from "@/components/preview/pages/BlogPreview";
import { ComponentsPreview } from "@/components/preview/pages/ComponentsPreview";

const PAGES: Record<string, React.ComponentType> = {
  landing: LandingPreview,
  dashboard: DashboardPreview,
  auth: AuthPreview,
  pricing: PricingPreview,
  blog: BlogPreview,
  components: ComponentsPreview,
};

// Standalone preview page — no Ditto chrome, just the design at 1440px
// Perfect for html.to.design Figma plugin capture
export default function StandalonePreviewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const pageName = params.page as string;
  const [design, setDesign] = useState<StoredDesign | null>(null);

  useEffect(() => {
    fetch(`/api/designs/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setDesign(data))
      .catch(() => {});
  }, [slug]);

  if (!design) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000", color: "#666" }}>
        Loading...
      </div>
    );
  }

  const Component = PAGES[pageName] || LandingPreview;

  return (
    <div style={{ width: 1440, margin: "0 auto", minHeight: "100vh" }}>
      {/* Figma capture script — enables html.to.design and generate_figma_design */}
      <Script
        src="https://mcp.figma.com/mcp/html-to-design/capture.js"
        strategy="afterInteractive"
      />
      <PreviewShell
        resolved={design.resolved}
        fontSources={design.tokens.fontSources || []}
        fontFaces={design.tokens.fontFaces || []}
        downloadedFonts={design.tokens.downloadedFonts || []}
      >
        <Component />
      </PreviewShell>
    </div>
  );
}

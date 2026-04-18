import type { DesignTokens, ResolvedDesign } from "../types";

export function generateDesignMd(
  name: string,
  tokens: DesignTokens,
  resolved: ResolvedDesign
): string {
  const sections = [
    generateHeader(name, tokens),
    generateVisualTheme(name, tokens, resolved),
    generateSignatureAndComposition(tokens),
    generateColorPalette(tokens, resolved),
    generateGradients(tokens),
    generateFontSetup(tokens, resolved),
    generateTypography(tokens, resolved),
    generateComponentStyles(tokens, resolved),
    generateMotion(tokens),
    generateInteractionStyles(tokens),
    generateLayoutPrinciples(tokens, resolved),
    generateDepthElevation(tokens, resolved),
    generateVoiceAndCopy(tokens),
    generateDosAndDonts(resolved),
    generateResponsive(resolved),
    generateAgentPromptGuide(tokens, resolved),
    generateKitFooter(resolved),
  ].filter(Boolean);

  return sections.join("\n\n");
}

// ── New sections (extended signals) ─────────────────────────────────────────

function generateSignatureAndComposition(tokens: DesignTokens): string | null {
  const hero = tokens.heroComposition;
  const signals = tokens.designSignals;
  const logo = tokens.logo;
  if (!hero && !signals && !logo) return null;

  const lines: string[] = ["## Signature & Composition\n"];

  if (hero) {
    const patternLabel: Record<string, string> = {
      "split-left": "split layout with media on the left",
      "split-right": "split layout with media on the right",
      "centered": "centered single-column",
      "full-bleed": "full-bleed edge-to-edge",
      "minimal": "minimal, content-forward",
      "unknown": "generic",
    };
    lines.push(
      `**Hero pattern:** ${patternLabel[hero.pattern] || hero.pattern}` +
        (hero.heightVh > 0 ? ` (~${Math.round(hero.heightVh * 100)}vh tall)` : "") +
        `. Background is **${hero.backgroundKind}**${hero.hasMedia ? " with visible media" : " without media"}.`
    );
  }

  if (logo) {
    if (logo.kind === "svg") {
      const palette = logo.colors.length > 0 ? ` Brand palette inside the mark: \`${logo.colors.slice(0, 4).join("`, `")}\`.` : "";
      lines.push(`**Logo:** inline SVG.${palette}`);
    } else if (logo.url) {
      lines.push(`**Logo:** raster image at \`${logo.url}\`${logo.alt ? ` — alt text: "${logo.alt}"` : ""}.`);
    }
  }

  if (signals) {
    const active: string[] = [];
    if (signals.usesBackdropBlur) active.push("backdrop-blur (glassmorphism)");
    if (signals.usesBgPatterns) active.push("background patterns / textures");
    if (signals.usesClipPath) active.push("custom clip-paths");
    if (signals.usesCssFilters) active.push("CSS filters (blur/hue-rotate/etc.)");
    if (signals.usesBlendModes) active.push("mix-blend-mode layering");
    if (signals.uses3dTransforms) active.push("3D transforms / perspective");
    if (signals.usesMasks) active.push("CSS masks");
    if (active.length > 0) {
      lines.push(`**Advanced CSS in play:** ${active.join(", ")}. Reuse these — they're part of the signature.`);
    }
  }

  return lines.length > 1 ? lines.join("\n\n") : null;
}

function generateGradients(tokens: DesignTokens): string | null {
  const gradients = tokens.gradients || [];
  if (gradients.length === 0) return null;

  let md = `## Gradients\n\nGradients actually used by this brand — prefer these over inventing new ones.\n\n`;
  md += `| # | Type | Usage hint | Value |\n|---|------|------------|-------|\n`;
  for (let i = 0; i < Math.min(gradients.length, 8); i++) {
    const g = gradients[i];
    md += `| ${i + 1} | ${g.type} | \`<${g.sampleTag}>\` (×${g.occurrences}) | \`${truncate(g.value, 80)}\` |\n`;
  }
  return md;
}

function generateMotion(tokens: DesignTokens): string | null {
  const tr = tokens.transitions || [];
  if (tr.length === 0) return null;

  const top = tr[0];
  const fast = tr.some((t) => t.durationMs <= 120);
  const slow = tr.some((t) => t.durationMs >= 400);
  const character = fast && !slow ? "snappy" : slow && !fast ? "deliberate" : "balanced";

  let md = `## Motion & Timing\n\nTransitions feel **${character}** — the dominant pair is \`${top.durationMs}ms ${top.easing}\`.\n\n`;
  md += `| Duration | Easing | Occurrences |\n|----------|--------|-------------|\n`;
  for (const t of tr.slice(0, 6)) {
    md += `| ${t.durationMs}ms | \`${t.easing}\` | ${t.occurrences} |\n`;
  }
  md += `\nApply to hover states, expand/collapse, color transitions. Avoid anything above the slowest observed value — it'd feel foreign.`;
  return md;
}

function generateInteractionStyles(tokens: DesignTokens): string | null {
  const buttonWithStates = tokens.components.find((c) => c.type === "button" && c.states);
  const selection = tokens.selection;
  if (!buttonWithStates?.states?.hover && !selection?.selectionBg && !selection?.hasCustomScrollbar) return null;

  const lines: string[] = ["## Interaction Styles\n"];

  if (buttonWithStates?.states) {
    const h = buttonWithStates.states.hover;
    const f = buttonWithStates.states.focus;
    if (h) {
      const items: string[] = [];
      if (h.backgroundColor) items.push(`background → \`${h.backgroundColor}\``);
      if (h.color) items.push(`text → \`${h.color}\``);
      if (h.boxShadow && h.boxShadow !== "none") items.push(`shadow → \`${truncate(h.boxShadow, 60)}\``);
      if (h.transform && h.transform !== "none") items.push(`transform → \`${h.transform}\``);
      if (h.opacity && h.opacity !== "1") items.push(`opacity → ${h.opacity}`);
      if (items.length > 0) {
        lines.push(`**Primary button hover:** ${items.join(", ")}.`);
      }
    }
    if (f?.outline && f.outline !== "none") {
      lines.push(`**Focus ring:** \`${f.outline}\`${f.outlineOffset ? ` offset ${f.outlineOffset}` : ""}.`);
    } else if (f?.boxShadow && f.boxShadow !== "none" && (!h?.boxShadow || h.boxShadow !== f.boxShadow)) {
      lines.push(`**Focus ring:** via box-shadow \`${truncate(f.boxShadow, 80)}\`.`);
    }
  }

  if (selection?.selectionBg) {
    lines.push(
      `**Text selection:** background \`${selection.selectionBg}\`` +
        (selection.selectionColor ? `, text \`${selection.selectionColor}\`` : "") + `.`
    );
  }
  if (selection?.hasCustomScrollbar) {
    lines.push(`**Scrollbar:** custom-styled (\`::-webkit-scrollbar\` rules present).`);
  }
  if (selection?.caretColor) {
    lines.push(`**Caret color in inputs:** \`${selection.caretColor}\`.`);
  }

  return lines.length > 1 ? lines.join("\n\n") : null;
}

function generateVoiceAndCopy(tokens: DesignTokens): string | null {
  const mc = tokens.microcopy;
  if (!mc || (!mc.heroHeadline && mc.ctaLabels.length === 0)) return null;

  const lines: string[] = ["## Voice & Microcopy\n"];

  if (mc.heroHeadline) {
    lines.push(`**Hero headline:**\n\n> ${mc.heroHeadline}`);
  }
  if (mc.heroSubheadline) {
    lines.push(`**Hero sub:**\n\n> ${mc.heroSubheadline}`);
  }
  if (mc.ctaLabels.length > 0) {
    lines.push(`**CTA vocabulary:** ${mc.ctaLabels.slice(0, 8).map((c) => `\`${c}\``).join(", ")}.`);
  }
  if (mc.navLabels.length > 0) {
    lines.push(`**Nav:** ${mc.navLabels.slice(0, 8).map((n) => `\`${n}\``).join(", ")}.`);
  }
  if (mc.voiceTags.length > 0) {
    lines.push(`**Voice signals:** ${mc.voiceTags.join(" · ")}.`);
  }

  return lines.join("\n\n");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function generateHeader(name: string, tokens: DesignTokens): string {
  const date = new Date(tokens.meta.extractedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `# ${name} — Design System

Extracted from [${tokens.meta.url}](${tokens.meta.url}) on ${date} by [Ditto](https://github.com/ditto).`;
}

function generateVisualTheme(name: string, tokens: DesignTokens, resolved: ResolvedDesign): string {
  const bgLum = getLuminance(resolved.colorBackground);
  const isLight = bgLum > 0.5;

  const primaryColor = tokens.colors.find((c) => c.role === "primary");
  const headingFont = resolved.fontHeading;
  const bodyFont = resolved.fontBody;
  const sameFont = headingFont === bodyFont;

  const moodWords = isLight
    ? "clean and open, with plenty of breathing room"
    : "moody and immersive, pulling you into the interface";

  const colorDesc = primaryColor?.name?.toLowerCase() || "vibrant";

  return `## The Look & Feel

${name} runs on a **${isLight ? "light" : "dark"} palette** — the overall mood is ${moodWords}. The background sits at \`${resolved.colorBackground}\` with text in \`${resolved.colorTextPrimary}\`, giving a ${isLight ? "sharp, readable contrast" : "soft glow that's easy on the eyes"}.

The standout color is a **${colorDesc} \`${resolved.colorPrimary}\`** — you'll see it on buttons, links, and anything that says "click me." It carries the brand without being overwhelming.

Typography-wise, ${sameFont
    ? `everything runs on **${headingFont}** — a single family that keeps things cohesive. Headings punch at weight ${resolved.fontWeightHeading}, body copy sits at ${resolved.fontWeightBody}.`
    : `headings use **${headingFont}** (weight ${resolved.fontWeightHeading}) while body text runs on **${bodyFont}** (weight ${resolved.fontWeightBody}). The pairing creates a nice contrast between editorial and functional.`
  }

Corners are rounded at ${resolved.radiusSm}–${resolved.radiusLg}, which gives the UI a ${parseFloat(resolved.radiusLg) > 16 ? "soft, approachable feel" : parseFloat(resolved.radiusLg) < 8 ? "sharp, precise edge" : "balanced shape — neither too sharp nor too bubbly"}.`;
}

function generateColorPalette(tokens: DesignTokens, resolved: ResolvedDesign): string {
  const grouped = new Map<string, typeof tokens.colors>();
  for (const color of tokens.colors) {
    const role = color.role || "neutral";
    const list = grouped.get(role) || [];
    list.push(color);
    grouped.set(role, list);
  }

  let md = `## Color Palette

Here's the full palette, organized by role. Stick to these — ad-hoc colors break consistency fast.\n`;

  // Brand colors
  md += `\n### Brand\n`;
  md += `| Role | Value | When to use |\n|------|-------|-------------|\n`;
  md += `| Primary | \`${resolved.colorPrimary}\` | CTAs, links, active states, key brand moments |\n`;
  md += `| Secondary | \`${resolved.colorSecondary}\` | Supporting accents, secondary actions |\n`;
  md += `| Accent | \`${resolved.colorAccent}\` | Decorative highlights, illustrations, badges |\n`;

  // Surfaces
  md += `\n### Surfaces\n`;
  md += `| Role | Value | When to use |\n|------|-------|-------------|\n`;
  md += `| Background | \`${resolved.colorBackground}\` | Page canvas |\n`;
  md += `| Surface | \`${resolved.colorSurface}\` | Cards, panels, elevated containers |\n`;

  // Text
  md += `\n### Text\n`;
  md += `| Role | Value | When to use |\n|------|-------|-------------|\n`;
  md += `| Primary | \`${resolved.colorTextPrimary}\` | Headings, labels, important content |\n`;
  md += `| Secondary | \`${resolved.colorTextSecondary}\` | Body copy, descriptions |\n`;
  md += `| Muted | \`${resolved.colorTextMuted}\` | Placeholders, captions, disabled text |\n`;

  // Semantic
  md += `\n### Semantic\n`;
  md += `| Role | Value | When to use |\n|------|-------|-------------|\n`;
  md += `| Border | \`${resolved.colorBorder}\` | Dividers, container edges |\n`;
  md += `| Success | \`${resolved.colorSuccess}\` | Confirmations, positive indicators |\n`;
  md += `| Warning | \`${resolved.colorWarning}\` | Caution states |\n`;
  md += `| Error | \`${resolved.colorError}\` | Destructive actions, validation errors |\n`;

  // Extra colors found
  const extras = tokens.colors.filter(
    (c) => c.role === "neutral" || c.role === "info"
  );
  if (extras.length > 0) {
    md += `\n### Additional Colors\n`;
    for (const color of extras.slice(0, 6)) {
      md += `- \`${color.hex}\` — ${color.name || "Utility"} (${color.occurrences}x in the source)\n`;
    }
  }

  return md;
}

function generateFontSetup(tokens: DesignTokens, resolved: ResolvedDesign): string {
  let md = `## Font Setup\n\n`;
  md += `Copy this section into your project to get the exact typography.\n\n`;

  const fontFamilies = [
    { label: "Heading", family: resolved.fontHeading },
    { label: "Body", family: resolved.fontBody },
    ...(resolved.fontMono !== "ui-monospace" ? [{ label: "Monospace", family: resolved.fontMono }] : []),
  ];

  const seen = new Set<string>();
  const uniqueFonts = fontFamilies.filter((f) => {
    if (seen.has(f.family)) return false;
    seen.add(f.family);
    return true;
  });

  md += `**Fonts used:** `;
  md += uniqueFonts.map((f) => `${f.label} → \`${f.family}\``).join(" · ");
  md += `\n`;

  // Google Fonts
  const googleLinks = tokens.fontSources?.filter((s) => s.type === "google-fonts") || [];
  if (googleLinks.length > 0) {
    md += `\n### Google Fonts\n\n`;
    md += `\`\`\`html\n`;
    for (const link of googleLinks) {
      md += `<link rel="stylesheet" href="${link.href}" />\n`;
    }
    md += `\`\`\`\n`;
  } else {
    const googleCandidates = uniqueFonts
      .filter((f) => !isSystemFont(f.family) && !isMonoSystem(f.family))
      .map((f) => {
        const weights = tokens.typography
          .find((t) => t.fontFamily === f.family)
          ?.weights || [400, 700];
        return { family: f.family, weights };
      });

    if (googleCandidates.length > 0) {
      const families = googleCandidates
        .map((f) => `family=${f.family.replace(/\s/g, "+")}:wght@${f.weights.join(";")}`)
        .join("&");
      const gfUrl = `https://fonts.googleapis.com/css2?${families}&display=swap`;

      md += `\n### Google Fonts (check availability)\n\n`;
      md += `\`\`\`html\n`;
      md += `<link rel="preconnect" href="https://fonts.googleapis.com" />\n`;
      md += `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n`;
      md += `<link rel="stylesheet" href="${gfUrl}" />\n`;
      md += `\`\`\`\n`;
    }
  }

  // Adobe Fonts
  const adobeLinks = tokens.fontSources?.filter((s) => s.type === "adobe-fonts") || [];
  if (adobeLinks.length > 0) {
    md += `\n### Adobe Fonts\n\nRequires an Adobe Fonts subscription.\n\n\`\`\`html\n`;
    for (const link of adobeLinks) md += `<link rel="stylesheet" href="${link.href}" />\n`;
    md += `\`\`\`\n`;
  }

  // CDN
  const cdnLinks = tokens.fontSources?.filter((s) => s.type === "cdn") || [];
  if (cdnLinks.length > 0) {
    md += `\n### CDN\n\n\`\`\`html\n`;
    for (const link of cdnLinks) md += `<link rel="stylesheet" href="${link.href}" />\n`;
    md += `\`\`\`\n`;
  }

  // @font-face
  const faces = tokens.fontFaces || [];
  if (faces.length > 0) {
    md += `\n### Self-Hosted @font-face\n\n`;
    md += `The original site hosts these fonts directly. Download the files and update the \`src\` paths:\n\n`;
    md += `\`\`\`css\n`;
    const byFamily = new Map<string, typeof faces>();
    for (const face of faces) {
      const list = byFamily.get(face.family) || [];
      list.push(face);
      byFamily.set(face.family, list);
    }
    for (const [family, faceList] of byFamily) {
      for (const face of faceList.slice(0, 4)) {
        md += `@font-face {\n  font-family: '${family}';\n  font-weight: ${face.weight};\n  font-style: ${face.style};\n  font-display: ${face.display};\n`;
        if (face.src) {
          const cleanSrc = face.src.length > 200 ? face.src.slice(0, 200) + "..." : face.src;
          md += `  src: ${cleanSrc};\n`;
        }
        md += `}\n\n`;
      }
    }
    md += `\`\`\`\n`;
  }

  // No sources found
  if (googleLinks.length === 0 && adobeLinks.length === 0 && cdnLinks.length === 0 && faces.length === 0) {
    const customFonts = uniqueFonts.filter((f) => !isSystemFont(f.family));
    if (customFonts.length > 0) {
      md += `\n### Custom Fonts\n\n`;
      md += `These appear to be proprietary — check the original site for licensing:\n`;
      for (const f of customFonts) md += `- \`${f.family}\`\n`;
      md += `\nIf you can't get them, fall back to: \`system-ui, -apple-system, sans-serif\`\n`;
    }
  }

  // CSS variables
  md += `\n### CSS Variables\n\n`;
  md += `\`\`\`css\n:root {\n`;
  md += `  --font-heading: '${resolved.fontHeading}', system-ui, sans-serif;\n`;
  md += `  --font-body: '${resolved.fontBody}', system-ui, sans-serif;\n`;
  md += `  --font-mono: '${resolved.fontMono}', ui-monospace, monospace;\n`;
  md += `  --font-weight-heading: ${resolved.fontWeightHeading};\n`;
  md += `  --font-weight-body: ${resolved.fontWeightBody};\n`;
  md += `}\n\`\`\`\n`;

  return md;
}

function isSystemFont(name: string): boolean {
  return /^(system-ui|-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica|Arial|sans-serif|serif|monospace|ui-monospace|SFMono|SF Pro|Menlo|Consolas|Courier)$/i.test(name);
}

function isMonoSystem(name: string): boolean {
  return /^(ui-monospace|SFMono-Regular|Menlo|Consolas|Courier New|monospace)$/i.test(name);
}

function generateTypography(tokens: DesignTokens, resolved: ResolvedDesign): string {
  let md = `## Typography

The type system creates hierarchy through size, weight, and family. Here's the full scale as extracted:\n\n`;

  if (tokens.typeScale.length > 0) {
    md += `| Role | Font | Size | Weight | Line Height | Spacing |\n`;
    md += `|------|------|------|--------|-------------|--------|\n`;
    for (const ts of tokens.typeScale) {
      md += `| ${ts.role} | ${ts.fontFamily} | ${ts.size} | ${ts.weight} | ${ts.lineHeight} | ${ts.letterSpacing} |\n`;
    }
  }

  md += `\n**Ground rules:**\n`;
  md += `- Headings: **${resolved.fontHeading}** at weight **${resolved.fontWeightHeading}**\n`;
  md += `- Body: **${resolved.fontBody}** at weight **${resolved.fontWeightBody}**\n`;
  md += `- Base font size: ${resolved.textBase}\n`;
  md += `- Line heights: tight ${resolved.lineHeightTight} · normal ${resolved.lineHeightNormal} · relaxed ${resolved.lineHeightRelaxed}`;

  return md;
}

function generateComponentStyles(_tokens: DesignTokens, resolved: ResolvedDesign): string {
  const onPrimary = getLuminance(resolved.colorPrimary) > 0.5 ? resolved.colorTextPrimary : "#ffffff";

  return `## Components

These are the building blocks. Every component inherits the system's colors, radius, and type scale.

### Buttons

The primary button is the most important element — it's how users take action.

| Variant | Background | Text | Border | Radius |
|---------|-----------|------|--------|--------|
| **Primary** | \`${resolved.colorPrimary}\` | \`${onPrimary}\` | none | ${resolved.radiusMd} |
| **Secondary** | transparent | \`${resolved.colorPrimary}\` | 1px solid \`${resolved.colorBorder}\` | ${resolved.radiusMd} |
| **Ghost** | transparent | \`${resolved.colorTextSecondary}\` | none | ${resolved.radiusMd} |
| **Danger** | \`${resolved.colorError}\` | \`#ffffff\` | none | ${resolved.radiusMd} |

Padding: SM \`6px 12px\` · MD \`${resolved.spacingSm} ${resolved.spacingMd}\` · LG \`10px 24px\`

### Cards

- Background: \`${resolved.colorSurface}\`
- Border: 1px solid \`${resolved.colorBorder}\`, radius ${resolved.radiusLg}
- Shadow: \`${resolved.shadowSm}\` → hover \`${resolved.shadowMd}\`
- Padding: ${resolved.spacingMd}–${resolved.spacingLg}

### Inputs

- Background: \`${resolved.colorBackground}\`, border: 1px solid \`${resolved.colorBorder}\`
- Radius: ${resolved.radiusMd}, padding: 8px 12px
- Focus state: border switches to \`${resolved.colorPrimary}\`
- Labels: ${resolved.textSm}, weight 500, ${resolved.spacingXs} gap above

### Badges

Use at 15% opacity of the color for background, full color for text, 30% for border.

| Variant | Color |
|---------|-------|
| Default | \`${resolved.colorPrimary}\` |
| Success | \`${resolved.colorSuccess}\` |
| Warning | \`${resolved.colorWarning}\` |
| Error | \`${resolved.colorError}\` |

Padding: 2px 8px · Radius: ${resolved.radiusSm} · Font: ${resolved.textXs}, weight 500

### Tables

Container with 1px \`${resolved.colorBorder}\` border and ${resolved.radiusLg} radius. Header row uses \`${resolved.colorSurface}\` background with \`${resolved.colorTextMuted}\` text. Cell padding: 12px 16px.

### Navigation

Top bar: \`${resolved.colorBackground}\` background, 56px tall, 1px bottom border. Links in \`${resolved.colorTextSecondary}\`, primary CTA button on the right.

Sidebar (if used): 224px wide, \`${resolved.colorSurface}\` background. Active item gets \`${resolved.colorPrimary}\` at 10% opacity with ${resolved.colorPrimary} text.`;
}

function generateLayoutPrinciples(tokens: DesignTokens, resolved: ResolvedDesign): string {
  const spacingValues = tokens.spacing.map((s) => `${s.px}px`).join(", ");

  return `## Layout

### Spacing

Everything is built on a consistent spacing scale. Don't invent values — pick from these:

${spacingValues ? `Full scale: ${spacingValues}\n\n` : ""}| Token | Value | Typical use |
|-------|-------|-------------|
| XS | ${resolved.spacingXs} | Tight gaps, icon-to-label |
| SM | ${resolved.spacingSm} | Input padding, compact lists |
| MD | ${resolved.spacingMd} | Standard gaps, card padding |
| LG | ${resolved.spacingLg} | Section spacing |
| XL | ${resolved.spacingXl} | Major section breaks |
| 2XL | ${resolved.spacing2xl} | Page-level breathing room |

### Border Radius

| Token | Value |
|-------|-------|
| Small | ${resolved.radiusSm} |
| Medium | ${resolved.radiusMd} |
| Large | ${resolved.radiusLg} |
| Full | ${resolved.radiusFull} |

### Grid

Max content width: ~1200px. Standard section padding: ${resolved.spacingXl}–${resolved.spacing2xl}.`;
}

function generateDepthElevation(tokens: DesignTokens, resolved: ResolvedDesign): string {
  let md = `## Depth & Shadows

Shadows create hierarchy. Use them consistently:\n\n`;

  md += `| Level | Value | Use for |\n|-------|-------|--------|\n`;

  if (tokens.shadows.length > 0) {
    const labels = ["Light", "Medium", "Heavy", "Deep"];
    const uses = ["Hover hints, subtle lift", "Cards, dropdowns", "Modals, floating panels", "Overlay panels"];
    for (let i = 0; i < Math.min(tokens.shadows.length, 4); i++) {
      const val = tokens.shadows[i].value;
      const display = val.length > 70 ? val.slice(0, 67) + "..." : val;
      md += `| ${labels[i]} | \`${display}\` | ${uses[i]} |\n`;
    }
  } else {
    md += `| Light | \`${resolved.shadowSm}\` | Hover hints, subtle lift |\n`;
    md += `| Medium | \`${resolved.shadowMd}\` | Cards, dropdowns |\n`;
    md += `| Heavy | \`${resolved.shadowLg}\` | Modals, floating panels |\n`;
  }

  return md;
}

function generateDosAndDonts(resolved: ResolvedDesign): string {
  const isLight = getLuminance(resolved.colorBackground) > 0.5;

  return `## Rules of Thumb

**Do:**
- \`${resolved.colorPrimary}\` is the hero — use it for every primary action
- Headings in \`${resolved.colorTextPrimary}\`, body in \`${resolved.colorTextSecondary}\`, quiet stuff in \`${resolved.colorTextMuted}\`
- Keep radius consistent: ${resolved.radiusSm} for small elements, ${resolved.radiusMd} for default, ${resolved.radiusLg} for containers
- Lean on the spacing scale — it prevents things from looking "off"

**Don't:**
- Skip the palette — random hex values break the system fast
- Use pure ${isLight ? "black" : "white"} for text — \`${resolved.colorTextPrimary}\` exists for a reason
- Mix border-radius sizes on the same surface level
- Go below weight ${resolved.fontWeightBody} for body text — it gets hard to read`;
}

function generateResponsive(resolved: ResolvedDesign): string {
  return `## Responsive

| Breakpoint | Width | What changes |
|-----------|-------|-------------|
| Mobile | <640px | Single column, headings shrink ~20%, tighter padding |
| Tablet | 640–1024px | 2-column grids, moderate spacing |
| Desktop | 1024–1280px | Full layout |
| Large | >1280px | Content centers, generous margins |

Navigation collapses to a hamburger on mobile. Cards stack single-column. The spacing scale compresses proportionally — ${resolved.spacingLg} on desktop might become ${resolved.spacingSm} on mobile.`;
}

function generateAgentPromptGuide(tokens: DesignTokens, resolved: ResolvedDesign): string {
  return `## For AI Agents

This section is optimized for LLMs building with this design system. Paste this file in your project root.

### Quick Reference

| Token | Value |
|-------|-------|
| Primary | \`${resolved.colorPrimary}\` |
| Background | \`${resolved.colorBackground}\` |
| Surface | \`${resolved.colorSurface}\` |
| Text | \`${resolved.colorTextPrimary}\` |
| Text secondary | \`${resolved.colorTextSecondary}\` |
| Muted | \`${resolved.colorTextMuted}\` |
| Border | \`${resolved.colorBorder}\` |
| Heading font | ${resolved.fontHeading} @ ${resolved.fontWeightHeading} |
| Body font | ${resolved.fontBody} @ ${resolved.fontWeightBody} |
| Radius | ${resolved.radiusSm} / ${resolved.radiusMd} / ${resolved.radiusLg} |
| Spacing | ${resolved.spacingXs} / ${resolved.spacingSm} / ${resolved.spacingMd} / ${resolved.spacingLg} / ${resolved.spacingXl} |

### Ready-to-Paste CSS

\`\`\`css
:root {
  --color-primary: ${resolved.colorPrimary};
  --color-secondary: ${resolved.colorSecondary};
  --color-accent: ${resolved.colorAccent};
  --color-bg: ${resolved.colorBackground};
  --color-surface: ${resolved.colorSurface};
  --color-text: ${resolved.colorTextPrimary};
  --color-text-secondary: ${resolved.colorTextSecondary};
  --color-text-muted: ${resolved.colorTextMuted};
  --color-border: ${resolved.colorBorder};
  --color-success: ${resolved.colorSuccess};
  --color-warning: ${resolved.colorWarning};
  --color-error: ${resolved.colorError};
  --radius-sm: ${resolved.radiusSm};
  --radius-md: ${resolved.radiusMd};
  --radius-lg: ${resolved.radiusLg};
  --shadow-sm: ${resolved.shadowSm};
  --shadow-md: ${resolved.shadowMd};
  --shadow-lg: ${resolved.shadowLg};
}
\`\`\`

### Example Prompts

> "Build a hero section: \`${resolved.colorBackground}\` background. Headline at ${resolved.text4xl} in ${resolved.fontHeading} weight ${resolved.fontWeightHeading}, color \`${resolved.colorTextPrimary}\`. Subtitle at ${resolved.textLg}, color \`${resolved.colorTextSecondary}\`. Primary button and a ghost button."

> "Create a card: \`${resolved.colorSurface}\` background, \`${resolved.colorBorder}\` border, ${resolved.radiusLg} radius. Title at ${resolved.textXl} weight ${resolved.fontWeightHeading}. Body at ${resolved.textBase}."

### Iteration Checklist

1. Colors from the palette only — no ad-hoc hex values
2. Headings weight ${resolved.fontWeightHeading}, body weight ${resolved.fontWeightBody}
3. Radius: ${resolved.radiusSm} (small), ${resolved.radiusMd} (default), ${resolved.radiusLg} (containers)
4. Spacing scale: xs → sm → md → lg → xl → 2xl
5. Shadows: light for hover, medium for cards, heavy for modals`;
}

function generateKitFooter(resolved: ResolvedDesign): string {
  return `---

## What's in the Kit

| File | What it does |
|------|-------------|
| \`DESIGN.md\` | This file — the complete reference for humans and AI agents |
| \`tokens.css\` | All tokens as CSS custom properties, ready for \`:root\` |
| \`components.tsx\` | React components styled with the CSS variables |

### Getting Started

1. Drop \`tokens.css\` into your project (or paste the variables into your existing styles)
2. Import components from \`components.tsx\`
3. Keep this \`DESIGN.md\` in your repo root — AI coding tools will pick it up automatically

\`\`\`tsx
import { Button, Card, Input } from './components';

function Example() {
  return (
    <Card style={{ padding: 24 }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: ${resolved.fontWeightHeading} }}>
        Welcome back
      </h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Pick up where you left off.
      </p>
      <Button variant="primary">Continue</Button>
    </Card>
  );
}
\`\`\`

*Generated by [Ditto](https://github.com/ditto) — design system extraction, done right.*`;
}

// Utility
function getLuminance(hex: string): number {
  if (!hex.startsWith("#")) return 0.5;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * HTML section builders for the static Complete Kit.
 *
 * Mirrors `src/components/preview/primitives/sections.tsx` — 4 variants per
 * section (Hero, Features, Stats, Reviews, CTA, Footer). Each builder returns
 * a self-contained HTML string that relies on the CSS variables emitted by
 * `kit-html.ts` (`--d-primary`, `--d-font-heading`, etc).
 *
 * Variants: classic | elegante | artistico | fresco.
 */

import type { ResolvedDesign, SectionVariant } from "../types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function brandMarkHtml(
  r: ResolvedDesign,
  brandName: string,
  opts: { size?: number; nameSize?: string; nameWeight?: number; showName?: boolean; invert?: boolean } = {},
): string {
  const { size = 28, nameSize = "1rem", nameWeight = 700, showName = true, invert = false } = opts;
  const name = escapeHtml(brandName);
  const logoImg = r.logoUrl
    ? `<img src="${escapeHtml(r.logoUrl)}" alt="${name}" style="height:${size}px;width:auto;max-width:${size * 3}px;object-fit:contain;display:block${invert ? ";filter:invert(1) hue-rotate(180deg)" : ""}" />`
    : `<svg role="img" aria-label="${name}" width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><title>${name}</title><path d="M16 0 A16 16 0 0 1 16 32 Z" fill="var(--d-primary)"/><path d="M16 0 A16 16 0 0 0 16 32 Z" fill="var(--d-secondary)"/></svg>`;
  const nameColor = invert ? "var(--d-bg)" : "var(--d-text-primary)";
  const nameSpan = showName
    ? `<span style="color:${nameColor};font-family:var(--d-font-heading);font-weight:${nameWeight};font-size:${nameSize};letter-spacing:-0.01em">${name}</span>`
    : "";
  return `<span style="display:inline-flex;align-items:center;gap:8px">${logoImg}${nameSpan}</span>`;
}

// ════════════════════════════════════════════════════════════════════════
// HERO
// ════════════════════════════════════════════════════════════════════════

function heroClassic(): string {
  return `<section style="padding:80px 32px;text-align:center">
  <span class="badge">New Release v2.0</span>
  <h1 style="margin-top:16px;font-size:2.5rem;line-height:1.15;letter-spacing:-0.01em;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:var(--d-weight-heading)">
    Build beautiful products<br/>faster than ever
  </h1>
  <p style="margin-top:16px;font-size:1.125rem;max-width:36rem;margin-left:auto;margin-right:auto;color:var(--d-text-secondary)">
    The modern platform for teams who want to ship great experiences. Design, develop, and deploy — all in one place.
  </p>
  <div style="margin-top:32px;display:flex;gap:12px;justify-content:center">
    <button class="btn-primary btn-lg">Get Started Free</button>
    <button class="btn-secondary btn-lg">View Demo</button>
  </div>
</section>`;
}

function heroElegante(): string {
  return `<section style="padding:96px 32px;text-align:center;background:var(--d-bg)">
  <div style="max-width:48rem;margin:0 auto">
    <div style="margin-bottom:32px;font-size:0.6875rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--d-text-muted)">— New Collection —</div>
    <h1 style="font-size:3.5rem;line-height:1.05;letter-spacing:-0.02em;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:400">
      Build beautiful products<br/>faster than ever
    </h1>
    <div style="margin:40px auto;height:1px;width:96px;background:var(--d-text-muted)"></div>
    <p style="font-size:1rem;max-width:32rem;margin:0 auto;line-height:1.7;color:var(--d-text-secondary)">
      The modern platform for teams who want to ship great experiences.
    </p>
    <button style="margin-top:40px;display:inline-flex;align-items:center;gap:12px;padding:12px 32px;font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;color:var(--d-text-primary);background:transparent;border:1px solid var(--d-text-primary);border-radius:0">
      Begin the journey <span style="font-size:0.875rem">→</span>
    </button>
  </div>
</section>`;
}

function heroArtistico(): string {
  return `<section style="position:relative;overflow:hidden;padding:80px 32px">
  <div aria-hidden style="position:absolute;top:-48px;right:-48px;width:288px;height:288px;border-radius:50%;background:var(--d-accent);opacity:0.18;filter:blur(40px)"></div>
  <div aria-hidden style="position:absolute;top:128px;right:96px;width:128px;height:128px;border-radius:50%;background:var(--d-primary);opacity:0.35"></div>
  <div aria-hidden style="position:absolute;top:176px;right:192px;width:80px;height:80px;border-radius:50%;background:var(--d-secondary);opacity:0.6"></div>
  <div style="position:relative;display:grid;grid-template-columns:1.3fr 1fr;gap:40px;align-items:center;max-width:72rem;margin:0 auto">
    <div>
      <span style="display:inline-block;padding:4px 12px;font-size:0.75rem;font-weight:600;transform:rotate(-2deg);background:var(--d-accent);color:var(--d-text-primary);border-radius:var(--d-radius-sm)">✦ New Release</span>
      <h1 style="margin-top:24px;font-size:3.25rem;line-height:1.05;letter-spacing:-0.03em;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:800">
        Build beautiful products<br/>faster than ever
      </h1>
      <p style="margin-top:20px;font-size:1.125rem;max-width:32rem;color:var(--d-text-secondary)">
        The modern platform for teams who want to ship great experiences. Design, develop, and deploy — all in one place.
      </p>
      <div style="margin-top:32px;display:flex;gap:12px">
        <button style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;font-size:0.9375rem;font-weight:600;cursor:pointer;background:var(--d-text-primary);color:var(--d-bg);border-radius:var(--d-radius-full);border:none">
          Get Started <span aria-hidden style="color:var(--d-accent)">✦</span>
        </button>
        <button style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;font-size:0.9375rem;font-weight:500;cursor:pointer;background:transparent;color:var(--d-text-primary);border:2px solid var(--d-text-primary);border-radius:var(--d-radius-full)">
          View Demo
        </button>
      </div>
    </div>
    <div style="position:relative;aspect-ratio:1/1;border-radius:var(--d-radius-lg);overflow:hidden;background:var(--d-surface);border:1px solid var(--d-border)">
      <div style="position:absolute;inset:24px;border-radius:var(--d-radius-md);background:linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%);opacity:0.9"></div>
      <div style="position:absolute;bottom:40px;right:40px;width:64px;height:64px;border-radius:50%;background:var(--d-accent)"></div>
    </div>
  </div>
</section>`;
}

function heroFresco(): string {
  return `<section style="padding:48px 24px">
  <div style="position:relative;margin:0 auto;max-width:64rem;overflow:hidden;text-align:center;background:linear-gradient(135deg, color-mix(in srgb, var(--d-primary) 10%, var(--d-surface)) 0%, color-mix(in srgb, var(--d-secondary) 12%, var(--d-surface)) 100%);border-radius:var(--d-radius-lg);padding:64px 32px;border:1px solid var(--d-border)">
    <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;font-size:0.75rem;font-weight:600;background:var(--d-bg);color:var(--d-text-primary);border-radius:var(--d-radius-full);border:1px solid var(--d-border)">🎉 Now live</span>
    <h1 style="margin-top:20px;font-size:2.75rem;line-height:1.08;letter-spacing:-0.01em;font-family:var(--d-font-heading);font-weight:800;background-image:linear-gradient(135deg, var(--d-primary), var(--d-secondary));-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent">
      Build beautiful products<br/>faster than ever
    </h1>
    <p style="margin-top:16px;font-size:1rem;max-width:32rem;margin-left:auto;margin-right:auto;color:var(--d-text-secondary)">
      The modern platform for teams who want to ship great experiences.
    </p>
    <div style="margin-top:28px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button style="display:inline-flex;align-items:center;gap:8px;padding:10px 24px;font-size:0.9375rem;font-weight:600;cursor:pointer;color:var(--d-on-primary);background:linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%);border-radius:var(--d-radius-full);box-shadow:var(--d-shadow-md);border:none">
        Start free <span aria-hidden>→</span>
      </button>
      <button style="display:inline-flex;align-items:center;gap:8px;padding:10px 24px;font-size:0.9375rem;font-weight:500;cursor:pointer;background:var(--d-bg);color:var(--d-text-primary);border-radius:var(--d-radius-full);border:1px solid var(--d-border)">
        See how
      </button>
    </div>
  </div>
</section>`;
}

export function buildHeroHtml(variant: SectionVariant): string {
  switch (variant) {
    case "elegante": return heroElegante();
    case "artistico": return heroArtistico();
    case "fresco": return heroFresco();
    case "classic":
    default: return heroClassic();
  }
}

// ════════════════════════════════════════════════════════════════════════
// FEATURES
// ════════════════════════════════════════════════════════════════════════

const FEATURES = [
  { icon: "⚡", title: "Lightning Fast", desc: "Built for speed with optimized rendering and smart caching." },
  { icon: "🛡️", title: "Fully Secure", desc: "Enterprise-grade security with end-to-end encryption." },
  { icon: "🔗", title: "Easy Integration", desc: "Connect with your favorite tools in just a few clicks." },
];

function featuresClassic(): string {
  return `<section style="padding:64px 32px;background:var(--d-surface)">
  <h2 style="font-size:1.5rem;font-weight:700;text-align:center;margin-bottom:40px;color:var(--d-text-primary);font-family:var(--d-font-heading)">Everything you need</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:56rem;margin:0 auto">
    ${FEATURES.map((f) => `<div class="card" style="padding:24px">
      <div style="margin-bottom:12px;font-size:1.5rem;color:var(--d-primary)">${f.icon}</div>
      <h3 style="font-size:1rem;font-weight:600;margin-bottom:8px;color:var(--d-text-primary)">${f.title}</h3>
      <p style="font-size:0.875rem;color:var(--d-text-secondary)">${f.desc}</p>
    </div>`).join("")}
  </div>
</section>`;
}

function featuresElegante(): string {
  return `<section style="padding:80px 32px;background:var(--d-bg)">
  <div style="max-width:64rem;margin:0 auto">
    <div style="text-align:center;margin-bottom:56px">
      <div style="font-size:0.6875rem;letter-spacing:0.3em;text-transform:uppercase;color:var(--d-text-muted);margin-bottom:12px">— Features —</div>
      <h2 style="font-size:1.875rem;letter-spacing:-0.01em;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:400">What sets us apart</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr)">
      ${FEATURES.map((f, i) => `<div style="padding:8px 32px${i < FEATURES.length - 1 ? ';border-right:1px solid var(--d-border)' : ''}">
        <div style="font-size:2rem;letter-spacing:-0.01em;margin-bottom:16px;font-family:var(--d-font-heading);font-weight:300;color:var(--d-text-muted)">${String(i + 1).padStart(2, "0")}</div>
        <div style="font-size:0.6875rem;letter-spacing:0.22em;text-transform:uppercase;margin-bottom:12px;color:var(--d-text-muted)">${f.title}</div>
        <p style="font-size:0.875rem;line-height:1.6;color:var(--d-text-secondary)">${f.desc}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function featuresArtistico(): string {
  const tints = ["var(--d-primary)", "var(--d-secondary)", "var(--d-accent)"];
  return `<section style="position:relative;overflow:hidden;padding:80px 32px">
  <div style="max-width:64rem;margin:0 auto">
    <h2 style="font-size:2.25rem;letter-spacing:-0.02em;margin-bottom:48px;text-align:center;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:800">Everything you need</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      ${FEATURES.map((f, i) => {
        const rotate = i === 1 ? "rotate(1deg)" : "rotate(-1deg)";
        return `<div style="position:relative;padding:24px;transform:${rotate};background:var(--d-surface);border:2px solid var(--d-text-primary);border-radius:var(--d-radius-lg)">
          <div aria-hidden style="position:absolute;top:-12px;left:-12px;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${tints[i % 3]};font-size:1.25rem">${f.icon}</div>
          <h3 style="margin-top:24px;font-size:1.125rem;margin-bottom:8px;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:700">${f.title}</h3>
          <p style="font-size:0.875rem;line-height:1.6;color:var(--d-text-secondary)">${f.desc}</p>
        </div>`;
      }).join("")}
    </div>
  </div>
</section>`;
}

function featuresFresco(): string {
  return `<section style="padding:64px 24px;background:var(--d-bg)">
  <h2 style="font-size:1.75rem;font-weight:700;text-align:center;margin-bottom:32px;color:var(--d-text-primary);font-family:var(--d-font-heading)">Everything you need</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:56rem;margin:0 auto">
    ${FEATURES.map((f) => `<div style="position:relative;padding:20px;background:var(--d-surface);border-radius:var(--d-radius-lg);border:1px solid var(--d-border);box-shadow:var(--d-shadow-sm)">
      <div aria-hidden style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg, var(--d-primary), var(--d-secondary));border-top-left-radius:var(--d-radius-lg);border-top-right-radius:var(--d-radius-lg)"></div>
      <div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;margin-bottom:12px;border-radius:var(--d-radius-full);background:linear-gradient(135deg, color-mix(in srgb, var(--d-primary) 15%, transparent), color-mix(in srgb, var(--d-secondary) 15%, transparent));font-size:1.125rem">${f.icon}</div>
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:6px;color:var(--d-text-primary)">${f.title}</h3>
      <p style="font-size:0.875rem;color:var(--d-text-secondary)">${f.desc}</p>
    </div>`).join("")}
  </div>
</section>`;
}

export function buildFeaturesHtml(variant: SectionVariant): string {
  switch (variant) {
    case "elegante": return featuresElegante();
    case "artistico": return featuresArtistico();
    case "fresco": return featuresFresco();
    case "classic":
    default: return featuresClassic();
  }
}

// ════════════════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════════════════

const STATS = [
  { label: "Active Users", value: "12,000+" },
  { label: "Uptime", value: "99.99%" },
  { label: "Countries", value: "40+" },
];

function statsClassic(): string {
  return `<section style="padding:0 32px 64px 32px">
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:48rem;margin:0 auto">
    ${STATS.map((s) => `<div style="text-align:center">
      <div style="font-size:1.875rem;font-weight:700;color:var(--d-text-primary);font-family:var(--d-font-heading)">${s.value}</div>
      <div style="font-size:0.875rem;margin-top:4px;color:var(--d-text-muted)">${s.label}</div>
    </div>`).join("")}
  </div>
</section>`;
}

function statsElegante(): string {
  return `<section style="padding:64px 32px;background:var(--d-bg)">
  <div style="display:grid;grid-template-columns:repeat(3,1fr);max-width:56rem;margin:0 auto">
    ${STATS.map((s, i) => `<div style="text-align:center;padding:0 24px${i < STATS.length - 1 ? ';border-right:1px solid var(--d-border)' : ''}">
      <div style="font-size:3rem;letter-spacing:-0.01em;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:300">${s.value}</div>
      <div style="margin-top:12px;font-size:0.6875rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--d-text-muted)">${s.label}</div>
    </div>`).join("")}
  </div>
</section>`;
}

function statsArtistico(): string {
  const tints = ["var(--d-primary)", "var(--d-secondary)", "var(--d-accent)"];
  return `<section style="position:relative;padding:16px 32px 64px">
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:56rem;margin:0 auto">
    ${STATS.map((s, i) => {
      const offset = i === 1 ? "translateY(-12px)" : i === 2 ? "translateY(4px)" : "none";
      return `<div style="position:relative;padding:24px;background:var(--d-surface);border:2px solid var(--d-text-primary);border-radius:var(--d-radius-lg);transform:${offset}">
        <div aria-hidden style="position:absolute;top:-12px;right:-12px;width:40px;height:40px;border-radius:50%;background:${tints[i % 3]}"></div>
        <div style="position:relative;font-size:2.25rem;line-height:1;letter-spacing:-0.02em;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:800">${s.value}</div>
        <div style="position:relative;margin-top:8px;font-size:0.875rem;font-weight:500;color:var(--d-text-secondary)">${s.label}</div>
      </div>`;
    }).join("")}
  </div>
</section>`;
}

function statsFresco(): string {
  return `<section style="padding:8px 24px 48px">
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;max-width:56rem;margin:0 auto">
    ${STATS.map((s) => `<div style="display:flex;align-items:baseline;gap:8px;padding:12px 20px;background:linear-gradient(135deg, color-mix(in srgb, var(--d-primary) 10%, var(--d-surface)) 0%, color-mix(in srgb, var(--d-secondary) 10%, var(--d-surface)) 100%);border:1px solid var(--d-border);border-radius:var(--d-radius-full);box-shadow:var(--d-shadow-sm)">
      <span style="font-size:1.375rem;font-weight:700;color:var(--d-text-primary);font-family:var(--d-font-heading)">${s.value}</span>
      <span style="font-size:0.75rem;color:var(--d-text-muted)">${s.label}</span>
    </div>`).join("")}
  </div>
</section>`;
}

export function buildStatsHtml(variant: SectionVariant): string {
  switch (variant) {
    case "elegante": return statsElegante();
    case "artistico": return statsArtistico();
    case "fresco": return statsFresco();
    case "classic":
    default: return statsClassic();
  }
}

// ════════════════════════════════════════════════════════════════════════
// REVIEWS
// ════════════════════════════════════════════════════════════════════════

const REVIEWS = [
  { name: "Sarah Chen", role: "Product Designer", initials: "SC", text: "This tool has completely changed how we approach design systems. The extraction is incredibly accurate and saves us weeks of work.", rating: 5 },
  { name: "James Wilson", role: "Frontend Lead", initials: "JW", text: "We've tried many design tools but nothing comes close. The generated components work perfectly with our existing codebase.", rating: 5 },
  { name: "Maria Lopez", role: "CTO at StartupXYZ", initials: "ML", text: "The ability to blend multiple design inspirations into a cohesive system is a game changer. Highly recommended.", rating: 4 },
];

function reviewsClassic(): string {
  return `<section style="padding:64px 32px">
  <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:32px;text-align:center;color:var(--d-text-primary);font-family:var(--d-font-heading)">What Our Users Say</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:64rem;margin:0 auto">
    ${REVIEWS.map((r) => `<div style="padding:20px;background:var(--d-surface);border:1px solid var(--d-border);border-radius:var(--d-radius-lg)">
      <div style="display:flex;gap:2px;margin-bottom:12px;font-size:0.875rem">
        ${Array.from({ length: 5 }).map((_, i) => `<span style="color:${i < r.rating ? 'var(--d-warning)' : 'var(--d-border)'}">★</span>`).join("")}
      </div>
      <p style="font-size:0.875rem;margin-bottom:16px;line-height:1.6;color:var(--d-text-secondary)">&ldquo;${r.text}&rdquo;</p>
      <div style="display:flex;align-items:center;gap:12px">
        <div class="avatar" style="width:32px;height:32px;font-size:0.7rem">${r.initials}</div>
        <div>
          <div style="font-size:0.875rem;font-weight:500;color:var(--d-text-primary)">${r.name}</div>
          <div style="font-size:0.75rem;color:var(--d-text-muted)">${r.role}</div>
        </div>
      </div>
    </div>`).join("")}
  </div>
</section>`;
}

function reviewsElegante(): string {
  const top = REVIEWS[0];
  return `<section style="padding:96px 32px;background:var(--d-bg)">
  <div style="max-width:48rem;margin:0 auto;text-align:center">
    <div style="font-size:0.6875rem;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:24px;color:var(--d-text-muted)">— Testimonial —</div>
    <div style="font-size:5rem;line-height:1;margin-bottom:16px;color:var(--d-text-muted);font-family:var(--d-font-heading);font-weight:300">&ldquo;</div>
    <p style="font-size:1.5rem;line-height:1.5;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:400">${top.text}</p>
    <div style="margin:40px auto;height:1px;width:64px;background:var(--d-text-muted)"></div>
    <div style="font-size:0.8125rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--d-text-secondary)">${top.name} <span style="color:var(--d-text-muted)">·</span> ${top.role}</div>
  </div>
</section>`;
}

function reviewsArtistico(): string {
  const tints = ["var(--d-primary)", "var(--d-secondary)", "var(--d-accent)"];
  return `<section style="position:relative;padding:80px 32px;overflow:hidden">
  <h2 style="font-size:2.25rem;letter-spacing:-0.02em;margin-bottom:48px;text-align:center;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:800">What Our Users Say</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:64rem;margin:0 auto">
    ${REVIEWS.map((r, i) => {
      const offset = i === 1 ? "translateY(32px)" : i === 2 ? "translateY(-12px)" : "none";
      return `<div style="position:relative;padding:24px;transform:${offset};background:var(--d-surface);border:2px solid var(--d-text-primary);border-radius:var(--d-radius-lg)">
        <div aria-hidden style="position:absolute;top:-16px;left:-8px;font-size:3rem;line-height:1;color:${tints[i % 3]};font-family:var(--d-font-heading);font-weight:900">&ldquo;</div>
        <p style="font-size:0.875rem;line-height:1.6;margin-bottom:20px;color:var(--d-text-secondary)">${r.text}</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;font-size:0.75rem;font-weight:700;background:${tints[i % 3]};color:var(--d-bg);border-radius:var(--d-radius-full)">${r.initials}</div>
          <div>
            <div style="font-size:0.875rem;font-weight:700;color:var(--d-text-primary)">${r.name}</div>
            <div style="font-size:0.75rem;color:var(--d-text-muted)">${r.role}</div>
          </div>
        </div>
      </div>`;
    }).join("")}
  </div>
</section>`;
}

function reviewsFresco(): string {
  return `<section style="padding:64px 24px;background:var(--d-surface)">
  <h2 style="font-size:1.75rem;font-weight:700;margin-bottom:32px;text-align:center;color:var(--d-text-primary);font-family:var(--d-font-heading)">Loved by teams</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:64rem;margin:0 auto">
    ${REVIEWS.map((r) => `<div style="position:relative;padding:20px;background:var(--d-bg);border-radius:var(--d-radius-lg);border:1px solid var(--d-border);box-shadow:var(--d-shadow-sm)">
      <div style="margin-bottom:12px;font-size:0.875rem">
        ${Array.from({ length: r.rating }).map(() => `<span style="color:var(--d-warning)">★</span>`).join("")}
      </div>
      <p style="font-size:0.875rem;line-height:1.6;margin-bottom:16px;color:var(--d-text-secondary)">${r.text}</p>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;font-size:0.75rem;font-weight:700;background:linear-gradient(135deg, var(--d-primary), var(--d-secondary));color:var(--d-on-primary);border-radius:var(--d-radius-full)">${r.initials}</div>
        <div>
          <div style="font-size:0.8125rem;font-weight:600;color:var(--d-text-primary)">${r.name}</div>
          <div style="font-size:0.6875rem;color:var(--d-text-muted)">${r.role}</div>
        </div>
      </div>
    </div>`).join("")}
  </div>
</section>`;
}

export function buildReviewsHtml(variant: SectionVariant): string {
  switch (variant) {
    case "elegante": return reviewsElegante();
    case "artistico": return reviewsArtistico();
    case "fresco": return reviewsFresco();
    case "classic":
    default: return reviewsClassic();
  }
}

// ════════════════════════════════════════════════════════════════════════
// CTA
// ════════════════════════════════════════════════════════════════════════

function ctaClassic(): string {
  return `<section style="padding:64px 32px;text-align:center">
  <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:12px;color:var(--d-text-primary);font-family:var(--d-font-heading)">Ready to get started?</h2>
  <p style="font-size:0.875rem;margin-bottom:24px;color:var(--d-text-secondary)">Join thousands of teams already building with us.</p>
  <div style="display:flex;gap:12px;justify-content:center;max-width:28rem;margin:0 auto">
    <input class="input-field" placeholder="Enter your email" style="flex:1">
    <button class="btn-primary btn-md">Subscribe</button>
  </div>
</section>`;
}

function ctaElegante(): string {
  return `<section style="padding:96px 32px;text-align:center;background:var(--d-bg)">
  <div style="max-width:36rem;margin:0 auto">
    <div style="font-size:0.6875rem;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:24px;color:var(--d-text-muted)">— Join us —</div>
    <h2 style="font-size:2.5rem;line-height:1.15;letter-spacing:-0.01em;color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:400">Begin the journey</h2>
    <p style="margin-top:24px;font-size:1rem;color:var(--d-text-secondary)">Join a community of makers shipping remarkable work.</p>
    <div style="margin-top:40px;display:flex;align-items:center;justify-content:center;gap:16px;padding-bottom:8px;border-bottom:1px solid var(--d-text-primary)">
      <input type="email" placeholder="your@email.com" style="flex:1;background:transparent;outline:none;font-size:0.875rem;padding:4px 0;color:var(--d-text-primary);border:none">
      <button style="font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;color:var(--d-text-primary);background:none;border:none">Subscribe →</button>
    </div>
  </div>
</section>`;
}

function ctaArtistico(): string {
  return `<section style="position:relative;overflow:hidden;padding:80px 32px;text-align:center;background:linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%)">
  <div aria-hidden style="position:absolute;top:-80px;left:-80px;width:320px;height:320px;border-radius:50%;background:var(--d-accent);opacity:0.25;filter:blur(60px)"></div>
  <div aria-hidden style="position:absolute;bottom:-80px;right:-80px;width:384px;height:384px;border-radius:50%;background:var(--d-bg);opacity:0.1;filter:blur(60px)"></div>
  <div style="position:relative;max-width:42rem;margin:0 auto">
    <h2 style="font-size:2.75rem;line-height:1.05;letter-spacing:-0.02em;color:var(--d-on-primary);font-family:var(--d-font-heading);font-weight:800">Ready to get started?</h2>
    <p style="margin-top:20px;font-size:1.125rem;color:var(--d-on-primary);opacity:0.9">Join thousands of teams already building with us.</p>
    <button style="margin-top:40px;display:inline-flex;align-items:center;gap:8px;padding:14px 32px;font-size:1rem;font-weight:600;cursor:pointer;background:var(--d-text-primary);color:var(--d-bg);border-radius:var(--d-radius-full);border:none">
      Get Started <span aria-hidden style="color:var(--d-accent)">✦</span>
    </button>
  </div>
</section>`;
}

function ctaFresco(): string {
  return `<section style="padding:48px 24px">
  <div style="position:relative;margin:0 auto;max-width:48rem;padding:48px 32px;text-align:center;overflow:hidden;background:linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%);border-radius:var(--d-radius-lg);box-shadow:var(--d-shadow-lg)">
    <h2 style="font-size:1.875rem;font-weight:700;color:var(--d-on-primary);font-family:var(--d-font-heading)">Start free today 🚀</h2>
    <p style="margin-top:8px;font-size:0.875rem;color:var(--d-on-primary);opacity:0.9">No credit card, no tricks. Just free forever.</p>
    <div style="margin:24px auto 0;max-width:28rem;display:flex;align-items:center;gap:8px;padding:6px;background:var(--d-bg);border-radius:var(--d-radius-full);box-shadow:var(--d-shadow-md)">
      <input type="email" placeholder="Enter your email" style="flex:1;background:transparent;outline:none;padding:0 12px;font-size:0.875rem;color:var(--d-text-primary);border:none">
      <button style="padding:6px 16px;font-size:0.8125rem;font-weight:600;cursor:pointer;color:var(--d-on-primary);background:linear-gradient(135deg, var(--d-primary) 0%, var(--d-secondary) 100%);border-radius:var(--d-radius-full);border:none">Start free</button>
    </div>
  </div>
</section>`;
}

export function buildCtaHtml(variant: SectionVariant): string {
  switch (variant) {
    case "elegante": return ctaElegante();
    case "artistico": return ctaArtistico();
    case "fresco": return ctaFresco();
    case "classic":
    default: return ctaClassic();
  }
}

// ════════════════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════════════════

const FOOTER_SECTIONS = [
  { title: "Product", links: ["Features", "Pricing", "Changelog"] },
  { title: "Company", links: ["About", "Blog", "Careers"] },
  { title: "Legal", links: ["Privacy", "Terms", "Cookies"] },
];

function footerClassic(r: ResolvedDesign, brandName: string): string {
  const brand = brandMarkHtml(r, brandName, { size: 20, nameSize: "0.9375rem" });
  return `<footer class="footer-bar">
  <div style="display:flex;justify-content:space-between;max-width:72rem;margin:0 auto">
    <div>
      <div style="margin-bottom:8px">${brand}</div>
      <div style="font-size:0.8125rem;color:var(--d-text-muted)">Building the future, one pixel at a time.</div>
    </div>
    <div style="display:flex;gap:48px">
      ${FOOTER_SECTIONS.map((s) => `<div>
        <div style="font-size:0.8125rem;font-weight:600;margin-bottom:12px;color:var(--d-text-primary)">${s.title}</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${s.links.map((l) => `<span style="font-size:0.8125rem;cursor:pointer;color:var(--d-text-muted)">${l}</span>`).join("")}
        </div>
      </div>`).join("")}
    </div>
  </div>
</footer>`;
}

function footerElegante(r: ResolvedDesign, brandName: string): string {
  const brand = brandMarkHtml(r, brandName, { size: 28, nameSize: "1.125rem", nameWeight: 400 });
  const allLinks = FOOTER_SECTIONS.flatMap((s) => s.links);
  return `<footer style="padding:64px 32px 32px;margin-top:auto;background:var(--d-bg)">
  <div style="max-width:56rem;margin:0 auto;text-align:center">
    <div style="margin-bottom:24px;display:flex;justify-content:center">${brand}</div>
    <div style="font-size:0.6875rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--d-text-muted)">Crafted with care.</div>
    <div style="margin:32px auto;height:1px;width:96px;background:var(--d-border)"></div>
    <div style="display:flex;justify-content:center;gap:40px;flex-wrap:wrap">
      ${allLinks.map((l) => `<span style="font-size:0.6875rem;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;color:var(--d-text-secondary)">${l}</span>`).join("")}
    </div>
  </div>
</footer>`;
}

function footerArtistico(r: ResolvedDesign, brandName: string): string {
  const brand = brandMarkHtml(r, brandName, { size: 32, nameSize: "1.25rem", nameWeight: 800, invert: true });
  return `<footer style="position:relative;padding:64px 32px 32px;margin-top:auto;overflow:hidden;background:var(--d-text-primary)">
  <div aria-hidden style="position:absolute;bottom:-96px;right:-48px;width:320px;height:320px;border-radius:50%;background:var(--d-accent);opacity:0.15;filter:blur(60px)"></div>
  <div style="position:relative;max-width:72rem;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:32px">
    <div>
      ${brand}
      <p style="margin-top:12px;font-size:0.875rem;max-width:18rem;color:var(--d-bg);opacity:0.7">We ship beautiful things.</p>
      <div style="margin-top:16px;display:flex;gap:8px">
        <span aria-hidden style="display:inline-block;width:32px;height:32px;border-radius:50%;background:var(--d-primary)"></span>
        <span aria-hidden style="display:inline-block;width:32px;height:32px;border-radius:50%;background:var(--d-secondary)"></span>
        <span aria-hidden style="display:inline-block;width:32px;height:32px;border-radius:50%;background:var(--d-accent)"></span>
      </div>
    </div>
    ${FOOTER_SECTIONS.map((s) => `<div>
      <div style="font-size:0.6875rem;letter-spacing:0.22em;text-transform:uppercase;margin-bottom:12px;font-weight:700;color:var(--d-accent)">${s.title}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${s.links.map((l) => `<span style="font-size:0.875rem;cursor:pointer;color:var(--d-bg);opacity:0.8">${l}</span>`).join("")}
      </div>
    </div>`).join("")}
  </div>
</footer>`;
}

function footerFresco(r: ResolvedDesign, brandName: string): string {
  const brand = brandMarkHtml(r, brandName, { size: 22, nameSize: "0.9375rem" });
  return `<footer style="padding:24px 24px 32px;margin-top:auto;background:var(--d-bg)">
  <div style="position:relative;margin:0 auto;max-width:72rem;padding:32px;background:var(--d-surface);border-radius:var(--d-radius-lg);border:1px solid var(--d-border);box-shadow:var(--d-shadow-sm)">
    <div aria-hidden style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg, var(--d-primary), var(--d-secondary));border-top-left-radius:var(--d-radius-lg);border-top-right-radius:var(--d-radius-lg)"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:32px">
      <div>
        <div style="margin-bottom:8px">${brand}</div>
        <div style="font-size:0.8125rem;color:var(--d-text-muted)">Made with ❤️ for teams that ship.</div>
      </div>
      <div style="display:flex;gap:32px;flex-wrap:wrap">
        ${FOOTER_SECTIONS.map((s) => `<div>
          <div style="font-size:0.75rem;font-weight:700;margin-bottom:12px;display:inline-flex;align-items:center;gap:6px;color:var(--d-text-primary)">
            <span aria-hidden style="width:6px;height:6px;border-radius:50%;background:var(--d-primary)"></span>
            ${s.title}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${s.links.map((l) => `<span style="font-size:0.8125rem;cursor:pointer;color:var(--d-text-muted)">${l}</span>`).join("")}
          </div>
        </div>`).join("")}
      </div>
    </div>
  </div>
</footer>`;
}

export function buildLandingFooterHtml(
  r: ResolvedDesign,
  brandName: string,
  variant: SectionVariant,
): string {
  switch (variant) {
    case "elegante": return footerElegante(r, brandName);
    case "artistico": return footerArtistico(r, brandName);
    case "fresco": return footerFresco(r, brandName);
    case "classic":
    default: return footerClassic(r, brandName);
  }
}

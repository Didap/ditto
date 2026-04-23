/**
 * Standalone HTML page generator for the Download Kit.
 *
 * Generates self-contained HTML files with Tailwind CDN + inlined CSS variables
 * that can be opened directly in a browser — no build step, no dependencies.
 */

import type { ResolvedDesign, FontSource, HeaderVariant } from "../types";

// ── Brand mark helpers ──

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildBrandMarkHtml(
  r: ResolvedDesign,
  brandName: string,
  opts: { size?: number; nameSize?: string; nameWeight?: number; showName?: boolean } = {},
): string {
  const { size = 28, nameSize = "1rem", nameWeight = 700, showName = true } = opts;
  const name = escapeHtml(brandName);
  const logoImg = r.logoUrl
    ? `<img src="${escapeHtml(r.logoUrl)}" alt="${name}" style="height:${size}px;width:auto;max-width:${size * 3}px;object-fit:contain;display:block" />`
    : `<svg role="img" aria-label="${name}" width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><title>${name}</title><path d="M16 0 A16 16 0 0 1 16 32 Z" fill="var(--d-primary)"/><path d="M16 0 A16 16 0 0 0 16 32 Z" fill="var(--d-secondary)"/></svg>`;
  const nameSpan = showName
    ? `<span style="color:var(--d-text-primary);font-family:var(--d-font-heading);font-weight:${nameWeight};font-size:${nameSize};letter-spacing:-0.01em">${name}</span>`
    : "";
  return `<span style="display:inline-flex;align-items:center;gap:8px">${logoImg}${nameSpan}</span>`;
}

function buildNavHtml(r: ResolvedDesign, brandName: string, variant: HeaderVariant): string {
  const brand = buildBrandMarkHtml(r, brandName);
  const links = ["Home", "Features", "Pricing", "Blog"];

  if (variant === "elegante") {
    const brandLg = buildBrandMarkHtml(r, brandName, { size: 32, nameSize: "1.25rem", nameWeight: 500 });
    return `<nav style="display:flex;flex-direction:column;align-items:center;padding:24px 24px 0;background:var(--d-bg)">
  <div style="width:100%;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
    <span style="width:96px"></span>
    ${brandLg}
    <div style="width:96px;display:flex;justify-content:flex-end">
      <button style="font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--d-text-secondary);background:none;border:none;cursor:pointer">Get Started</button>
    </div>
  </div>
  <div style="width:100%;height:1px;background:var(--d-border)"></div>
  <div style="display:flex;justify-content:center;gap:40px;padding:12px 0">
    ${links.map((l) => `<span style="font-size:0.75rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--d-text-secondary);cursor:pointer">${l}</span>`).join("")}
  </div>
  <div style="width:100%;height:1px;background:var(--d-border)"></div>
</nav>`;
  }

  if (variant === "artistico") {
    const brandBold = buildBrandMarkHtml(r, brandName, { size: 32, nameSize: "1.125rem", nameWeight: 800 });
    return `<nav style="position:relative;display:flex;align-items:center;justify-content:space-between;padding:20px 24px;background:var(--d-bg)">
  <div style="position:relative">
    <span aria-hidden style="position:absolute;left:-8px;top:-8px;width:40px;height:40px;border-radius:50%;background:var(--d-accent);opacity:0.25;filter:blur(2px)"></span>
    <span style="position:relative">${brandBold}</span>
  </div>
  <div style="position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;padding:6px 8px;background:color-mix(in srgb, var(--d-surface) 80%, transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--d-border);border-radius:var(--d-radius-full);box-shadow:var(--d-shadow-sm)">
    ${links
      .map(
        (l, i) =>
          `<span style="padding:4px 12px;font-size:0.8125rem;cursor:pointer;color:${i === 0 ? "var(--d-text-primary)" : "var(--d-text-secondary)"};background:${i === 0 ? "color-mix(in srgb, var(--d-primary) 12%, transparent)" : "transparent"};border-radius:var(--d-radius-full);font-weight:${i === 0 ? 600 : 400}">${l}</span>`,
      )
      .join("")}
  </div>
  <button style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;font-size:0.875rem;font-weight:600;cursor:pointer;color:var(--d-text-primary);background:transparent;border:2px solid var(--d-text-primary);border-radius:var(--d-radius-full)">
    Get Started <span aria-hidden style="color:var(--d-accent)">✦</span>
  </button>
</nav>`;
  }

  if (variant === "fresco") {
    const brandSm = buildBrandMarkHtml(r, brandName, { size: 26, nameSize: "0.9375rem", nameWeight: 700 });
    const dots = ["●", "◆", "■", "▲"];
    return `<nav style="padding:16px 16px 0;background:var(--d-bg)">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--d-surface);border:1px solid var(--d-border);border-radius:var(--d-radius-full);box-shadow:var(--d-shadow-sm)">
    ${brandSm}
    <div style="display:flex;align-items:center;gap:4px">
      ${links
        .map(
          (l, i) =>
            `<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;font-size:0.8125rem;cursor:pointer;color:var(--d-text-secondary);border-radius:var(--d-radius-full)"><span aria-hidden style="font-size:0.625rem;color:var(--d-primary)">${dots[i % dots.length]}</span>${l}</span>`,
        )
        .join("")}
    </div>
    <button style="display:inline-flex;align-items:center;padding:6px 16px;font-size:0.8125rem;font-weight:600;cursor:pointer;color:var(--d-on-primary);background:linear-gradient(135deg,var(--d-primary) 0%,var(--d-secondary) 100%);border-radius:var(--d-radius-full);box-shadow:var(--d-shadow-sm);border:none">Start free</button>
  </div>
</nav>`;
  }

  // Classic (default)
  return `<nav class="nav-bar">
  ${brand}
  <div class="flex items-center gap-6">
    ${links.map((l) => `<span class="text-sm" style="color: var(--d-text-secondary)">${l}</span>`).join("")}
    <button class="btn-primary btn-sm">Get Started</button>
  </div>
</nav>`;
}

function buildFooterHtml(r: ResolvedDesign, brandName: string): string {
  const brand = buildBrandMarkHtml(r, brandName, { size: 20, nameSize: "0.9375rem" });
  return `<footer class="footer-bar">
  <div class="flex justify-between">
    <div>
      <div style="margin-bottom: 8px">${brand}</div>
      <div class="text-sm" style="color: var(--d-text-muted)">Building the future, one pixel at a time.</div>
    </div>
    <div class="flex gap-12">
      <div>
        <div class="text-sm font-semibold mb-3" style="color: var(--d-text-primary)">Product</div>
        <div class="flex flex-col gap-2 text-sm" style="color: var(--d-text-muted)">
          <span>Link One</span><span>Link Two</span><span>Link Three</span>
        </div>
      </div>
      <div>
        <div class="text-sm font-semibold mb-3" style="color: var(--d-text-primary)">Company</div>
        <div class="flex flex-col gap-2 text-sm" style="color: var(--d-text-muted)">
          <span>Link One</span><span>Link Two</span><span>Link Three</span>
        </div>
      </div>
      <div>
        <div class="text-sm font-semibold mb-3" style="color: var(--d-text-primary)">Legal</div>
        <div class="flex flex-col gap-2 text-sm" style="color: var(--d-text-muted)">
          <span>Link One</span><span>Link Two</span><span>Link Three</span>
        </div>
      </div>
    </div>
  </div>
</footer>`;
}

function cssVarsBlock(r: ResolvedDesign): string {
  const onPrimary = (() => {
    const hex = r.colorPrimary.replace("#", "");
    const red = parseInt(hex.slice(0, 2), 16) / 255;
    const green = parseInt(hex.slice(2, 4), 16) / 255;
    const blue = parseInt(hex.slice(4, 6), 16) / 255;
    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const lum = 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
    return lum > 0.5 ? r.colorTextPrimary : "#ffffff";
  })();

  return `  :root {
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
    --d-on-primary: ${onPrimary};
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
  }`;
}

function fontLinks(fontSources: FontSource[]): string {
  const seen = new Set<string>();
  return fontSources
    .filter((s) => {
      if (seen.has(s.href)) return false;
      seen.add(s.href);
      return s.type === "google-fonts" || s.type === "adobe-fonts" || s.type === "cdn";
    })
    .map((s) => `  <link rel="stylesheet" href="${s.href}">`)
    .join("\n");
}

function wrap(title: string, body: string, r: ResolvedDesign, fonts: FontSource[]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
${fontLinks(fonts)}
  <style>
${cssVarsBlock(r)}
  body {
    margin: 0;
    background: var(--d-bg);
    color: var(--d-text-primary);
    font-family: var(--d-font-body);
  }
  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 500; cursor: pointer; transition: all 0.15s;
    background: var(--d-primary); color: var(--d-on-primary);
    border-radius: var(--d-radius-md); border: none;
  }
  .btn-secondary {
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 500; cursor: pointer; transition: all 0.15s;
    background: transparent; color: var(--d-primary);
    border-radius: var(--d-radius-md); border: 1px solid var(--d-border);
  }
  .btn-ghost {
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 500; cursor: pointer; transition: all 0.15s;
    background: transparent; color: var(--d-text-secondary);
    border-radius: var(--d-radius-md); border: none;
  }
  .btn-sm { padding: 6px 12px; font-size: 0.8125rem; }
  .btn-md { padding: 8px 16px; font-size: 0.875rem; }
  .btn-lg { padding: 10px 24px; font-size: 1rem; }
  .card {
    background: var(--d-surface); border: 1px solid var(--d-border);
    border-radius: var(--d-radius-lg); box-shadow: var(--d-shadow-sm);
  }
  .badge {
    display: inline-flex; align-items: center;
    padding: 2px 8px; font-size: 0.75rem; font-weight: 500;
    border-radius: var(--d-radius-sm);
    background: color-mix(in srgb, var(--d-primary) 15%, transparent);
    color: var(--d-primary);
    border: 1px solid color-mix(in srgb, var(--d-primary) 30%, transparent);
  }
  .badge-success {
    background: color-mix(in srgb, var(--d-success) 15%, transparent);
    color: var(--d-success);
    border-color: color-mix(in srgb, var(--d-success) 30%, transparent);
  }
  .input-field {
    width: 100%; padding: 8px 12px; font-size: 0.875rem;
    background: var(--d-bg); color: var(--d-text-primary);
    border: 1px solid var(--d-border); border-radius: var(--d-radius-md);
    outline: none;
  }
  .nav-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 24px; background: var(--d-bg);
    border-bottom: 1px solid var(--d-border);
  }
  .avatar {
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 500; font-size: 0.8125rem;
    background: color-mix(in srgb, var(--d-primary) 20%, transparent);
    color: var(--d-primary); border-radius: var(--d-radius-full);
  }
  .stat-card { background: var(--d-surface); border: 1px solid var(--d-border); border-radius: var(--d-radius-lg); box-shadow: var(--d-shadow-sm); padding: 20px; }
  .footer-bar { padding: 24px 32px; background: var(--d-surface); border-top: 1px solid var(--d-border); margin-top: auto; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

// ── Shared HTML fragments (now dynamic — see buildNavHtml / buildFooterHtml) ──

// ── Shared new component HTML ──

const reviewsHtml = `<section class="px-8 py-16">
  <h2 class="text-xl font-bold mb-8 text-center" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">What Our Users Say</h2>
  <div class="grid grid-cols-3 gap-5">
    <div class="p-5" style="background: var(--d-surface); border: 1px solid var(--d-border); border-radius: var(--d-radius-lg)">
      <div class="flex gap-0.5 mb-3"><span style="color: var(--d-warning)">★★★★★</span></div>
      <p class="text-sm mb-4 leading-relaxed" style="color: var(--d-text-secondary)">"This tool has completely changed how we approach design systems. The extraction is incredibly accurate."</p>
      <div class="flex items-center gap-3">
        <div class="avatar" style="width:32px;height:32px;font-size:0.7rem">SC</div>
        <div><div class="text-sm font-medium" style="color: var(--d-text-primary)">Sarah Chen</div><div class="text-xs" style="color: var(--d-text-muted)">Product Designer</div></div>
      </div>
    </div>
    <div class="p-5" style="background: var(--d-surface); border: 1px solid var(--d-border); border-radius: var(--d-radius-lg)">
      <div class="flex gap-0.5 mb-3"><span style="color: var(--d-warning)">★★★★★</span></div>
      <p class="text-sm mb-4 leading-relaxed" style="color: var(--d-text-secondary)">"We've tried many design tools but nothing comes close. The generated components work perfectly."</p>
      <div class="flex items-center gap-3">
        <div class="avatar" style="width:32px;height:32px;font-size:0.7rem">JW</div>
        <div><div class="text-sm font-medium" style="color: var(--d-text-primary)">James Wilson</div><div class="text-xs" style="color: var(--d-text-muted)">Frontend Lead</div></div>
      </div>
    </div>
    <div class="p-5" style="background: var(--d-surface); border: 1px solid var(--d-border); border-radius: var(--d-radius-lg)">
      <div class="flex gap-0.5 mb-3"><span style="color: var(--d-warning)">★★★★</span><span style="color: var(--d-border)">★</span></div>
      <p class="text-sm mb-4 leading-relaxed" style="color: var(--d-text-secondary)">"The ability to blend multiple design inspirations into a cohesive system is a game changer."</p>
      <div class="flex items-center gap-3">
        <div class="avatar" style="width:32px;height:32px;font-size:0.7rem">ML</div>
        <div><div class="text-sm font-medium" style="color: var(--d-text-primary)">Maria Lopez</div><div class="text-xs" style="color: var(--d-text-muted)">CTO at StartupXYZ</div></div>
      </div>
    </div>
  </div>
</section>`;

const faqHtml = `<section class="px-8 py-16 max-w-2xl mx-auto">
  <h2 class="text-xl font-bold mb-6 text-center" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Frequently Asked Questions</h2>
  <div>
    <details style="border-bottom: 1px solid var(--d-border)">
      <summary class="py-4 text-sm font-medium cursor-pointer" style="color: var(--d-text-primary)">What is included in the free plan?</summary>
      <p class="pb-4 text-sm leading-relaxed" style="color: var(--d-text-secondary)">The free plan includes up to 3 projects, basic analytics, community support, and 1 GB of storage.</p>
    </details>
    <details style="border-bottom: 1px solid var(--d-border)">
      <summary class="py-4 text-sm font-medium cursor-pointer" style="color: var(--d-text-primary)">Can I upgrade or downgrade at any time?</summary>
      <p class="pb-4 text-sm leading-relaxed" style="color: var(--d-text-secondary)">Yes, you can change your plan at any time. Upgrades are effective immediately.</p>
    </details>
    <details style="border-bottom: 1px solid var(--d-border)">
      <summary class="py-4 text-sm font-medium cursor-pointer" style="color: var(--d-text-primary)">Do you offer a free trial?</summary>
      <p class="pb-4 text-sm leading-relaxed" style="color: var(--d-text-secondary)">Yes! All paid plans come with a 14-day free trial. No credit card required.</p>
    </details>
    <details style="border-bottom: 1px solid var(--d-border)">
      <summary class="py-4 text-sm font-medium cursor-pointer" style="color: var(--d-text-primary)">What payment methods do you accept?</summary>
      <p class="pb-4 text-sm leading-relaxed" style="color: var(--d-text-secondary)">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
    </details>
    <details style="border-bottom: 1px solid var(--d-border)">
      <summary class="py-4 text-sm font-medium cursor-pointer" style="color: var(--d-text-primary)">Is there a refund policy?</summary>
      <p class="pb-4 text-sm leading-relaxed" style="color: var(--d-text-secondary)">We offer a 30-day money-back guarantee on all paid plans. No questions asked.</p>
    </details>
  </div>
</section>`;

const contactFormHtml = `<section class="px-8 py-12 max-w-lg mx-auto">
  <div class="card p-6">
    <h3 class="text-lg font-semibold mb-1" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Get in Touch</h3>
    <p class="text-sm mb-5" style="color: var(--d-text-muted)">We'd love to hear from you.</p>
    <div class="flex flex-col gap-3">
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5"><label class="text-sm font-medium" style="color: var(--d-text-primary)">First Name</label><input class="input-field" placeholder="John"></div>
        <div class="flex flex-col gap-1.5"><label class="text-sm font-medium" style="color: var(--d-text-primary)">Last Name</label><input class="input-field" placeholder="Doe"></div>
      </div>
      <div class="flex flex-col gap-1.5"><label class="text-sm font-medium" style="color: var(--d-text-primary)">Email</label><input class="input-field" placeholder="john@example.com"></div>
      <div class="flex flex-col gap-1.5"><label class="text-sm font-medium" style="color: var(--d-text-primary)">Message</label><textarea class="input-field" rows="4" placeholder="How can we help you?" style="resize:none"></textarea></div>
      <div class="flex items-center justify-between mt-1">
        <span class="text-xs" style="color: var(--d-text-muted)">We'll respond within 24 hours</span>
        <button class="btn-primary btn-md">Send Message</button>
      </div>
    </div>
  </div>
</section>`;

const chartsHtml = `<div class="grid grid-cols-2 gap-4 mb-6">
  <div class="p-4" style="background: var(--d-surface); border: 1px solid var(--d-border); border-radius: var(--d-radius-lg)">
    <div class="text-sm font-semibold mb-4" style="color: var(--d-text-primary)">Monthly Revenue</div>
    <div class="flex items-end gap-2" style="height:160px">
      <div class="flex-1 flex flex-col items-center gap-1"><div style="height:91px;width:100%;background:var(--d-primary);opacity:0.87;border-radius:var(--d-radius-sm) var(--d-radius-sm) 0 0"></div><span class="text-xs" style="color:var(--d-text-muted)">Jan</span></div>
      <div class="flex-1 flex flex-col items-center gap-1"><div style="height:70px;width:100%;background:var(--d-primary);opacity:0.85;border-radius:var(--d-radius-sm) var(--d-radius-sm) 0 0"></div><span class="text-xs" style="color:var(--d-text-muted)">Feb</span></div>
      <div class="flex-1 flex flex-col items-center gap-1"><div style="height:121px;width:100%;background:var(--d-primary);opacity:0.91;border-radius:var(--d-radius-sm) var(--d-radius-sm) 0 0"></div><span class="text-xs" style="color:var(--d-text-muted)">Mar</span></div>
      <div class="flex-1 flex flex-col items-center gap-1"><div style="height:81px;width:100%;background:var(--d-primary);opacity:0.86;border-radius:var(--d-radius-sm) var(--d-radius-sm) 0 0"></div><span class="text-xs" style="color:var(--d-text-muted)">Apr</span></div>
      <div class="flex-1 flex flex-col items-center gap-1"><div style="height:140px;width:100%;background:var(--d-primary);opacity:1;border-radius:var(--d-radius-sm) var(--d-radius-sm) 0 0"></div><span class="text-xs" style="color:var(--d-text-muted)">May</span></div>
      <div class="flex-1 flex flex-col items-center gap-1"><div style="height:109px;width:100%;background:var(--d-primary);opacity:0.89;border-radius:var(--d-radius-sm) var(--d-radius-sm) 0 0"></div><span class="text-xs" style="color:var(--d-text-muted)">Jun</span></div>
    </div>
  </div>
  <div class="p-4" style="background: var(--d-surface); border: 1px solid var(--d-border); border-radius: var(--d-radius-lg)">
    <div class="text-sm font-semibold mb-3" style="color: var(--d-text-primary)">Weekly Trend</div>
    <svg viewBox="0 0 100 120" style="width:100%;height:120px">
      <polyline points="0,110 16.7,71 33.3,87 50,33 66.7,55 83.3,7 100,29" fill="none" stroke="var(--d-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</div>`;

// ── Page generators ──

function landingHtml(r: ResolvedDesign, brandName: string, variant: HeaderVariant): string {
  return `<div class="flex flex-col min-h-screen">
  ${buildNavHtml(r, brandName, variant)}

  <!-- Hero -->
  <section class="px-8 py-20 text-center">
    <span class="badge">New Release v2.0</span>
    <h1 class="mt-4 text-5xl leading-tight tracking-tight" style="color: var(--d-text-primary); font-family: var(--d-font-heading); font-weight: var(--d-weight-heading)">
      Build beautiful products<br>faster than ever
    </h1>
    <p class="mt-4 text-lg max-w-xl mx-auto" style="color: var(--d-text-secondary)">
      The modern platform for teams who want to ship great experiences. Design, develop, and deploy — all in one place.
    </p>
    <div class="mt-8 flex gap-3 justify-center">
      <button class="btn-primary btn-lg">Get Started Free</button>
      <button class="btn-secondary btn-lg">View Demo</button>
    </div>
  </section>

  <!-- Stats -->
  <section class="px-8 pb-16">
    <div class="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
      <div class="text-center">
        <div class="text-3xl font-bold" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">12,000+</div>
        <div class="text-sm mt-1" style="color: var(--d-text-muted)">Active Users</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">99.99%</div>
        <div class="text-sm mt-1" style="color: var(--d-text-muted)">Uptime</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">40+</div>
        <div class="text-sm mt-1" style="color: var(--d-text-muted)">Countries</div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="px-8 py-16" style="background: var(--d-surface)">
    <h2 class="text-2xl font-bold text-center mb-10" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Everything you need</h2>
    <div class="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div class="card p-6">
        <div class="mb-3 text-xl" style="color: var(--d-primary)">⚡</div>
        <h3 class="text-base font-semibold mb-2" style="color: var(--d-text-primary)">Lightning Fast</h3>
        <p class="text-sm" style="color: var(--d-text-secondary)">Built for speed with optimized rendering and smart caching.</p>
      </div>
      <div class="card p-6">
        <div class="mb-3 text-xl" style="color: var(--d-primary)">🛡️</div>
        <h3 class="text-base font-semibold mb-2" style="color: var(--d-text-primary)">Fully Secure</h3>
        <p class="text-sm" style="color: var(--d-text-secondary)">Enterprise-grade security with end-to-end encryption.</p>
      </div>
      <div class="card p-6">
        <div class="mb-3 text-xl" style="color: var(--d-primary)">🔗</div>
        <h3 class="text-base font-semibold mb-2" style="color: var(--d-text-primary)">Easy Integration</h3>
        <p class="text-sm" style="color: var(--d-text-secondary)">Connect with your favorite tools in just a few clicks.</p>
      </div>
    </div>
  </section>

  ${reviewsHtml}

  ${faqHtml}

  <!-- CTA -->
  <section class="px-8 py-16 text-center">
    <h2 class="text-2xl font-bold mb-3" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Ready to get started?</h2>
    <p class="text-sm mb-6" style="color: var(--d-text-secondary)">Join thousands of teams already building with us.</p>
    <div class="flex gap-3 justify-center max-w-md mx-auto">
      <input class="input-field flex-1" placeholder="Enter your email">
      <button class="btn-primary btn-md">Subscribe</button>
    </div>
  </section>

  ${buildFooterHtml(r, brandName)}
</div>`;
}

function dashboardHtml(r: ResolvedDesign, brandName: string, _variant: HeaderVariant): string {
  void _variant;
  return `<div class="flex min-h-screen">
  <!-- Sidebar -->
  <aside class="flex flex-col w-56 py-4" style="background: var(--d-surface); border-right: 1px solid var(--d-border)">
    <div class="px-4 pb-4">${buildBrandMarkHtml(r, brandName, { size: 22, nameSize: "0.9375rem" })}</div>
    <div class="flex flex-col gap-0.5 px-2">
      <span class="flex items-center gap-3 px-3 py-2 text-sm font-semibold" style="color: var(--d-primary); background: color-mix(in srgb, var(--d-primary) 10%, transparent); border-radius: var(--d-radius-md)">◫ Dashboard</span>
      <span class="flex items-center gap-3 px-3 py-2 text-sm" style="color: var(--d-text-secondary)">◈ Analytics</span>
      <span class="flex items-center gap-3 px-3 py-2 text-sm" style="color: var(--d-text-secondary)">◉ Customers</span>
      <span class="flex items-center gap-3 px-3 py-2 text-sm" style="color: var(--d-text-secondary)">▦ Products</span>
      <span class="flex items-center gap-3 px-3 py-2 text-sm" style="color: var(--d-text-secondary)">⚙ Settings</span>
    </div>
  </aside>

  <div class="flex-1 flex flex-col">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-6 py-3" style="border-bottom: 1px solid var(--d-border)">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Dashboard</h1>
        <span class="badge badge-success">Live</span>
      </div>
      <div class="flex items-center gap-3">
        <input class="input-field" style="width: 208px" placeholder="Search...">
        <div class="avatar" style="width: 40px; height: 40px">JD</div>
      </div>
    </div>

    <div class="p-6 flex-1">
      <!-- Stats -->
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <div class="text-sm mb-1" style="color: var(--d-text-muted)">Total Revenue</div>
          <div class="text-2xl font-bold mb-1" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">$45,231</div>
          <div class="text-sm" style="color: var(--d-success)">+12.5% from last month</div>
        </div>
        <div class="stat-card">
          <div class="text-sm mb-1" style="color: var(--d-text-muted)">Subscriptions</div>
          <div class="text-2xl font-bold mb-1" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">2,350</div>
          <div class="text-sm" style="color: var(--d-success)">+8.2% from last month</div>
        </div>
        <div class="stat-card">
          <div class="text-sm mb-1" style="color: var(--d-text-muted)">Active Users</div>
          <div class="text-2xl font-bold mb-1" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">12,234</div>
          <div class="text-sm" style="color: var(--d-success)">+3.1% from last month</div>
        </div>
        <div class="stat-card">
          <div class="text-sm mb-1" style="color: var(--d-text-muted)">Churn Rate</div>
          <div class="text-2xl font-bold mb-1" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">2.4%</div>
          <div class="text-sm" style="color: var(--d-error)">-0.5% from last month</div>
        </div>
      </div>

      ${chartsHtml}

      <!-- Tabs -->
      <div class="flex gap-0" style="border-bottom: 1px solid var(--d-border)">
        <span class="px-4 py-2.5 text-sm font-semibold" style="color: var(--d-primary); border-bottom: 2px solid var(--d-primary)">Overview</span>
        <span class="px-4 py-2.5 text-sm" style="color: var(--d-text-muted); border-bottom: 2px solid transparent">Analytics</span>
        <span class="px-4 py-2.5 text-sm" style="color: var(--d-text-muted); border-bottom: 2px solid transparent">Reports</span>
        <span class="px-4 py-2.5 text-sm" style="color: var(--d-text-muted); border-bottom: 2px solid transparent">Exports</span>
      </div>

      <div class="mt-4 flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold" style="color: var(--d-text-primary)">Recent Transactions</h2>
        <div class="flex gap-2">
          <button class="btn-ghost btn-sm">Filter</button>
          <button class="btn-primary btn-sm">Export</button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden" style="border: 1px solid var(--d-border); border-radius: var(--d-radius-lg)">
        <table class="w-full text-sm">
          <thead>
            <tr style="background: var(--d-surface)">
              <th class="px-4 py-3 text-left font-medium" style="color: var(--d-text-muted); border-bottom: 1px solid var(--d-border)">Customer</th>
              <th class="px-4 py-3 text-left font-medium" style="color: var(--d-text-muted); border-bottom: 1px solid var(--d-border)">Status</th>
              <th class="px-4 py-3 text-left font-medium" style="color: var(--d-text-muted); border-bottom: 1px solid var(--d-border)">Amount</th>
              <th class="px-4 py-3 text-left font-medium" style="color: var(--d-text-muted); border-bottom: 1px solid var(--d-border)">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--d-border)"><td class="px-4 py-3" style="color: var(--d-text-primary)">Olivia Martin</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Completed</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">+$1,999.00</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Apr 5, 2025</td></tr>
            <tr style="border-bottom: 1px solid var(--d-border)"><td class="px-4 py-3" style="color: var(--d-text-primary)">Jackson Lee</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Processing</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">+$39.00</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Apr 5, 2025</td></tr>
            <tr style="border-bottom: 1px solid var(--d-border)"><td class="px-4 py-3" style="color: var(--d-text-primary)">Isabella Nguyen</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Completed</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">+$299.00</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Apr 4, 2025</td></tr>
            <tr style="border-bottom: 1px solid var(--d-border)"><td class="px-4 py-3" style="color: var(--d-text-primary)">William Kim</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Failed</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">-$99.00</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Apr 4, 2025</td></tr>
            <tr><td class="px-4 py-3" style="color: var(--d-text-primary)">Sofia Davis</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Completed</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">+$499.00</td><td class="px-4 py-3" style="color: var(--d-text-secondary)">Apr 3, 2025</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>`;
}

function authHtml(r: ResolvedDesign, brandName: string, _variant: HeaderVariant): string {
  void _variant;
  return `<div class="flex items-center justify-center min-h-screen px-4" style="background: var(--d-bg)">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div style="display:flex;justify-content:center;margin-bottom:12px">${buildBrandMarkHtml(r, brandName, { size: 36, showName: false })}</div>
      <div class="text-3xl font-bold mb-2" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Welcome back</div>
      <p class="text-sm" style="color: var(--d-text-muted)">Sign in to your account to continue</p>
    </div>

    <div class="card p-6">
      <div class="flex flex-col gap-4">
        <!-- Social Login -->
        <div class="flex gap-3">
          <button class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium" style="background: var(--d-bg); color: var(--d-text-primary); border: 1px solid var(--d-border); border-radius: var(--d-radius-md)">G Google</button>
          <button class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium" style="background: var(--d-bg); color: var(--d-text-primary); border: 1px solid var(--d-border); border-radius: var(--d-radius-md)">⬡ GitHub</button>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px" style="background: var(--d-border)"></div>
          <span class="text-xs" style="color: var(--d-text-muted)">OR CONTINUE WITH</span>
          <div class="flex-1 h-px" style="background: var(--d-border)"></div>
        </div>

        <!-- Form -->
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium" style="color: var(--d-text-primary)">Email</label>
          <input class="input-field" placeholder="name@example.com" type="email">
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium" style="color: var(--d-text-primary)">Password</label>
          <input class="input-field" placeholder="Enter your password" type="password">
        </div>

        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)">
            <input type="checkbox" style="accent-color: var(--d-primary)"> Remember me
          </label>
          <span class="text-sm cursor-pointer" style="color: var(--d-primary)">Forgot password?</span>
        </div>

        <button class="btn-primary btn-lg w-full">Sign In</button>

        <p class="text-center text-sm" style="color: var(--d-text-muted)">
          Don't have an account? <span class="font-medium cursor-pointer" style="color: var(--d-primary)">Sign up</span>
        </p>
      </div>
    </div>

    <p class="text-center text-xs mt-4" style="color: var(--d-text-muted)">
      By continuing, you agree to our Terms of Service and Privacy Policy.
    </p>
  </div>
</div>`;
}

function pricingHtml(r: ResolvedDesign, brandName: string, variant: HeaderVariant): string {
  return `<div class="flex flex-col min-h-screen">
  ${buildNavHtml(r, brandName, variant)}

  <section class="px-8 py-16 text-center">
    <span class="badge">Pricing</span>
    <h1 class="mt-4 text-4xl font-bold tracking-tight" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Simple, transparent pricing</h1>
    <p class="mt-3 text-base max-w-lg mx-auto" style="color: var(--d-text-secondary)">Choose the plan that fits your needs. Upgrade or downgrade at any time.</p>
  </section>

  <section class="px-8 pb-20">
    <div class="grid grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
      <!-- Starter -->
      <div class="card p-6">
        <div class="text-center mb-6">
          <h3 class="text-lg font-semibold mb-1" style="color: var(--d-text-primary)">Starter</h3>
          <p class="text-sm mb-4" style="color: var(--d-text-muted)">Perfect for trying out</p>
          <div class="flex items-baseline justify-center gap-1">
            <span class="text-4xl font-bold" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">$0</span>
            <span class="text-sm" style="color: var(--d-text-muted)">/month</span>
          </div>
        </div>
        <div class="flex flex-col gap-2.5 mb-6">
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Up to 3 projects</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Basic analytics</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Community support</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> 1 GB storage</div>
        </div>
        <button class="btn-secondary btn-md w-full">Get Started</button>
      </div>

      <!-- Pro -->
      <div class="card p-6 relative ring-2" style="--tw-ring-color: var(--d-primary)">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2"><span class="badge">Most Popular</span></div>
        <div class="text-center mb-6">
          <h3 class="text-lg font-semibold mb-1" style="color: var(--d-text-primary)">Pro</h3>
          <p class="text-sm mb-4" style="color: var(--d-text-muted)">Best for professionals</p>
          <div class="flex items-baseline justify-center gap-1">
            <span class="text-4xl font-bold" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">$29</span>
            <span class="text-sm" style="color: var(--d-text-muted)">/month</span>
          </div>
        </div>
        <div class="flex flex-col gap-2.5 mb-6">
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Unlimited projects</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Advanced analytics</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Priority support</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> 100 GB storage</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Custom domains</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Team collaboration</div>
        </div>
        <button class="btn-primary btn-md w-full">Start Free Trial</button>
      </div>

      <!-- Enterprise -->
      <div class="card p-6">
        <div class="text-center mb-6">
          <h3 class="text-lg font-semibold mb-1" style="color: var(--d-text-primary)">Enterprise</h3>
          <p class="text-sm mb-4" style="color: var(--d-text-muted)">For large organizations</p>
          <div class="flex items-baseline justify-center gap-1">
            <span class="text-4xl font-bold" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">$99</span>
            <span class="text-sm" style="color: var(--d-text-muted)">/month</span>
          </div>
        </div>
        <div class="flex flex-col gap-2.5 mb-6">
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Everything in Pro</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Unlimited storage</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> SSO &amp; SAML</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Dedicated support</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> SLA guarantee</div>
          <div class="flex items-center gap-2 text-sm" style="color: var(--d-text-secondary)"><span style="color: var(--d-success)">✓</span> Custom integrations</div>
        </div>
        <button class="btn-secondary btn-md w-full">Contact Sales</button>
      </div>
    </div>
  </section>

  ${faqHtml}

  ${buildFooterHtml(r, brandName)}
</div>`;
}

function blogHtml(r: ResolvedDesign, brandName: string, variant: HeaderVariant): string {
  return `<div class="flex flex-col min-h-screen">
  ${buildNavHtml(r, brandName, variant)}

  <section class="px-8 py-12">
    <h1 class="text-3xl font-bold mb-2" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Blog</h1>
    <p class="text-base" style="color: var(--d-text-secondary)">Insights, updates, and stories from our team.</p>
  </section>

  <!-- Featured Post -->
  <section class="px-8 pb-8">
    <div class="card p-8 flex gap-8">
      <div class="w-80 h-48 shrink-0" style="background: color-mix(in srgb, var(--d-primary) 10%, var(--d-surface)); border-radius: var(--d-radius-md)"></div>
      <div class="flex flex-col justify-center">
        <div class="flex items-center gap-2 mb-3">
          <span class="badge">Product</span>
          <span class="text-xs" style="color: var(--d-text-muted)">Apr 5, 2025 · 5 min read</span>
        </div>
        <h2 class="text-xl font-bold mb-2" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Introducing Our New Design System</h2>
        <p class="text-sm mb-4 leading-relaxed" style="color: var(--d-text-secondary)">We've rebuilt our design system from the ground up with a focus on consistency, accessibility, and developer experience.</p>
        <div class="flex items-center gap-2">
          <div class="avatar" style="width: 28px; height: 28px; font-size: 0.65rem">SC</div>
          <span class="text-sm" style="color: var(--d-text-secondary)">Sarah Chen</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Post Grid -->
  <section class="px-8 pb-16">
    <div class="grid grid-cols-3 gap-6">
      <div class="card flex flex-col">
        <div class="h-36 w-full" style="background: color-mix(in srgb, var(--d-primary) 8%, var(--d-surface)); border-radius: var(--d-radius-lg) var(--d-radius-lg) 0 0"></div>
        <div class="p-5 flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-2"><span class="badge">Engineering</span><span class="text-xs" style="color: var(--d-text-muted)">8 min read</span></div>
          <h3 class="text-base font-semibold mb-2" style="color: var(--d-text-primary)">Building for Scale: Lessons Learned</h3>
          <p class="text-sm flex-1 mb-4" style="color: var(--d-text-secondary)">How we scaled our infrastructure to handle 10x traffic growth while maintaining sub-100ms response times.</p>
          <div class="flex items-center gap-2">
            <div class="avatar" style="width: 24px; height: 24px; font-size: 0.6rem">JW</div>
            <span class="text-xs" style="color: var(--d-text-muted)">James Wilson · Apr 2, 2025</span>
          </div>
        </div>
      </div>
      <div class="card flex flex-col">
        <div class="h-36 w-full" style="background: color-mix(in srgb, var(--d-primary) 8%, var(--d-surface)); border-radius: var(--d-radius-lg) var(--d-radius-lg) 0 0"></div>
        <div class="p-5 flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-2"><span class="badge">AI</span><span class="text-xs" style="color: var(--d-text-muted)">6 min read</span></div>
          <h3 class="text-base font-semibold mb-2" style="color: var(--d-text-primary)">The Future of AI-Powered Development</h3>
          <p class="text-sm flex-1 mb-4" style="color: var(--d-text-secondary)">Exploring how artificial intelligence is transforming the way we write, review, and deploy code.</p>
          <div class="flex items-center gap-2">
            <div class="avatar" style="width: 24px; height: 24px; font-size: 0.6rem">ML</div>
            <span class="text-xs" style="color: var(--d-text-muted)">Maria Lopez · Mar 28, 2025</span>
          </div>
        </div>
      </div>
      <div class="card flex flex-col">
        <div class="h-36 w-full" style="background: color-mix(in srgb, var(--d-primary) 8%, var(--d-surface)); border-radius: var(--d-radius-lg) var(--d-radius-lg) 0 0"></div>
        <div class="p-5 flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-2"><span class="badge">Security</span><span class="text-xs" style="color: var(--d-text-muted)">10 min read</span></div>
          <h3 class="text-base font-semibold mb-2" style="color: var(--d-text-primary)">A Guide to Modern Authentication</h3>
          <p class="text-sm flex-1 mb-4" style="color: var(--d-text-secondary)">Best practices for implementing secure, user-friendly authentication in your applications.</p>
          <div class="flex items-center gap-2">
            <div class="avatar" style="width: 24px; height: 24px; font-size: 0.6rem">AK</div>
            <span class="text-xs" style="color: var(--d-text-muted)">Alex Kumar · Mar 20, 2025</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Newsletter -->
  <section class="px-8 py-12 text-center" style="background: var(--d-surface)">
    <h2 class="text-xl font-bold mb-2" style="color: var(--d-text-primary); font-family: var(--d-font-heading)">Subscribe to our newsletter</h2>
    <p class="text-sm mb-4" style="color: var(--d-text-muted)">Get the latest articles delivered straight to your inbox.</p>
    <div class="flex gap-2 justify-center max-w-sm mx-auto">
      <input class="input-field flex-1" placeholder="your@email.com">
      <button class="btn-primary btn-md">Subscribe</button>
    </div>
  </section>

  ${contactFormHtml}

  ${buildFooterHtml(r, brandName)}
</div>`;
}

// ── Public API ──

export interface KitPage {
  filename: string;
  title: string;
  html: string;
}

export function generateKitPages(
  designName: string,
  resolved: ResolvedDesign,
  fontSources: FontSource[]
): KitPage[] {
  const brandName = resolved.brandName || designName;
  const variant: HeaderVariant = resolved.headerVariant || "classic";

  type BodyFn = (r: ResolvedDesign, brandName: string, variant: HeaderVariant) => string;
  const pages: Array<{ id: string; title: string; bodyFn: BodyFn }> = [
    { id: "landing", title: "Landing Page", bodyFn: landingHtml },
    { id: "dashboard", title: "Dashboard", bodyFn: dashboardHtml },
    { id: "auth", title: "Auth / Login", bodyFn: authHtml },
    { id: "pricing", title: "Pricing", bodyFn: pricingHtml },
    { id: "blog", title: "Blog", bodyFn: blogHtml },
  ];

  return pages.map((p) => ({
    filename: `${p.id}.html`,
    title: `${designName} — ${p.title}`,
    html: wrap(`${designName} — ${p.title}`, p.bodyFn(resolved, brandName, variant), resolved, fontSources),
  }));
}

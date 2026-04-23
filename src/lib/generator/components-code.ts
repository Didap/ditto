import type { ResolvedDesign } from "../types";

export function generateComponentsCode(resolved: ResolvedDesign): string {
  return `// ══════════════════════════════════════════════════════════
// Ditto Component Kit — Generated from your design tokens
// Drop this file + the CSS variables into any React project
// ══════════════════════════════════════════════════════════

// ── Required: Add these CSS variables to your :root ──
// (Also included in your DESIGN.md)
/*
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
  --font-heading: '${resolved.fontHeading}', system-ui, sans-serif;
  --font-body: '${resolved.fontBody}', system-ui, sans-serif;
  --font-mono: '${resolved.fontMono}', ui-monospace, monospace;
  --radius-sm: ${resolved.radiusSm};
  --radius-md: ${resolved.radiusMd};
  --radius-lg: ${resolved.radiusLg};
  --shadow-sm: ${resolved.shadowSm};
  --shadow-md: ${resolved.shadowMd};
  --shadow-lg: ${resolved.shadowLg};
}
*/

import React from "react";

// ── Button ──

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", children, style, ...props }: ButtonProps) {
  const sizes: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: "6px 12px", fontSize: "0.8125rem" },
    md: { padding: "8px 16px", fontSize: "0.875rem" },
    lg: { padding: "10px 24px", fontSize: "1rem" },
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--color-primary)",
      color: "#fff",
      border: "none",
    },
    secondary: {
      backgroundColor: "transparent",
      color: "var(--color-primary)",
      border: "1px solid var(--color-border)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--color-text-secondary)",
      border: "none",
    },
    danger: {
      backgroundColor: "var(--color-error)",
      color: "#fff",
      border: "none",
    },
  };

  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 500,
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        transition: "opacity 0.15s",
        fontFamily: "var(--font-body)",
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Card ──

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ children, hover, style, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        transition: hover ? "box-shadow 0.2s" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Input ──

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label style={{
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "var(--color-text)",
          fontFamily: "var(--font-body)",
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: "0.875rem",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          outline: "none",
          fontFamily: "var(--font-body)",
          ...style,
        }}
        {...props}
      />
    </div>
  );
}

// ── Badge ──

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const colors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
    default: { bg: "var(--color-primary)", text: "var(--color-primary)", border: "var(--color-primary)" },
    success: { bg: "var(--color-success)", text: "var(--color-success)", border: "var(--color-success)" },
    warning: { bg: "var(--color-warning)", text: "var(--color-warning)", border: "var(--color-warning)" },
    error:   { bg: "var(--color-error)",   text: "var(--color-error)",   border: "var(--color-error)" },
    info:    { bg: "var(--color-primary)", text: "var(--color-primary)", border: "var(--color-primary)" },
  };

  const c = colors[variant];

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 8px",
      fontSize: "0.75rem",
      fontWeight: 500,
      borderRadius: "var(--radius-sm)",
      // Use color-mix for transparency (works in modern browsers)
      backgroundColor: \`color-mix(in srgb, \${c.bg} 15%, transparent)\`,
      color: c.text,
      border: \`1px solid color-mix(in srgb, \${c.border} 30%, transparent)\`,
    }}>
      {children}
    </span>
  );
}

// ── Table ──

interface TableProps {
  headers: string[];
  rows: string[][];
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div style={{
      overflow: "hidden",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
    }}>
      <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--color-surface)" }}>
            {headers.map((h) => (
              <th key={h} style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: 500,
                color: "var(--color-text-muted)",
                borderBottom: "1px solid var(--color-border)",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{
              borderBottom: i < rows.length - 1 ? "1px solid var(--color-border)" : undefined,
            }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: "12px 16px",
                  color: j === 0 ? "var(--color-text)" : "var(--color-text-secondary)",
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Avatar ──

interface AvatarProps {
  name?: string;
  size?: number;
}

export function Avatar({ name = "JD", size = 40 }: AvatarProps) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "9999px",
      backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)",
      color: "var(--color-primary)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 500,
      fontSize: size * 0.35,
      fontFamily: "var(--font-body)",
    }}>
      {name}
    </div>
  );
}

// ── Toggle ──

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Toggle({ checked = false, onChange }: ToggleProps) {
  return (
    <div
      onClick={() => onChange?.(!checked)}
      style={{
        position: "relative",
        display: "inline-flex",
        width: 44,
        height: 24,
        borderRadius: 9999,
        backgroundColor: checked ? "var(--color-primary)" : "var(--color-border)",
        cursor: "pointer",
        transition: "background-color 0.2s",
      }}
    >
      <span style={{
        position: "absolute",
        top: 2,
        left: checked ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: 9999,
        backgroundColor: "#fff",
        boxShadow: "var(--shadow-sm)",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

// ── Tabs ──

interface TabsProps {
  items: string[];
  active?: number;
  onChange?: (index: number) => void;
}

export function Tabs({ items, active = 0, onChange }: TabsProps) {
  return (
    <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
      {items.map((item, i) => (
        <span
          key={item}
          onClick={() => onChange?.(i)}
          style={{
            padding: "10px 16px",
            fontSize: "0.875rem",
            cursor: "pointer",
            color: i === active ? "var(--color-primary)" : "var(--color-text-muted)",
            borderBottom: i === active ? "2px solid var(--color-primary)" : "2px solid transparent",
            fontWeight: i === active ? 600 : 400,
            transition: "color 0.15s",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ── TextArea ──

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, style, ...props }: TextAreaProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text)" }}>
          {label}
        </label>
      )}
      <textarea
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: "0.875rem",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          outline: "none",
          resize: "vertical",
          minHeight: 100,
          fontFamily: "var(--font-body)",
          ...style,
        }}
        {...props}
      />
    </div>
  );
}

// ── Select ──

interface SelectProps {
  label?: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}

export function Select({ label, options, value, onChange }: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text)" }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: "0.875rem",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          outline: "none",
          appearance: "none",
          cursor: "pointer",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// ── StatCard ──

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export function StatCard({ label, value, change, positive = true }: StatCardProps) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: "1.5rem",
        fontWeight: 700,
        color: "var(--color-text)",
        fontFamily: "var(--font-heading)",
        marginBottom: 4,
      }}>
        {value}
      </div>
      {change && (
        <div style={{
          fontSize: "0.8125rem",
          color: positive ? "var(--color-success)" : "var(--color-error)",
        }}>
          {change} from last month
        </div>
      )}
    </Card>
  );
}

// ── Brand ──

export type HeaderVariant = "classic" | "elegante" | "artistico" | "fresco";

export const brandConfig: {
  name: string;
  logoUrl: string | null;
  headerVariant: HeaderVariant;
} = {
  name: ${JSON.stringify(resolved.brandName || "Brand")},
  logoUrl: ${resolved.logoUrl ? JSON.stringify(resolved.logoUrl) : "null"},
  headerVariant: ${JSON.stringify(resolved.headerVariant || "classic")},
};

export function LogoPlaceholder({ size = 28, title = brandConfig.name }: { size?: number; title?: string }) {
  return (
    <svg role="img" aria-label={title} width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <path d="M16 0 A16 16 0 0 1 16 32 Z" fill="var(--color-primary)" />
      <path d="M16 0 A16 16 0 0 0 16 32 Z" fill="var(--color-secondary)" />
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
        <img
          src={logoUrl}
          alt={name}
          style={{ height: size, width: "auto", maxWidth: size * 3, objectFit: "contain", display: "block" }}
        />
      ) : (
        <LogoPlaceholder size={size} title={name} />
      )}
      {showName && (
        <span style={{
          color: "var(--color-text)",
          fontFamily: "var(--font-heading)",
          fontWeight: nameWeight,
          fontSize: nameSize,
          letterSpacing: "-0.01em",
        }}>
          {name}
        </span>
      )}
    </span>
  );
}

// ── Nav (4 variants, picked by brandConfig.headerVariant or \`variant\` prop) ──

interface NavProps {
  links?: string[];
  cta?: string;
  variant?: HeaderVariant;
}

const DEFAULT_LINKS = ["Home", "Features", "Pricing", "Blog"];

function NavClassic({ links = DEFAULT_LINKS, cta = "Get Started" }: NavProps) {
  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 24px",
      backgroundColor: "var(--color-bg)",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <BrandMark />
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {links.map((link) => (
          <span key={link} style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", cursor: "pointer" }}>
            {link}
          </span>
        ))}
        <Button size="sm">{cta}</Button>
      </div>
    </nav>
  );
}

function NavElegante({ links = DEFAULT_LINKS, cta = "Get Started" }: NavProps) {
  return (
    <nav style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 24px 0", backgroundColor: "var(--color-bg)" }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ width: 96 }} />
        <BrandMark size={32} nameSize="1.25rem" nameWeight={500} />
        <div style={{ width: 96, display: "flex", justifyContent: "flex-end" }}>
          <button style={{
            fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer",
          }}>
            {cta}
          </button>
        </div>
      </div>
      <div style={{ width: "100%", height: 1, backgroundColor: "var(--color-border)" }} />
      <div style={{ display: "flex", justifyContent: "center", gap: 40, padding: "12px 0" }}>
        {links.map((link) => (
          <span key={link} style={{
            fontSize: "0.75rem", letterSpacing: "0.22em", textTransform: "uppercase",
            color: "var(--color-text-secondary)", cursor: "pointer",
          }}>
            {link}
          </span>
        ))}
      </div>
      <div style={{ width: "100%", height: 1, backgroundColor: "var(--color-border)" }} />
    </nav>
  );
}

function NavArtistico({ links = DEFAULT_LINKS, cta = "Get Started" }: NavProps) {
  return (
    <nav style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", backgroundColor: "var(--color-bg)" }}>
      <div style={{ position: "relative" }}>
        <span aria-hidden style={{
          position: "absolute", left: -8, top: -8, width: 40, height: 40, borderRadius: "50%",
          backgroundColor: "var(--color-accent)", opacity: 0.25, filter: "blur(2px)",
        }} />
        <span style={{ position: "relative" }}>
          <BrandMark size={32} nameSize="1.125rem" nameWeight={800} />
        </span>
      </div>
      <div style={{
        position: "absolute", left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 4, padding: "6px 8px",
        backgroundColor: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)",
        boxShadow: "var(--shadow-sm)",
      }}>
        {links.map((link, i) => (
          <span key={link} style={{
            padding: "4px 12px", fontSize: "0.8125rem", cursor: "pointer",
            color: i === 0 ? "var(--color-text)" : "var(--color-text-secondary)",
            backgroundColor: i === 0 ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "transparent",
            borderRadius: "var(--radius-full)", fontWeight: i === 0 ? 600 : 400,
          }}>
            {link}
          </span>
        ))}
      </div>
      <button style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "8px 20px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
        color: "var(--color-text)", backgroundColor: "transparent",
        border: "2px solid var(--color-text)", borderRadius: "var(--radius-full)",
      }}>
        {cta}
        <span aria-hidden style={{ color: "var(--color-accent)" }}>✦</span>
      </button>
    </nav>
  );
}

function NavFresco({ links = DEFAULT_LINKS, cta = "Start free" }: NavProps) {
  const dots = ["●", "◆", "■", "▲", "★", "◉"];
  return (
    <nav style={{ padding: "16px 16px 0", backgroundColor: "var(--color-bg)" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)",
        boxShadow: "var(--shadow-sm)",
      }}>
        <BrandMark size={26} nameSize="0.9375rem" nameWeight={700} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {links.map((link, i) => (
            <span key={link} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", fontSize: "0.8125rem", cursor: "pointer",
              color: "var(--color-text-secondary)", borderRadius: "var(--radius-full)",
            }}>
              <span aria-hidden style={{ fontSize: "0.625rem", color: "var(--color-primary)" }}>
                {dots[i % dots.length]}
              </span>
              {link}
            </span>
          ))}
        </div>
        <button style={{
          display: "inline-flex", alignItems: "center",
          padding: "6px 16px", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
          color: "#fff",
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
          borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-sm)",
          border: "none",
        }}>
          {cta}
        </button>
      </div>
    </nav>
  );
}

export function Nav({ links, cta, variant }: NavProps) {
  const v = variant || brandConfig.headerVariant;
  switch (v) {
    case "elegante":
      return <NavElegante links={links} cta={cta} />;
    case "artistico":
      return <NavArtistico links={links} cta={cta} />;
    case "fresco":
      return <NavFresco links={links} cta={cta} />;
    case "classic":
    default:
      return <NavClassic links={links} cta={cta} />;
  }
}

// ── Landing sections (Hero / Features / Stats / Reviews / CTA) ──
// Each section has 4 variants. brandConfig holds the per-section pick; the
// wrapper component (\`<Hero/>\`, \`<Features/>\`, ...) picks the right variant
// at render time.

export const landingConfig: {
  heroVariant: HeaderVariant;
  featuresVariant: HeaderVariant;
  statsVariant: HeaderVariant;
  reviewsVariant: HeaderVariant;
  ctaVariant: HeaderVariant;
  footerVariant: HeaderVariant;
} = {
  heroVariant: ${JSON.stringify(resolved.heroVariant || "classic")},
  featuresVariant: ${JSON.stringify(resolved.featuresVariant || "classic")},
  statsVariant: ${JSON.stringify(resolved.statsVariant || "classic")},
  reviewsVariant: ${JSON.stringify(resolved.reviewsVariant || "classic")},
  ctaVariant: ${JSON.stringify(resolved.ctaVariant || "classic")},
  footerVariant: ${JSON.stringify(resolved.footerVariant || "classic")},
};

// ── Hero ──

interface HeroProps { title?: string; subtitle?: string; cta?: string; secondaryCta?: string; badge?: string; variant?: HeaderVariant }

function HeroClassic({ title = "Build beautiful products faster than ever", subtitle = "The modern platform for teams who want to ship great experiences.", cta = "Get Started Free", secondaryCta = "View Demo", badge = "New Release v2.0" }: HeroProps) {
  return (
    <section style={{ padding: "80px 32px", textAlign: "center" }}>
      <Badge>{badge}</Badge>
      <h1 style={{ marginTop: 16, fontSize: "2.5rem", lineHeight: 1.15, letterSpacing: "-0.01em", color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 700 }}>{title}</h1>
      <p style={{ marginTop: 16, fontSize: "1.125rem", maxWidth: "36rem", margin: "16px auto 0", color: "var(--color-text-secondary)" }}>{subtitle}</p>
      <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
        <Button size="lg">{cta}</Button>
        <Button size="lg" variant="secondary">{secondaryCta}</Button>
      </div>
    </section>
  );
}

function HeroElegante({ title = "Build beautiful products faster than ever", subtitle = "The modern platform for teams who want to ship great experiences.", cta = "Begin the journey", badge = "New Collection" }: HeroProps) {
  return (
    <section style={{ padding: "96px 32px", textAlign: "center", background: "var(--color-bg)" }}>
      <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
        <div style={{ marginBottom: 32, fontSize: "0.6875rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>— {badge} —</div>
        <h1 style={{ fontSize: "3.5rem", lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 400 }}>{title}</h1>
        <div style={{ margin: "40px auto", height: 1, width: 96, background: "var(--color-text-muted)" }} />
        <p style={{ fontSize: "1rem", maxWidth: "32rem", margin: "0 auto", lineHeight: 1.7, color: "var(--color-text-secondary)" }}>{subtitle}</p>
        <button style={{ marginTop: 40, display: "inline-flex", alignItems: "center", gap: 12, padding: "12px 32px", fontSize: "0.75rem", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer", color: "var(--color-text)", background: "transparent", border: "1px solid var(--color-text)", borderRadius: 0 }}>{cta} <span>→</span></button>
      </div>
    </section>
  );
}

function HeroArtistico({ title = "Build beautiful products faster than ever", subtitle = "The modern platform for teams who want to ship great experiences.", cta = "Get Started", secondaryCta = "View Demo", badge = "✦ New Release" }: HeroProps) {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "80px 32px" }}>
      <div aria-hidden style={{ position: "absolute", top: -48, right: -48, width: 288, height: 288, borderRadius: "50%", background: "var(--color-accent)", opacity: 0.18, filter: "blur(40px)" }} />
      <div aria-hidden style={{ position: "absolute", top: 128, right: 96, width: 128, height: 128, borderRadius: "50%", background: "var(--color-primary)", opacity: 0.35 }} />
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 40, alignItems: "center", maxWidth: "72rem", margin: "0 auto" }}>
        <div>
          <span style={{ display: "inline-block", padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, transform: "rotate(-2deg)", background: "var(--color-accent)", color: "var(--color-text)", borderRadius: "var(--radius-sm)" }}>{badge}</span>
          <h1 style={{ marginTop: 24, fontSize: "3.25rem", lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 800 }}>{title}</h1>
          <p style={{ marginTop: 20, fontSize: "1.125rem", maxWidth: "32rem", color: "var(--color-text-secondary)" }}>{subtitle}</p>
          <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer", background: "var(--color-text)", color: "var(--color-bg)", borderRadius: "var(--radius-full)", border: "none" }}>{cta} <span style={{ color: "var(--color-accent)" }}>✦</span></button>
            <button style={{ display: "inline-flex", alignItems: "center", padding: "12px 24px", fontSize: "0.9375rem", fontWeight: 500, cursor: "pointer", background: "transparent", color: "var(--color-text)", border: "2px solid var(--color-text)", borderRadius: "var(--radius-full)" }}>{secondaryCta}</button>
          </div>
        </div>
        <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div style={{ position: "absolute", inset: 24, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)", opacity: 0.9 }} />
          <div style={{ position: "absolute", bottom: 40, right: 40, width: 64, height: 64, borderRadius: "50%", background: "var(--color-accent)" }} />
        </div>
      </div>
    </section>
  );
}

function HeroFresco({ title = "Build beautiful products faster than ever", subtitle = "The modern platform for teams who want to ship great experiences.", cta = "Start free", secondaryCta = "See how", badge = "🎉 Now live" }: HeroProps) {
  return (
    <section style={{ padding: "48px 24px" }}>
      <div style={{ position: "relative", margin: "0 auto", maxWidth: "64rem", overflow: "hidden", textAlign: "center", background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-secondary) 12%, var(--color-surface)) 100%)", borderRadius: "var(--radius-lg)", padding: "64px 32px", border: "1px solid var(--color-border)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, background: "var(--color-bg)", color: "var(--color-text)", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)" }}>{badge}</span>
        <h1 style={{ marginTop: 20, fontSize: "2.75rem", lineHeight: 1.08, letterSpacing: "-0.01em", fontFamily: "var(--font-heading)", fontWeight: 800, backgroundImage: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" }}>{title}</h1>
        <p style={{ marginTop: 16, fontSize: "1rem", maxWidth: "32rem", margin: "16px auto 0", color: "var(--color-text-secondary)" }}>{subtitle}</p>
        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer", color: "#fff", background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)", borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-md)", border: "none" }}>{cta} <span>→</span></button>
          <button style={{ display: "inline-flex", alignItems: "center", padding: "10px 24px", fontSize: "0.9375rem", fontWeight: 500, cursor: "pointer", background: "var(--color-bg)", color: "var(--color-text)", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)" }}>{secondaryCta}</button>
        </div>
      </div>
    </section>
  );
}

export function Hero({ variant, ...props }: HeroProps = {}) {
  const v = variant || landingConfig.heroVariant;
  switch (v) {
    case "elegante": return <HeroElegante {...props} />;
    case "artistico": return <HeroArtistico {...props} />;
    case "fresco": return <HeroFresco {...props} />;
    case "classic":
    default: return <HeroClassic {...props} />;
  }
}

// ── Features ──

interface FeatureItem { icon: string; title: string; desc: string }
interface FeaturesProps { title?: string; items?: FeatureItem[]; variant?: HeaderVariant }
const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: "⚡", title: "Lightning Fast", desc: "Built for speed with optimized rendering and smart caching." },
  { icon: "🛡️", title: "Fully Secure", desc: "Enterprise-grade security with end-to-end encryption." },
  { icon: "🔗", title: "Easy Integration", desc: "Connect with your favorite tools in just a few clicks." },
];

function FeaturesClassic({ title = "Everything you need", items = DEFAULT_FEATURES }: FeaturesProps) {
  return (
    <section style={{ padding: "64px 32px", background: "var(--color-surface)" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", marginBottom: 40, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, maxWidth: "56rem", margin: "0 auto" }}>
        {items.map((f) => (
          <Card key={f.title} style={{ padding: 24 }}>
            <div style={{ marginBottom: 12, fontSize: "1.5rem", color: "var(--color-primary)" }}>{f.icon}</div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 8, color: "var(--color-text)" }}>{f.title}</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{f.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FeaturesElegante({ title = "What sets us apart", items = DEFAULT_FEATURES }: FeaturesProps) {
  return (
    <section style={{ padding: "80px 32px", background: "var(--color-bg)" }}>
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: "0.6875rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 12 }}>— Features —</div>
          <h2 style={{ fontSize: "1.875rem", letterSpacing: "-0.01em", color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 400 }}>{title}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          {items.map((f, i) => (
            <div key={f.title} style={{ padding: "8px 32px", borderRight: i < items.length - 1 ? "1px solid var(--color-border)" : undefined }}>
              <div style={{ fontSize: "2rem", letterSpacing: "-0.01em", marginBottom: 16, fontFamily: "var(--font-heading)", fontWeight: 300, color: "var(--color-text-muted)" }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ fontSize: "0.6875rem", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 12, color: "var(--color-text-muted)" }}>{f.title}</div>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesArtistico({ title = "Everything you need", items = DEFAULT_FEATURES }: FeaturesProps) {
  const tints = ["var(--color-primary)", "var(--color-secondary)", "var(--color-accent)"];
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "80px 32px" }}>
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        <h2 style={{ fontSize: "2.25rem", letterSpacing: "-0.02em", marginBottom: 48, textAlign: "center", color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 800 }}>{title}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
          {items.map((f, i) => (
            <div key={f.title} style={{ position: "relative", padding: 24, transform: i === 1 ? "rotate(1deg)" : "rotate(-1deg)", background: "var(--color-surface)", border: "2px solid var(--color-text)", borderRadius: "var(--radius-lg)" }}>
              <div aria-hidden style={{ position: "absolute", top: -12, left: -12, width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: tints[i % 3], fontSize: "1.25rem" }}>{f.icon}</div>
              <h3 style={{ marginTop: 24, fontSize: "1.125rem", marginBottom: 8, color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 700 }}>{f.title}</h3>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesFresco({ title = "Everything you need", items = DEFAULT_FEATURES }: FeaturesProps) {
  return (
    <section style={{ padding: "64px 24px", background: "var(--color-bg)" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, textAlign: "center", marginBottom: 32, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: "56rem", margin: "0 auto" }}>
        {items.map((f) => (
          <div key={f.title} style={{ position: "relative", padding: 20, background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
            <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))", borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }} />
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, marginBottom: 12, borderRadius: "var(--radius-full)", background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), color-mix(in srgb, var(--color-secondary) 15%, transparent))", fontSize: "1.125rem" }}>{f.icon}</div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 6, color: "var(--color-text)" }}>{f.title}</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Features({ variant, ...props }: FeaturesProps = {}) {
  const v = variant || landingConfig.featuresVariant;
  switch (v) {
    case "elegante": return <FeaturesElegante {...props} />;
    case "artistico": return <FeaturesArtistico {...props} />;
    case "fresco": return <FeaturesFresco {...props} />;
    case "classic":
    default: return <FeaturesClassic {...props} />;
  }
}

// ── Stats ──

interface StatItem { label: string; value: string }
interface StatsProps { items?: StatItem[]; variant?: HeaderVariant }
const DEFAULT_STATS: StatItem[] = [
  { label: "Active Users", value: "12,000+" },
  { label: "Uptime", value: "99.99%" },
  { label: "Countries", value: "40+" },
];

function StatsClassic({ items = DEFAULT_STATS }: StatsProps) {
  return (
    <section style={{ padding: "0 32px 64px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, maxWidth: "48rem", margin: "0 auto" }}>
        {items.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.875rem", fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{s.value}</div>
            <div style={{ fontSize: "0.875rem", marginTop: 4, color: "var(--color-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsElegante({ items = DEFAULT_STATS }: StatsProps) {
  return (
    <section style={{ padding: "64px 32px", background: "var(--color-bg)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", maxWidth: "56rem", margin: "0 auto" }}>
        {items.map((s, i) => (
          <div key={s.label} style={{ textAlign: "center", padding: "0 24px", borderRight: i < items.length - 1 ? "1px solid var(--color-border)" : undefined }}>
            <div style={{ fontSize: "3rem", letterSpacing: "-0.01em", color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 300 }}>{s.value}</div>
            <div style={{ marginTop: 12, fontSize: "0.6875rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsArtistico({ items = DEFAULT_STATS }: StatsProps) {
  const tints = ["var(--color-primary)", "var(--color-secondary)", "var(--color-accent)"];
  return (
    <section style={{ position: "relative", padding: "16px 32px 64px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: "56rem", margin: "0 auto" }}>
        {items.map((s, i) => (
          <div key={s.label} style={{ position: "relative", padding: 24, background: "var(--color-surface)", border: "2px solid var(--color-text)", borderRadius: "var(--radius-lg)", transform: i === 1 ? "translateY(-12px)" : i === 2 ? "translateY(4px)" : "none" }}>
            <div aria-hidden style={{ position: "absolute", top: -12, right: -12, width: 40, height: 40, borderRadius: "50%", background: tints[i % 3] }} />
            <div style={{ position: "relative", fontSize: "2.25rem", lineHeight: 1, letterSpacing: "-0.02em", color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 800 }}>{s.value}</div>
            <div style={{ position: "relative", marginTop: 8, fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsFresco({ items = DEFAULT_STATS }: StatsProps) {
  return (
    <section style={{ padding: "8px 24px 48px" }}>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", maxWidth: "56rem", margin: "0 auto" }}>
        {items.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "12px 20px", background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-secondary) 10%, var(--color-surface)) 100%)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-sm)" }}>
            <span style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{s.value}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Stats({ variant, ...props }: StatsProps = {}) {
  const v = variant || landingConfig.statsVariant;
  switch (v) {
    case "elegante": return <StatsElegante {...props} />;
    case "artistico": return <StatsArtistico {...props} />;
    case "fresco": return <StatsFresco {...props} />;
    case "classic":
    default: return <StatsClassic {...props} />;
  }
}

// ── Reviews ──

interface ReviewItem { name: string; role: string; initials: string; text: string; rating: number }
interface ReviewsProps { items?: ReviewItem[]; title?: string; variant?: HeaderVariant }
const DEFAULT_REVIEWS: ReviewItem[] = [
  { name: "Sarah Chen", role: "Product Designer", initials: "SC", text: "This tool has completely changed how we approach design systems.", rating: 5 },
  { name: "James Wilson", role: "Frontend Lead", initials: "JW", text: "We've tried many design tools but nothing comes close to this one.", rating: 5 },
  { name: "Maria Lopez", role: "CTO at StartupXYZ", initials: "ML", text: "The ability to blend multiple design inspirations is a game changer.", rating: 4 },
];

function ReviewsClassic({ items = DEFAULT_REVIEWS, title = "What Our Users Say" }: ReviewsProps) {
  return (
    <section style={{ padding: "64px 32px" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 32, textAlign: "center", color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: "64rem", margin: "0 auto" }}>
        {items.map((r) => (
          <div key={r.name} style={{ padding: 20, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ marginBottom: 12, fontSize: "0.875rem" }}>{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: i < r.rating ? "var(--color-warning)" : "var(--color-border)" }}>★</span>)}</div>
            <p style={{ fontSize: "0.875rem", marginBottom: 16, lineHeight: 1.6, color: "var(--color-text-secondary)" }}>&ldquo;{r.text}&rdquo;</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={r.initials} size={32} />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-text)" }}>{r.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{r.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsElegante({ items = DEFAULT_REVIEWS }: ReviewsProps) {
  const top = items[0];
  return (
    <section style={{ padding: "96px 32px", background: "var(--color-bg)" }}>
      <div style={{ maxWidth: "48rem", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "0.6875rem", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24, color: "var(--color-text-muted)" }}>— Testimonial —</div>
        <div style={{ fontSize: "5rem", lineHeight: 1, marginBottom: 16, color: "var(--color-text-muted)", fontFamily: "var(--font-heading)", fontWeight: 300 }}>&ldquo;</div>
        <p style={{ fontSize: "1.5rem", lineHeight: 1.5, color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 400 }}>{top.text}</p>
        <div style={{ margin: "40px auto", height: 1, width: 64, background: "var(--color-text-muted)" }} />
        <div style={{ fontSize: "0.8125rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>{top.name} · {top.role}</div>
      </div>
    </section>
  );
}

function ReviewsArtistico({ items = DEFAULT_REVIEWS, title = "What Our Users Say" }: ReviewsProps) {
  const tints = ["var(--color-primary)", "var(--color-secondary)", "var(--color-accent)"];
  return (
    <section style={{ position: "relative", padding: "80px 32px", overflow: "hidden" }}>
      <h2 style={{ fontSize: "2.25rem", letterSpacing: "-0.02em", marginBottom: 48, textAlign: "center", color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 800 }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, maxWidth: "64rem", margin: "0 auto" }}>
        {items.map((r, i) => (
          <div key={r.name} style={{ position: "relative", padding: 24, transform: i === 1 ? "translateY(32px)" : i === 2 ? "translateY(-12px)" : "none", background: "var(--color-surface)", border: "2px solid var(--color-text)", borderRadius: "var(--radius-lg)" }}>
            <div aria-hidden style={{ position: "absolute", top: -16, left: -8, fontSize: "3rem", lineHeight: 1, color: tints[i % 3], fontFamily: "var(--font-heading)", fontWeight: 900 }}>&ldquo;</div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 20, color: "var(--color-text-secondary)" }}>{r.text}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, fontSize: "0.75rem", fontWeight: 700, background: tints[i % 3], color: "var(--color-bg)", borderRadius: "var(--radius-full)" }}>{r.initials}</div>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text)" }}>{r.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{r.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsFresco({ items = DEFAULT_REVIEWS, title = "Loved by teams" }: ReviewsProps) {
  return (
    <section style={{ padding: "64px 24px", background: "var(--color-surface)" }}>
      <h2 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 32, textAlign: "center", color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: "64rem", margin: "0 auto" }}>
        {items.map((r) => (
          <div key={r.name} style={{ position: "relative", padding: 20, background: "var(--color-bg)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ marginBottom: 12, fontSize: "0.875rem" }}>{Array.from({ length: r.rating }).map((_, i) => <span key={i} style={{ color: "var(--color-warning)" }}>★</span>)}</div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: 16, color: "var(--color-text-secondary)" }}>{r.text}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, fontSize: "0.75rem", fontWeight: 700, background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "#fff", borderRadius: "var(--radius-full)" }}>{r.initials}</div>
              <div>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}>{r.name}</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{r.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Reviews({ variant, ...props }: ReviewsProps = {}) {
  const v = variant || landingConfig.reviewsVariant;
  switch (v) {
    case "elegante": return <ReviewsElegante {...props} />;
    case "artistico": return <ReviewsArtistico {...props} />;
    case "fresco": return <ReviewsFresco {...props} />;
    case "classic":
    default: return <ReviewsClassic {...props} />;
  }
}

// ── CTA ──

interface CTAProps { title?: string; subtitle?: string; cta?: string; placeholder?: string; variant?: HeaderVariant }

function CTAClassic({ title = "Ready to get started?", subtitle = "Join thousands of teams already building with us.", cta = "Subscribe", placeholder = "Enter your email" }: CTAProps) {
  return (
    <section style={{ padding: "64px 32px", textAlign: "center" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>
      <p style={{ fontSize: "0.875rem", marginBottom: 24, color: "var(--color-text-secondary)" }}>{subtitle}</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", maxWidth: "28rem", margin: "0 auto" }}>
        <div style={{ flex: 1 }}><Input placeholder={placeholder} /></div>
        <Button>{cta}</Button>
      </div>
    </section>
  );
}

function CTAElegante({ title = "Begin the journey", subtitle = "Join a community of makers shipping remarkable work.", cta = "Subscribe", placeholder = "your@email.com" }: CTAProps) {
  return (
    <section style={{ padding: "96px 32px", textAlign: "center", background: "var(--color-bg)" }}>
      <div style={{ maxWidth: "36rem", margin: "0 auto" }}>
        <div style={{ fontSize: "0.6875rem", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24, color: "var(--color-text-muted)" }}>— Join us —</div>
        <h2 style={{ fontSize: "2.5rem", lineHeight: 1.15, letterSpacing: "-0.01em", color: "var(--color-text)", fontFamily: "var(--font-heading)", fontWeight: 400 }}>{title}</h2>
        <p style={{ marginTop: 24, fontSize: "1rem", color: "var(--color-text-secondary)" }}>{subtitle}</p>
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, paddingBottom: 8, borderBottom: "1px solid var(--color-text)" }}>
          <input type="email" placeholder={placeholder} style={{ flex: 1, background: "transparent", outline: "none", fontSize: "0.875rem", padding: "4px 0", color: "var(--color-text)", border: "none" }} />
          <button style={{ fontSize: "0.75rem", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer", color: "var(--color-text)", background: "none", border: "none" }}>{cta} →</button>
        </div>
      </div>
    </section>
  );
}

function CTAArtistico({ title = "Ready to get started?", subtitle = "Join thousands of teams already building with us.", cta = "Get Started" }: CTAProps) {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "80px 32px", textAlign: "center", background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)" }}>
      <div aria-hidden style={{ position: "absolute", top: -80, left: -80, width: 320, height: 320, borderRadius: "50%", background: "var(--color-accent)", opacity: 0.25, filter: "blur(60px)" }} />
      <div style={{ position: "relative", maxWidth: "42rem", margin: "0 auto" }}>
        <h2 style={{ fontSize: "2.75rem", lineHeight: 1.05, letterSpacing: "-0.02em", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 800 }}>{title}</h2>
        <p style={{ marginTop: 20, fontSize: "1.125rem", color: "#fff", opacity: 0.9 }}>{subtitle}</p>
        <button style={{ marginTop: 40, display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", background: "var(--color-text)", color: "var(--color-bg)", borderRadius: "var(--radius-full)", border: "none" }}>{cta} <span style={{ color: "var(--color-accent)" }}>✦</span></button>
      </div>
    </section>
  );
}

function CTAFresco({ title = "Start free today 🚀", subtitle = "No credit card, no tricks. Just free forever.", cta = "Start free", placeholder = "Enter your email" }: CTAProps) {
  return (
    <section style={{ padding: "48px 24px" }}>
      <div style={{ position: "relative", margin: "0 auto", maxWidth: "48rem", padding: "48px 32px", textAlign: "center", overflow: "hidden", background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}>
        <h2 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#fff", fontFamily: "var(--font-heading)" }}>{title}</h2>
        <p style={{ marginTop: 8, fontSize: "0.875rem", color: "#fff", opacity: 0.9 }}>{subtitle}</p>
        <div style={{ margin: "24px auto 0", maxWidth: "28rem", display: "flex", alignItems: "center", gap: 8, padding: 6, background: "var(--color-bg)", borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-md)" }}>
          <input type="email" placeholder={placeholder} style={{ flex: 1, background: "transparent", outline: "none", padding: "0 12px", fontSize: "0.875rem", color: "var(--color-text)", border: "none" }} />
          <button style={{ padding: "6px 16px", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", color: "#fff", background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)", borderRadius: "var(--radius-full)", border: "none" }}>{cta}</button>
        </div>
      </div>
    </section>
  );
}

export function CTA({ variant, ...props }: CTAProps = {}) {
  const v = variant || landingConfig.ctaVariant;
  switch (v) {
    case "elegante": return <CTAElegante {...props} />;
    case "artistico": return <CTAArtistico {...props} />;
    case "fresco": return <CTAFresco {...props} />;
    case "classic":
    default: return <CTAClassic {...props} />;
  }
}

// ── Sidebar ──

interface SidebarItem {
  label: string;
  icon?: string;
  active?: boolean;
}

interface SidebarProps {
  items?: SidebarItem[];
}

export function Sidebar({
  items = [
    { label: "Dashboard", icon: "◫", active: true },
    { label: "Analytics", icon: "◈" },
    { label: "Customers", icon: "◉" },
    { label: "Settings", icon: "⚙" },
  ],
}: SidebarProps) {
  return (
    <aside style={{
      width: 224,
      backgroundColor: "var(--color-surface)",
      borderRight: "1px solid var(--color-border)",
      padding: "16px 0",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ padding: "0 16px 16px" }}>
        <BrandMark size={22} nameSize="0.9375rem" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
        {items.map((item) => (
          <span key={item.label} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            cursor: "pointer",
            color: item.active ? "var(--color-primary)" : "var(--color-text-secondary)",
            backgroundColor: item.active ? "color-mix(in srgb, var(--color-primary) 10%, transparent)" : "transparent",
            fontWeight: item.active ? 600 : 400,
          }}>
            {item.icon && <span>{item.icon}</span>}
            {item.label}
          </span>
        ))}
      </div>
    </aside>
  );
}

// ── Footer ──

interface FooterProps {
  sections?: Array<{ title: string; links: string[] }>;
}

export function Footer({
  sections = [
    { title: "Product", links: ["Features", "Pricing", "Docs"] },
    { title: "Company", links: ["About", "Blog", "Careers"] },
    { title: "Legal", links: ["Privacy", "Terms", "License"] },
  ],
}: FooterProps) {
  return (
    <footer style={{
      backgroundColor: "var(--color-surface)",
      borderTop: "1px solid var(--color-border)",
      padding: "32px 24px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ marginBottom: 8 }}>
            <BrandMark size={20} nameSize="0.9375rem" />
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Building the future, one pixel at a time.
          </div>
        </div>
        <div style={{ display: "flex", gap: 48 }}>
          {sections.map((section) => (
            <div key={section.title}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)", marginBottom: 12 }}>
                {section.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {section.links.map((link) => (
                  <span key={link} style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", cursor: "pointer" }}>
                    {link}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
`;
}

export function generateCssVariables(resolved: ResolvedDesign): string {
  return `:root {
  /* Colors */
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

  /* Typography */
  --font-heading: '${resolved.fontHeading}', system-ui, sans-serif;
  --font-body: '${resolved.fontBody}', system-ui, sans-serif;
  --font-mono: '${resolved.fontMono}', ui-monospace, monospace;
  --font-weight-heading: ${resolved.fontWeightHeading};
  --font-weight-body: ${resolved.fontWeightBody};

  /* Radius */
  --radius-sm: ${resolved.radiusSm};
  --radius-md: ${resolved.radiusMd};
  --radius-lg: ${resolved.radiusLg};
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: ${resolved.shadowSm};
  --shadow-md: ${resolved.shadowMd};
  --shadow-lg: ${resolved.shadowLg};

  /* Spacing */
  --space-xs: ${resolved.spacingXs};
  --space-sm: ${resolved.spacingSm};
  --space-md: ${resolved.spacingMd};
  --space-lg: ${resolved.spacingLg};
  --space-xl: ${resolved.spacingXl};
  --space-2xl: ${resolved.spacing2xl};
}
`;
}

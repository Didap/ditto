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

// ── Nav ──

interface NavProps {
  brand?: string;
  links?: string[];
}

export function Nav({ brand = "Brand", links = ["Home", "Features", "Pricing"] }: NavProps) {
  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      height: 56,
      backgroundColor: "var(--color-bg)",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <span style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text)" }}>
        {brand}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {links.map((link) => (
          <span key={link} style={{
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            cursor: "pointer",
          }}>
            {link}
          </span>
        ))}
        <Button size="sm">Get Started</Button>
      </div>
    </nav>
  );
}

// ── Sidebar ──

interface SidebarItem {
  label: string;
  icon?: string;
  active?: boolean;
}

interface SidebarProps {
  brand?: string;
  items?: SidebarItem[];
}

export function Sidebar({
  brand = "App",
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
      <div style={{ padding: "0 16px 16px", fontWeight: 700, color: "var(--color-text)" }}>
        {brand}
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
  brand?: string;
  sections?: Array<{ title: string; links: string[] }>;
}

export function Footer({
  brand = "Brand",
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
          <div style={{ fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>{brand}</div>
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

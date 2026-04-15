"use client";

import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TabsPrimitive from "@radix-ui/react-tabs";

// ── All preview components use CSS variables from the design tokens ──
// Variables are set on the parent .preview-shell element

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
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer";
  const sizes = {
    sm: "px-3 py-1.5 text-[0.8125rem]",
    md: "px-4 py-2 text-[0.875rem]",
    lg: "px-6 py-2.5 text-[1rem]",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--d-primary)",
      color: "var(--d-on-primary)",
      borderRadius: "var(--d-radius-md)",
    },
    secondary: {
      backgroundColor: "transparent",
      color: "var(--d-primary)",
      borderRadius: "var(--d-radius-md)",
      border: "1px solid var(--d-border)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--d-text-secondary)",
      borderRadius: "var(--d-radius-md)",
    },
    danger: {
      backgroundColor: "var(--d-error)",
      color: "#ffffff",
      borderRadius: "var(--d-radius-md)",
    },
  };

  return (
    <button className={`${base} ${sizes[size]}`} style={variants[variant]}>
      {children}
    </button>
  );
}

// ── Card ──

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`${className} ${hover ? "transition-shadow duration-200 hover:shadow-lg" : ""}`}
      style={{
        backgroundColor: "var(--d-surface)",
        border: "1px solid var(--d-border)",
        borderRadius: "var(--d-radius-lg)",
        boxShadow: "var(--d-shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}

// ── Input ──

export function Input({
  placeholder = "Enter text...",
  label,
  type = "text",
}: {
  placeholder?: string;
  label?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          className="text-[0.8125rem] font-medium"
          style={{ color: "var(--d-text-primary)" }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-[0.875rem] outline-none transition-colors"
        style={{
          backgroundColor: "var(--d-bg)",
          color: "var(--d-text-primary)",
          border: "1px solid var(--d-border)",
          borderRadius: "var(--d-radius-md)",
        }}
      />
    </div>
  );
}

// ── Badge ──

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}) {
  const colorMap: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: "color-mix(in srgb, var(--d-primary) 15%, transparent)",
      color: "var(--d-primary)",
      border: "1px solid color-mix(in srgb, var(--d-primary) 30%, transparent)",
    },
    success: {
      backgroundColor: "color-mix(in srgb, var(--d-success) 15%, transparent)",
      color: "var(--d-success)",
      border: "1px solid color-mix(in srgb, var(--d-success) 30%, transparent)",
    },
    warning: {
      backgroundColor: "color-mix(in srgb, var(--d-warning) 15%, transparent)",
      color: "var(--d-warning)",
      border: "1px solid color-mix(in srgb, var(--d-warning) 30%, transparent)",
    },
    error: {
      backgroundColor: "color-mix(in srgb, var(--d-error) 15%, transparent)",
      color: "var(--d-error)",
      border: "1px solid color-mix(in srgb, var(--d-error) 30%, transparent)",
    },
    info: {
      backgroundColor: "color-mix(in srgb, var(--d-primary) 10%, transparent)",
      color: "var(--d-primary)",
      border: "1px solid color-mix(in srgb, var(--d-primary) 20%, transparent)",
    },
  };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[0.75rem] font-medium"
      style={{
        borderRadius: "var(--d-radius-sm)",
        ...colorMap[variant],
      }}
    >
      {children}
    </span>
  );
}

// ── Nav ──

export function Nav({
  brand = "Brand",
  links = ["Home", "Features", "Pricing", "Blog"],
}: {
  brand?: string;
  links?: string[];
}) {
  return (
    <nav
      className="flex items-center justify-between px-6 py-3"
      style={{
        backgroundColor: "var(--d-bg)",
        borderBottom: "1px solid var(--d-border)",
      }}
    >
      <span
        className="text-lg font-bold"
        style={{ color: "var(--d-text-primary)" }}
      >
        {brand}
      </span>
      <div className="flex items-center gap-6">
        {links.map((link) => (
          <span
            key={link}
            className="text-[0.875rem] cursor-pointer transition-colors"
            style={{ color: "var(--d-text-secondary)" }}
          >
            {link}
          </span>
        ))}
        <Button size="sm">Get Started</Button>
      </div>
    </nav>
  );
}

// ── Table ──

export function Table({
  headers = ["Name", "Status", "Amount", "Date"],
  rows = [
    ["Project Alpha", "Active", "$12,400", "Jan 15, 2025"],
    ["Project Beta", "Pending", "$8,200", "Feb 3, 2025"],
    ["Project Gamma", "Complete", "$24,100", "Mar 22, 2025"],
    ["Project Delta", "Active", "$5,750", "Apr 8, 2025"],
  ],
}: {
  headers?: string[];
  rows?: string[][];
}) {
  return (
    <div
      className="overflow-hidden"
      style={{
        border: "1px solid var(--d-border)",
        borderRadius: "var(--d-radius-lg)",
      }}
    >
      <table className="w-full text-[0.875rem]">
        <thead>
          <tr style={{ backgroundColor: "var(--d-surface)" }}>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-medium"
                style={{
                  color: "var(--d-text-muted)",
                  borderBottom: "1px solid var(--d-border)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom:
                  i < rows.length - 1
                    ? "1px solid var(--d-border)"
                    : undefined,
              }}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-4 py-3"
                  style={{
                    color:
                      j === 0
                        ? "var(--d-text-primary)"
                        : "var(--d-text-secondary)",
                  }}
                >
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

export function Avatar({
  name = "JD",
  size = 40,
}: {
  name?: string;
  size?: number;
}) {
  return (
    <div
      className="inline-flex items-center justify-center font-medium text-[0.8125rem]"
      style={{
        width: size,
        height: size,
        backgroundColor: "color-mix(in srgb, var(--d-primary) 20%, transparent)",
        color: "var(--d-primary)",
        borderRadius: "var(--d-radius-full)",
      }}
    >
      {name}
    </div>
  );
}

// ── Toggle (Radix Switch) ──

export function Toggle({ checked = false }: { checked?: boolean }) {
  return (
    <SwitchPrimitive.Root
      defaultChecked={checked}
      className="relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors"
      style={{ backgroundColor: checked ? "var(--d-primary)" : "var(--d-border)" }}
    >
      <SwitchPrimitive.Thumb
        className="block h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)", marginTop: 2 }}
      />
    </SwitchPrimitive.Root>
  );
}

// ── Tabs (Radix) ──

export function Tabs({
  items = ["Overview", "Analytics", "Settings"],
  active = 0,
}: {
  items?: string[];
  active?: number;
}) {
  return (
    <TabsPrimitive.Root defaultValue={items[active]}>
      <TabsPrimitive.List
        className="flex gap-0"
        style={{ borderBottom: "1px solid var(--d-border)" }}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item}
            value={item}
            className="px-4 py-2.5 text-[0.875rem] cursor-pointer transition-colors data-[state=active]:font-semibold"
            style={{
              color: "var(--d-text-muted)",
              borderBottom: "2px solid transparent",
              background: "none",
              border: "none",
              borderBlockEnd: "2px solid transparent",
            }}
          >
            {item}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}

// ── Sidebar ──

export function Sidebar({
  items = [
    { label: "Dashboard", icon: "◫", active: true },
    { label: "Analytics", icon: "◈" },
    { label: "Customers", icon: "◉" },
    { label: "Products", icon: "▦" },
    { label: "Settings", icon: "⚙" },
  ],
}: {
  items?: Array<{ label: string; icon?: string; active?: boolean }>;
}) {
  return (
    <aside
      className="flex flex-col w-56 py-4"
      style={{
        backgroundColor: "var(--d-surface)",
        borderRight: "1px solid var(--d-border)",
      }}
    >
      <div
        className="px-4 pb-4 text-base font-bold"
        style={{ color: "var(--d-text-primary)" }}
      >
        App Name
      </div>
      <div className="flex flex-col gap-0.5 px-2">
        {items.map((item) => (
          <span
            key={item.label}
            className="flex items-center gap-3 px-3 py-2 text-[0.875rem] cursor-pointer transition-colors"
            style={{
              color: item.active
                ? "var(--d-primary)"
                : "var(--d-text-secondary)",
              backgroundColor: item.active
                ? "color-mix(in srgb, var(--d-primary) 10%, transparent)"
                : "transparent",
              borderRadius: "var(--d-radius-md)",
              fontWeight: item.active ? 600 : 400,
            }}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </span>
        ))}
      </div>
    </aside>
  );
}

// ── Stat Card ──

export function StatCard({
  label = "Total Revenue",
  value = "$45,231",
  change = "+12.5%",
  positive = true,
}: {
  label?: string;
  value?: string;
  change?: string;
  positive?: boolean;
}) {
  return (
    <Card className="p-5">
      <div
        className="text-[0.8125rem] mb-1"
        style={{ color: "var(--d-text-muted)" }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-bold mb-1"
        style={{
          color: "var(--d-text-primary)",
          fontFamily: "var(--d-font-heading)",
        }}
      >
        {value}
      </div>
      <div
        className="text-[0.8125rem]"
        style={{
          color: positive ? "var(--d-success)" : "var(--d-error)",
        }}
      >
        {change} from last month
      </div>
    </Card>
  );
}

// ── Footer ──

export function Footer() {
  return (
    <footer
      className="px-6 py-8 mt-auto"
      style={{
        backgroundColor: "var(--d-surface)",
        borderTop: "1px solid var(--d-border)",
      }}
    >
      <div className="flex justify-between">
        <div>
          <div
            className="font-bold mb-2"
            style={{ color: "var(--d-text-primary)" }}
          >
            Brand
          </div>
          <div
            className="text-[0.8125rem]"
            style={{ color: "var(--d-text-muted)" }}
          >
            Building the future, one pixel at a time.
          </div>
        </div>
        <div className="flex gap-12">
          {["Product", "Company", "Legal"].map((section) => (
            <div key={section}>
              <div
                className="text-[0.8125rem] font-semibold mb-3"
                style={{ color: "var(--d-text-primary)" }}
              >
                {section}
              </div>
              <div className="flex flex-col gap-2">
                {["Link One", "Link Two", "Link Three"].map((link) => (
                  <span
                    key={link}
                    className="text-[0.8125rem] cursor-pointer"
                    style={{ color: "var(--d-text-muted)" }}
                  >
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

// ── TextArea ──

export function TextArea({
  placeholder = "Write something...",
  label,
  rows = 4,
}: {
  placeholder?: string;
  label?: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          className="text-[0.8125rem] font-medium"
          style={{ color: "var(--d-text-primary)" }}
        >
          {label}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-[0.875rem] outline-none transition-colors resize-none"
        style={{
          backgroundColor: "var(--d-bg)",
          color: "var(--d-text-primary)",
          border: "1px solid var(--d-border)",
          borderRadius: "var(--d-radius-md)",
        }}
      />
    </div>
  );
}

// ── Select ──

export function Select({
  label,
  options = ["Option 1", "Option 2", "Option 3"],
}: {
  label?: string;
  options?: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          className="text-[0.8125rem] font-medium"
          style={{ color: "var(--d-text-primary)" }}
        >
          {label}
        </label>
      )}
      <select
        className="w-full px-3 py-2 text-[0.875rem] outline-none appearance-none cursor-pointer"
        style={{
          backgroundColor: "var(--d-bg)",
          color: "var(--d-text-primary)",
          border: "1px solid var(--d-border)",
          borderRadius: "var(--d-radius-md)",
        }}
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// ── Chart (Bar) ──

export function BarChart({
  data = [
    { label: "Jan", value: 65 },
    { label: "Feb", value: 45 },
    { label: "Mar", value: 78 },
    { label: "Apr", value: 52 },
    { label: "May", value: 90 },
    { label: "Jun", value: 70 },
  ],
  title = "Monthly Revenue",
}: {
  data?: Array<{ label: string; value: number }>;
  title?: string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div>
      {title && (
        <div
          className="text-sm font-semibold mb-4"
          style={{ color: "var(--d-text-primary)" }}
        >
          {title}
        </div>
      )}
      <div className="flex items-end gap-2" style={{ height: 160 }}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${(d.value / max) * 140}px`,
                backgroundColor: "var(--d-primary)",
                opacity: 0.8 + (d.value / max) * 0.2,
                borderRadius: "var(--d-radius-sm) var(--d-radius-sm) 0 0",
              }}
            />
            <span
              className="text-[0.6875rem]"
              style={{ color: "var(--d-text-muted)" }}
            >
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chart (Line / Sparkline) ──

export function LineChart({
  data = [30, 55, 40, 78, 60, 90, 72],
  title = "Weekly Trend",
}: {
  data?: number[];
  title?: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 120;
  const w = 100;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 10);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      {title && (
        <div
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--d-text-primary)" }}
        >
          {title}
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 120 }}>
        <polyline
          points={points}
          fill="none"
          stroke="var(--d-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * w;
          const y = h - ((v - min) / (max - min || 1)) * (h - 10);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="var(--d-bg)"
              stroke="var(--d-primary)"
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
}

// ── Contact Form ──

export function ContactForm() {
  return (
    <div
      className="p-6"
      style={{
        backgroundColor: "var(--d-surface)",
        border: "1px solid var(--d-border)",
        borderRadius: "var(--d-radius-lg)",
      }}
    >
      <h3
        className="text-lg font-semibold mb-1"
        style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
      >
        Get in Touch
      </h3>
      <p className="text-sm mb-5" style={{ color: "var(--d-text-muted)" }}>
        We&apos;d love to hear from you. Fill out the form below.
      </p>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" placeholder="John" />
          <Input label="Last Name" placeholder="Doe" />
        </div>
        <Input label="Email" placeholder="john@example.com" type="email" />
        <Select label="Subject" options={["General Inquiry", "Support", "Sales", "Partnership"]} />
        <TextArea label="Message" placeholder="How can we help you?" rows={4} />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs" style={{ color: "var(--d-text-muted)" }}>
            We&apos;ll respond within 24 hours
          </span>
          <Button>Send Message</Button>
        </div>
      </div>
    </div>
  );
}

// ── Header Hero ──

export function HeaderHero({
  title = "Build something amazing",
  subtitle = "The all-in-one platform for modern teams to create, collaborate, and ship faster.",
  cta = "Get Started",
  secondaryCta = "Learn More",
}: {
  title?: string;
  subtitle?: string;
  cta?: string;
  secondaryCta?: string;
}) {
  return (
    <div className="text-center px-8 py-20" style={{ backgroundColor: "var(--d-bg)" }}>
      <Badge>Now Available</Badge>
      <h1
        className="mt-4 text-[2.75rem] leading-tight tracking-tight"
        style={{
          color: "var(--d-text-primary)",
          fontFamily: "var(--d-font-heading)",
          fontWeight: "var(--d-weight-heading)",
        }}
      >
        {title}
      </h1>
      <p
        className="mt-4 text-lg max-w-2xl mx-auto"
        style={{ color: "var(--d-text-secondary)" }}
      >
        {subtitle}
      </p>
      <div className="mt-8 flex gap-3 justify-center">
        <Button size="lg">{cta}</Button>
        <Button variant="secondary" size="lg">{secondaryCta}</Button>
      </div>
    </div>
  );
}

// ── FAQ Accordion (Radix) ──

export function FAQ({
  items = [
    { q: "What is included in the free plan?", a: "The free plan includes up to 3 projects, basic analytics, community support, and 1 GB of storage. No credit card required." },
    { q: "Can I upgrade or downgrade at any time?", a: "Yes, you can change your plan at any time. Upgrades are effective immediately and downgrades take effect at the end of your billing cycle." },
    { q: "Do you offer a free trial?", a: "Yes! All paid plans come with a 14-day free trial. No credit card required to start." },
    { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for annual plans." },
    { q: "Is there a refund policy?", a: "We offer a 30-day money-back guarantee on all paid plans. No questions asked." },
  ],
  title = "Frequently Asked Questions",
}: {
  items?: Array<{ q: string; a: string }>;
  title?: string;
}) {
  return (
    <div>
      {title && (
        <h2
          className="text-xl font-bold mb-6 text-center"
          style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
        >
          {title}
        </h2>
      )}
      <AccordionPrimitive.Root type="single" collapsible>
        {items.map((item, i) => (
          <AccordionPrimitive.Item
            key={i}
            value={`item-${i}`}
            style={{ borderBottom: "1px solid var(--d-border)" }}
          >
            <AccordionPrimitive.Header>
              <AccordionPrimitive.Trigger
                className="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
                style={{ background: "none", border: "none", padding: "16px 0" }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--d-text-primary)" }}
                >
                  {item.q}
                </span>
                <span
                  className="text-lg shrink-0 ml-4 transition-transform duration-200 group-data-[state=open]:rotate-45"
                  style={{ color: "var(--d-text-muted)" }}
                >
                  +
                </span>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <div
                className="pb-4 text-sm leading-relaxed"
                style={{ color: "var(--d-text-secondary)" }}
              >
                {item.a}
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  );
}

// ── Payment Form ──

export function PaymentForm({
  amount = "$29.00",
  plan = "Pro Plan",
}: {
  amount?: string;
  plan?: string;
}) {
  return (
    <div
      className="p-6"
      style={{
        backgroundColor: "var(--d-surface)",
        border: "1px solid var(--d-border)",
        borderRadius: "var(--d-radius-lg)",
        maxWidth: 420,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div
            className="text-base font-semibold"
            style={{ color: "var(--d-text-primary)" }}
          >
            {plan}
          </div>
          <div className="text-xs" style={{ color: "var(--d-text-muted)" }}>
            Billed monthly
          </div>
        </div>
        <div
          className="text-2xl font-bold"
          style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
        >
          {amount}
        </div>
      </div>

      <div
        className="h-px mb-5"
        style={{ backgroundColor: "var(--d-border)" }}
      />

      <div className="flex flex-col gap-3">
        <Input label="Cardholder Name" placeholder="John Doe" />
        <Input label="Card Number" placeholder="4242 4242 4242 4242" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Expiry" placeholder="MM / YY" />
          <Input label="CVC" placeholder="123" />
        </div>

        <div
          className="flex items-center gap-2 mt-1 text-xs"
          style={{ color: "var(--d-text-muted)" }}
        >
          <span>🔒</span> Secured with 256-bit SSL encryption
        </div>

        <Button size="lg">Pay {amount}</Button>

        <div className="flex justify-center gap-4 mt-2">
          {["Visa", "MC", "Amex", "PayPal"].map((m) => (
            <span
              key={m}
              className="text-[0.6875rem] px-2 py-0.5"
              style={{
                color: "var(--d-text-muted)",
                border: "1px solid var(--d-border)",
                borderRadius: "var(--d-radius-sm)",
              }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Reviews / Testimonials ──

export function Reviews({
  items = [
    {
      name: "Sarah Chen",
      role: "Product Designer",
      initials: "SC",
      text: "This tool has completely changed how we approach design systems. The extraction is incredibly accurate and saves us weeks of work.",
      rating: 5,
    },
    {
      name: "James Wilson",
      role: "Frontend Lead",
      initials: "JW",
      text: "We've tried many design tools but nothing comes close. The generated components work perfectly with our existing codebase.",
      rating: 5,
    },
    {
      name: "Maria Lopez",
      role: "CTO at StartupXYZ",
      initials: "ML",
      text: "The ability to blend multiple design inspirations into a cohesive system is a game changer. Highly recommended.",
      rating: 4,
    },
  ],
  title = "What Our Users Say",
}: {
  items?: Array<{
    name: string;
    role: string;
    initials: string;
    text: string;
    rating: number;
  }>;
  title?: string;
}) {
  return (
    <div>
      {title && (
        <h2
          className="text-xl font-bold mb-8 text-center"
          style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
        >
          {title}
        </h2>
      )}
      <div className="grid grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.name}
            className="p-5"
            style={{
              backgroundColor: "var(--d-surface)",
              border: "1px solid var(--d-border)",
              borderRadius: "var(--d-radius-lg)",
            }}
          >
            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="text-sm"
                  style={{
                    color: i < item.rating ? "var(--d-warning)" : "var(--d-border)",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <p
              className="text-sm mb-4 leading-relaxed"
              style={{ color: "var(--d-text-secondary)" }}
            >
              &ldquo;{item.text}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <Avatar name={item.initials} size={32} />
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--d-text-primary)" }}
                >
                  {item.name}
                </div>
                <div className="text-xs" style={{ color: "var(--d-text-muted)" }}>
                  {item.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

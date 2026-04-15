"use client";

import React from "react";
import { Zap as ZapIcon, Shield, Smartphone } from "lucide-react";
import {
  Button,
  Card,
  Input,
  TextArea,
  Select,
  Badge,
  Table,
  Avatar,
  Toggle,
  Tabs,
  StatCard,
  Nav,
  Footer,
  Sidebar,
  BarChart,
  LineChart,
  ContactForm,
  HeaderHero,
  FAQ,
  PaymentForm,
  Reviews,
} from "../primitives";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-8 px-8">
      <h2
        className="text-lg font-bold mb-1"
        style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
      >
        {title}
      </h2>
      <div className="h-px mb-6" style={{ backgroundColor: "var(--d-border)" }} />
      {children}
    </div>
  );
}

function Subsection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <span className="text-xs font-medium mb-3 block" style={{ color: "var(--d-text-muted)" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

export function ComponentsPreview() {
  return (
    <div className="flex flex-col" style={{ backgroundColor: "var(--d-bg)" }}>
      {/* Header */}
      <div
        className="px-8 py-6"
        style={{ borderBottom: "1px solid var(--d-border)" }}
      >
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--d-text-primary)", fontFamily: "var(--d-font-heading)" }}
        >
          Component Library
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--d-text-muted)" }}>
          All components rendered with the extracted design tokens.
        </p>
      </div>

      {/* ── 1. BUTTONS ── */}
      <Section title="Buttons">
        <Subsection label="Variants">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </Subsection>

        <Subsection label="Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Subsection>

        <Subsection label="Button Groups">
          <div className="flex gap-2">
            <Button variant="primary">Save Changes</Button>
            <Button variant="secondary">Cancel</Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="ghost" size="sm">Edit</Button>
            <Button variant="ghost" size="sm">Duplicate</Button>
            <Button variant="danger" size="sm">Delete</Button>
          </div>
        </Subsection>
      </Section>

      {/* ── 2. CARDS ── */}
      <Section title="Cards">
        <div className="grid grid-cols-3 gap-4">
          <Subsection label="Basic Card">
            <Card className="p-5">
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--d-text-primary)" }}>
                Card Title
              </h3>
              <p className="text-sm" style={{ color: "var(--d-text-secondary)" }}>
                This is a basic card component with standard padding and border styling.
              </p>
              <div className="mt-4">
                <Button size="sm">Action</Button>
              </div>
            </Card>
          </Subsection>

          <Subsection label="Stat Card">
            <StatCard label="Total Revenue" value="$45,231" change="+12.5%" positive />
          </Subsection>

          <Subsection label="Hover Card">
            <Card className="p-5" hover>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name="AB" size={36} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--d-text-primary)" }}>Alice Brown</div>
                  <div className="text-xs" style={{ color: "var(--d-text-muted)" }}>Product Designer</div>
                </div>
              </div>
              <p className="text-sm" style={{ color: "var(--d-text-secondary)" }}>
                Working on the new design system for the mobile app.
              </p>
            </Card>
          </Subsection>
        </div>

        <Subsection label="Feature Cards Row">
          <div className="grid grid-cols-3 gap-4">
            {[
              { Icon: ZapIcon, title: "Fast", desc: "Optimized for speed and performance" },
              { Icon: Shield, title: "Secure", desc: "Enterprise-grade encryption" },
              { Icon: Smartphone, title: "Responsive", desc: "Works on every device" },
            ].map((f) => (
              <Card key={f.title} className="p-5" hover>
                <div className="mb-2"><f.Icon className="w-5 h-5" style={{ color: "var(--d-primary)" }} strokeWidth={1.5} /></div>
                <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--d-text-primary)" }}>{f.title}</h4>
                <p className="text-xs" style={{ color: "var(--d-text-muted)" }}>{f.desc}</p>
              </Card>
            ))}
          </div>
        </Subsection>
      </Section>

      {/* ── 3. FORMS & INPUTS ── */}
      <Section title="Forms & Inputs">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <Subsection label="Text Inputs">
              <div className="space-y-3">
                <Input label="Full Name" placeholder="John Doe" />
                <Input label="Email" placeholder="john@example.com" type="email" />
                <Input label="Password" placeholder="Enter password" type="password" />
              </div>
            </Subsection>

            <Subsection label="Select">
              <Select label="Country" options={["United States", "United Kingdom", "Italy", "Germany", "Japan"]} />
            </Subsection>
          </div>

          <div className="space-y-4">
            <Subsection label="Text Area">
              <TextArea label="Message" placeholder="Write your message here..." rows={4} />
            </Subsection>

            <Subsection label="Form Example">
              <Card className="p-5">
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--d-text-primary)" }}>Contact Form</h4>
                <div className="space-y-3">
                  <Input placeholder="Your name" />
                  <Input placeholder="your@email.com" type="email" />
                  <TextArea placeholder="How can we help?" rows={3} />
                  <Button>Send Message</Button>
                </div>
              </Card>
            </Subsection>
          </div>
        </div>
      </Section>

      {/* ── 4. BADGES & STATUS ── */}
      <Section title="Badges & Status">
        <Subsection label="Variants">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </Subsection>

        <Subsection label="In Context">
          <div className="flex flex-col gap-3">
            {[
              { name: "API Server", badge: "success" as const, status: "Operational" },
              { name: "Database", badge: "success" as const, status: "Healthy" },
              { name: "CDN", badge: "warning" as const, status: "Degraded" },
              { name: "Email Service", badge: "error" as const, status: "Down" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg"
                style={{ backgroundColor: "var(--d-surface)", border: "1px solid var(--d-border)" }}
              >
                <span className="text-sm" style={{ color: "var(--d-text-primary)" }}>{item.name}</span>
                <Badge variant={item.badge}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </Subsection>

        <Subsection label="Avatars">
          <div className="flex items-center gap-3">
            <Avatar name="JD" size={32} />
            <Avatar name="AB" size={40} />
            <Avatar name="CK" size={48} />
            <Avatar name="ML" size={56} />
          </div>
        </Subsection>

        <Subsection label="Toggles">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Toggle checked={true} />
              <span className="text-sm" style={{ color: "var(--d-text-secondary)" }}>Enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <Toggle checked={false} />
              <span className="text-sm" style={{ color: "var(--d-text-secondary)" }}>Disabled</span>
            </div>
          </div>
        </Subsection>
      </Section>

      {/* ── 5. DATA DISPLAY ── */}
      <Section title="Data Display">
        <Subsection label="Table">
          <Table
            headers={["Name", "Role", "Status", "Last Active"]}
            rows={[
              ["Sarah Chen", "Admin", "Active", "2 min ago"],
              ["James Wilson", "Editor", "Active", "1 hour ago"],
              ["Maria Lopez", "Viewer", "Inactive", "3 days ago"],
              ["Alex Kumar", "Editor", "Active", "5 min ago"],
              ["Emma Davis", "Admin", "Active", "Just now"],
            ]}
          />
        </Subsection>

        <Subsection label="Stat Cards Row">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Users" value="12,345" change="+5.2%" positive />
            <StatCard label="Revenue" value="$89.4K" change="+12.1%" positive />
            <StatCard label="Orders" value="1,234" change="-2.3%" positive={false} />
            <StatCard label="Conversion" value="3.2%" change="+0.4%" positive />
          </div>
        </Subsection>

        <Subsection label="Tabs">
          <Tabs items={["Overview", "Analytics", "Reports", "Settings"]} active={0} />
          <div className="mt-4 p-4 text-sm" style={{ color: "var(--d-text-secondary)" }}>
            Tab content area — this would contain the relevant panel content.
          </div>
        </Subsection>
      </Section>

      {/* ── NAVIGATION ── */}
      <Section title="Navigation">
        <Subsection label="Top Navigation">
          <Nav brand="AppName" links={["Dashboard", "Products", "Customers", "Analytics"]} />
        </Subsection>

        <Subsection label="Sidebar">
          <div className="w-64">
            <Sidebar />
          </div>
        </Subsection>
      </Section>

      {/* ── CHARTS ── */}
      <Section title="Charts">
        <div className="grid grid-cols-2 gap-8">
          <Subsection label="Bar Chart">
            <Card className="p-5">
              <BarChart title="Monthly Revenue" />
            </Card>
          </Subsection>
          <Subsection label="Line Chart">
            <Card className="p-5">
              <LineChart title="Weekly Trend" data={[30, 55, 40, 78, 60, 90, 72]} />
            </Card>
          </Subsection>
        </div>
      </Section>

      {/* ── CONTACT FORM ── */}
      <Section title="Contact Form">
        <div className="max-w-lg">
          <ContactForm />
        </div>
      </Section>

      {/* ── HEADER HERO ── */}
      <Section title="Headers">
        <HeaderHero
          title="Build something amazing"
          subtitle="The all-in-one platform for modern teams to create, collaborate, and ship faster."
        />
      </Section>

      {/* ── FAQ ── */}
      <Section title="FAQ (Accordion)">
        <div className="max-w-2xl mx-auto">
          <FAQ />
        </div>
      </Section>

      {/* ── PAYMENT FORM ── */}
      <Section title="Payment">
        <PaymentForm amount="$29.00" plan="Pro Plan" />
      </Section>

      {/* ── REVIEWS ── */}
      <Section title="Reviews">
        <Reviews />
      </Section>

      {/* ── FOOTER ── */}
      <Section title="Footer">
        <Footer />
      </Section>
    </div>
  );
}

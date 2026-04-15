import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Ditto | Free Design System Extractor",
  description:
    "Create your free Ditto account. Extract design systems from any website, blend inspirations, and export production-ready design tokens.",
  openGraph: {
    title: "Create Account — Ditto",
    description:
      "Start extracting design systems for free. No credit card required.",
    url: "https://ditto.design/register",
  },
  alternates: {
    canonical: "https://ditto.design/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Ditto Design System Extractor",
  description:
    "Free to start. Extract 3 designs/month at no cost. Upgrade to Pro ($19/mo) for unlimited extractions, React export, and Figma push.",
  openGraph: {
    title: "Pricing | Ditto",
    description:
      "Free to start. Upgrade to Pro for unlimited extractions and Figma integration.",
    url: "https://ditto.design/pricing",
  },
  alternates: {
    canonical: "https://ditto.design/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

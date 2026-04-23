import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Ditto",
  description: "Sign in to your Ditto account to manage your design systems.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

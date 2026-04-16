import type { ResolvedDesign } from "../types";

/**
 * Generate a Tailwind CSS v4 config that maps design tokens to theme values.
 */
export function generateTailwindConfig(resolved: ResolvedDesign): string {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "${resolved.colorPrimary}",
        secondary: "${resolved.colorSecondary}",
        accent: "${resolved.colorAccent}",
        background: "${resolved.colorBackground}",
        surface: "${resolved.colorSurface}",
        "text-primary": "${resolved.colorTextPrimary}",
        "text-secondary": "${resolved.colorTextSecondary}",
        "text-muted": "${resolved.colorTextMuted}",
        border: "${resolved.colorBorder}",
        success: "${resolved.colorSuccess}",
        warning: "${resolved.colorWarning}",
        error: "${resolved.colorError}",
      },
      fontFamily: {
        heading: ["'${resolved.fontHeading}'", "system-ui", "sans-serif"],
        body: ["'${resolved.fontBody}'", "system-ui", "sans-serif"],
        mono: ["'${resolved.fontMono}'", "ui-monospace", "monospace"],
      },
      fontWeight: {
        heading: "${resolved.fontWeightHeading}",
        body: "${resolved.fontWeightBody}",
      },
      fontSize: {
        xs: "${resolved.textXs}",
        sm: "${resolved.textSm}",
        base: "${resolved.textBase}",
        lg: "${resolved.textLg}",
        xl: "${resolved.textXl}",
        "2xl": "${resolved.text2xl}",
        "3xl": "${resolved.text3xl}",
        "4xl": "${resolved.text4xl}",
      },
      borderRadius: {
        sm: "${resolved.radiusSm}",
        md: "${resolved.radiusMd}",
        lg: "${resolved.radiusLg}",
        full: "${resolved.radiusFull}",
      },
      boxShadow: {
        sm: "${resolved.shadowSm}",
        md: "${resolved.shadowMd}",
        lg: "${resolved.shadowLg}",
      },
      spacing: {
        xs: "${resolved.spacingXs}",
        sm: "${resolved.spacingSm}",
        md: "${resolved.spacingMd}",
        lg: "${resolved.spacingLg}",
        xl: "${resolved.spacingXl}",
        "2xl": "${resolved.spacing2xl}",
      },
      lineHeight: {
        tight: "${resolved.lineHeightTight}",
        normal: "${resolved.lineHeightNormal}",
        relaxed: "${resolved.lineHeightRelaxed}",
      },
    },
  },
  plugins: [],
};

export default config;
`;
}

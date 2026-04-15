import localFont from "next/font/local";

export const canvaSans = localFont({
  src: [
    {
      path: "../../public/fonts/canvaSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/canvaSans-Medium.woff2",
      weight: "500 600",
      style: "normal",
    },
    {
      path: "../../public/fonts/canvaSans-Bold.woff2",
      weight: "700 900",
      style: "normal",
    },
  ],
  variable: "--font-canvaSans",
  display: "swap",
});

export const leoSans = localFont({
  src: [
    {
      path: "../../public/fonts/leoSans-Bold.woff2",
      weight: "400 900",
      style: "normal",
    },
  ],
  variable: "--font-leoSans",
  display: "swap",
});

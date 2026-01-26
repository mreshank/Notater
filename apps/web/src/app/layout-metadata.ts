import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Notater",
  description: "Offline-first idea capture for music.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["music", "production", "offline", "pwa", "beats", "notation"],
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
  authors: [
    { name: "Antigravity" },
    {
      name: "Antigravity",
      url: "https://www.linkedin.com/in/mreshank/",
    },
  ],
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    { rel: "apple-touch-icon", url: "icons/icon-128x128.png" },
    { rel: "icon", url: "icons/icon-128x128.png" },
  ],
};

export const viewport: Viewport = {
    themeColor: "#FFFFFF",
};

import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Critical for PWA feeling native
};

const title = "Notater | Offline Music Studio";
const description = "Capture your sound anywhere with Notater. An offline-first, collaborative music production studio in your browser. Features 16-step sequencer, polyphonic synths, and AI drum patterns.";
const url = "https://notater.app"; // Replace with actual URL if known, or use localhost for now

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s | Notater Studio",
  },
  description: description,
  applicationName: "Notater",
  authors: [{ name: "mreshank", url: "https://github.com/mreshank" }],
  generator: "Next.js",
  keywords: ["music production", "DAW", "sequencer", "synthesizer", "offline pwa", "web audio api", "tone.js", "beat maker", "ai music", "collaborative music"],
  manifest: "/manifest.json",
  icons: {
    icon: "/web-app-manifest-192x192.png",
    apple: "/web-app-manifest-192x192.png",
  },
  openGraph: {
    type: "website",
    url: url,
    title: title,
    description: description,
    siteName: "Notater",
    images: [
      {
        url: "/icon.png", // Start with the icon, ideally replace with a wide banner later
        width: 512,
        height: 512,
        alt: "Notater Studio Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: title,
    description: description,
    creator: "@mreshank", 
    images: ["/icon.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Notater",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

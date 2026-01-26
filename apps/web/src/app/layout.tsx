import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import { GoogleDriveScript } from "@/components/GoogleDriveScript";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export { metadata, viewport } from "./layout-metadata";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="cyber">
        <GoogleDriveScript />
        <body
          className={`${inter.variable} ${jetbrains.variable} antialiased h-screen w-screen overflow-hidden touch-none`}
        >
          <div id="root" className="h-full w-full flex flex-col">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}

import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export { metadata, viewport } from "./layout-metadata";

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrains.variable} antialiased h-screen w-screen overflow-hidden touch-none`}
      >
        <Providers>
          <div id="root" className="h-full w-full flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

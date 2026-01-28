import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import { GoogleDriveScript } from "@/components/GoogleDriveScript";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ModalProvider } from "@/components/ui/ModalProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export { metadata, viewport } from "./layout-metadata";

import { Toaster } from "sonner";

// ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="cyber">
        <body
          className={`${inter.variable} ${jetbrains.variable} antialiased h-screen w-screen overflow-hidden touch-none`}
        >
          <GoogleDriveScript />
          <ToastProvider>
            <ModalProvider>
              <div id="root" className="h-full w-full flex flex-col">
                {children}
              </div>
            </ModalProvider>
            <Toaster theme="dark" position="bottom-right" richColors />
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

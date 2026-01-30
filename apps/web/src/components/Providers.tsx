"use client";

import { useEffect } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark, neobrutalism } from "@clerk/themes";
import { useStore } from "@/lib/store";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ModalProvider } from "@/components/ui/ModalProvider";
import { Toaster } from "sonner";
import { GoogleDriveScript } from "@/components/GoogleDriveScript";

export function Providers({ children }: { children: React.ReactNode }) {
    const theme = useStore((state) => state.theme);

    // Sync theme with DOM
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-theme", theme);
    }, [theme]);

    // Determine Clerk Theme
    // We map our app themes to Clerk's base themes + variable overrides
    const getClerkAppearance = () => {
        // For 'lofi' (light mode) and 'neo' (custom light), we might want light base.
        // But 'dark' is a safe default for cyber/forest/ocean/midnight/sunset.
        // 'lofi' is our default light theme.
        const isLight = theme === "lofi" || theme === "neo";
        const baseTheme = theme === "neo" ? neobrutalism : (isLight ? undefined : dark);

        return {
            baseTheme: baseTheme,
            variables: {
                colorPrimary: "var(--primary)",
                colorText: "var(--foreground)",
                colorBackground: "var(--background)",
                colorInputBackground: "var(--input)",
                colorInputText: "var(--foreground)",
                colorTextOnPrimaryBackground: "var(--primary-foreground)",
                // Add more specific overrides if needed
                borderRadius: "var(--radius)",
            },
            elements: {
                card: "bg-background border border-border shadow-xl",
                navbar: "hidden", // Hide clerk navbar if desired, or customize
                headerTitle: "text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton: "bg-surface hover:bg-surface-hover text-foreground border border-border",
                formFieldLabel: "text-foreground",
                formFieldInput: "bg-input text-foreground border-border",
                footer: "hidden"
            }
        };
    };

    return (
        <ClerkProvider appearance={getClerkAppearance()}>
            <GoogleDriveScript />
            <ToastProvider>
                <ModalProvider>
                    {children}
                </ModalProvider>
                <Toaster theme={theme === "lofi" || theme === "neo" ? "light" : "dark"} position="bottom-right" richColors />
            </ToastProvider>
        </ClerkProvider>
    );
}

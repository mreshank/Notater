"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export interface Shortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    category: "transport" | "file" | "edit" | "navigation" | "view";
    action: () => void;
}

interface UseKeyboardShortcutsOptions {
    onNavigate: (view: string) => void;
    onShowShortcuts: () => void;
    onToggleLooper?: () => void;
    activeView?: string;
}

export function useKeyboardShortcuts({ onNavigate, onShowShortcuts, onToggleLooper }: UseKeyboardShortcutsOptions) {
    const store = useStore();

    const shortcuts: Shortcut[] = useMemo(() => [
        // ==================== TRANSPORT ====================
        {
            key: " ",
            description: "Play / Pause",
            category: "transport",
            action: () => {
                store.togglePlay();
                toast.success(store.isPlaying ? "Paused" : "Playing");
            },
        },
        {
            key: "r",
            ctrl: true,
            description: "Toggle Record",
            category: "transport",
            action: () => {
                store.toggleRecord();
                toast.success(store.isRecording ? "Recording stopped" : "Recording started");
            },
        },
        {
            key: "Escape",
            description: "Stop & Reset",
            category: "transport",
            action: () => {
                if (store.isPlaying) store.togglePlay();
                toast.info("Stopped");
            },
        },
        {
            key: "=",
            ctrl: true,
            description: "Increase BPM (+5)",
            category: "transport",
            action: () => {
                const newBpm = Math.min(200, store.project.bpm + 5);
                store.setBpm(newBpm);
                toast.success(`BPM: ${newBpm}`);
            },
        },
        {
            key: "-",
            ctrl: true,
            description: "Decrease BPM (-5)",
            category: "transport",
            action: () => {
                const newBpm = Math.max(40, store.project.bpm - 5);
                store.setBpm(newBpm);
                toast.success(`BPM: ${newBpm}`);
            },
        },

        // ==================== FILE ====================
        {
            key: "s",
            ctrl: true,
            description: "Save Project",
            category: "file",
            action: async () => {
                await store.saveProject();
                toast.success("Project saved");
            },
        },
        {
            key: "e",
            ctrl: true,
            description: "Export Audio",
            category: "file",
            action: async () => {
                toast.info("Exporting audio...");
                await store.exportAudio();
            },
        },

        // ==================== EDIT ====================
        {
            key: "a",
            ctrl: true,
            description: "Clear All Notes",
            category: "edit",
            action: () => {
                store.clearPianoNotes();
                toast.info("All notes cleared");
            },
        },
        {
            key: "Delete",
            description: "Clear All Notes",
            category: "edit",
            action: () => {
                store.clearPianoNotes();
                toast.info("All notes cleared");
            },
        },

        // ==================== NAVIGATION ====================
        {
            key: "h",
            ctrl: true,
            description: "Go to Home",
            category: "navigation",
            action: () => onNavigate("home"),
        },
        {
            key: "1",
            ctrl: true,
            description: "Drums",
            category: "navigation",
            action: () => onNavigate("drums"),
        },
        {
            key: "2",
            ctrl: true,
            description: "Sequencer",
            category: "navigation",
            action: () => onNavigate("seq"),
        },
        {
            key: "3",
            ctrl: true,
            description: "Piano Roll",
            category: "navigation",
            action: () => onNavigate("piano"),
        },
        {
            key: "4",
            ctrl: true,
            description: "Keys",
            category: "navigation",
            action: () => onNavigate("keys"),
        },
        {
            key: "5",
            ctrl: true,
            description: "Mixer",
            category: "navigation",
            action: () => onNavigate("mix"),
        },

        // ==================== VIEW ====================
        {
            key: "/",
            ctrl: true,
            description: "Keyboard Shortcuts",
            category: "view",
            action: onShowShortcuts,
        },
        {
            key: "?",
            shift: true,
            description: "Keyboard Shortcuts",
            category: "view",
            action: onShowShortcuts,
        },
        {
            key: "f",
            ctrl: true,
            description: "Toggle Fullscreen",
            category: "view",
            action: () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    toast.success("Exited fullscreen");
                } else {
                    document.documentElement.requestFullscreen();
                    toast.success("Entered fullscreen");
                }
            },
        },
        {
            key: "t",
            ctrl: true,
            description: "Cycle Theme",
            category: "view",
            action: () => {
                const themes = ["lofi", "cyber", "neo", "forest", "ocean", "sunset", "midnight"] as const;
                const currentIdx = themes.indexOf(store.theme);
                const nextTheme = themes[(currentIdx + 1) % themes.length];
                store.setTheme(nextTheme);
                toast.success(`Theme: ${nextTheme}`);
            },
        },
        {
            key: "l",
            ctrl: true,
            description: "Toggle Looper Panel",
            category: "view",
            action: () => {
                onToggleLooper?.();
                toast.info("Looper panel toggled");
            },
        },
    ], [store, onNavigate, onShowShortcuts, onToggleLooper]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Ignore if user is typing in an input
            const target = event.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

            for (const shortcut of shortcuts) {
                const keyMatches =
                    event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                    event.key === shortcut.key;
                const ctrlMatches = shortcut.ctrl ? ctrlOrCmd : !ctrlOrCmd;
                const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
                const altMatches = shortcut.alt ? event.altKey : !event.altKey;

                if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
                    event.preventDefault();
                    shortcut.action();
                    return;
                }
            }
        },
        [shortcuts]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return { shortcuts };
}

// Helper to format shortcut keys for display
export function formatShortcutKey(shortcut: Shortcut): string {
    const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push(isMac ? "⌘" : "Ctrl");
    if (shortcut.shift) parts.push(isMac ? "⇧" : "Shift");
    if (shortcut.alt) parts.push(isMac ? "⌥" : "Alt");

    // Format special keys
    let keyDisplay = shortcut.key;
    if (shortcut.key === " ") keyDisplay = "Space";
    if (shortcut.key === "Delete") keyDisplay = "Del";
    if (shortcut.key === "Backspace") keyDisplay = "Bksp";
    if (shortcut.key === "Escape") keyDisplay = "Esc";
    if (shortcut.key === "/") keyDisplay = "/";
    if (shortcut.key === "?") keyDisplay = "?";

    parts.push(keyDisplay.toUpperCase());

    return parts.join(isMac ? "" : "+");
}

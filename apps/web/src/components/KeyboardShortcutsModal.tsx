"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Zap, FolderOpen, Edit3, Compass, Eye, Command, Info } from "lucide-react";
import { Shortcut, formatShortcutKey } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: Shortcut[];
}

const categoryConfig = {
    transport: { label: "Transport", icon: Zap, color: "text-green-400", bg: "bg-green-500/10" },
    file: { label: "File", icon: FolderOpen, color: "text-blue-400", bg: "bg-blue-500/10" },
    edit: { label: "Edit", icon: Edit3, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    view: { label: "View", icon: Eye, color: "text-pink-400", bg: "bg-pink-500/10" },
    navigation: { label: "Navigation", icon: Compass, color: "text-purple-400", bg: "bg-purple-500/10" },
};

export function KeyboardShortcutsModal({ isOpen, onClose, shortcuts }: KeyboardShortcutsModalProps) {
    const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

    const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
        if (!acc[shortcut.category]) {
            acc[shortcut.category] = [];
        }
        // Skip duplicate shortcuts (like Delete and Backspace)
        if (!acc[shortcut.category].some(s => s.description === shortcut.description)) {
            acc[shortcut.category].push(shortcut);
        }
        return acc;
    }, {} as Record<string, Shortcut[]>);

    const categoryOrder: (keyof typeof categoryConfig)[] = ["transport", "file", "edit", "view", "navigation"];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[964px] md:max-h-[84vh] bg-linear-to-br from-background via-background to-muted/20 border border-border/50 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="relative p-6 pb-4 border-b border-border/50">
                            {/* Decorative gradient */}
                            <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

                            <div className="relative flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        initial={{ rotate: -10 }}
                                        animate={{ rotate: 0 }}
                                        className="p-3 bg-linear-to-br from-primary/20 to-purple-500/20 rounded-2xl border border-primary/20"
                                    >
                                        <Keyboard className="text-primary" size={28} />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">Keyboard Shortcuts</h2>
                                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                            <span>Speed up your workflow with these shortcuts</span>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                                                <Command size={10} />
                                                {isMac ? "Mac" : "Windows/Linux"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    aria-label="Close shortcuts modal"
                                    className="p-2 hover:bg-muted rounded-xl transition-all hover:scale-105 active:scale-95"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content - 2 col on desktop, 1 col on mobile */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categoryOrder.map((key) => {
                                    const config = categoryConfig[key];
                                    const categoryShortcuts = groupedShortcuts[key];
                                    if (!categoryShortcuts?.length) return null;

                                    const Icon = config.icon;

                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: categoryOrder.indexOf(key) * 0.05 }}
                                            className="space-y-3"
                                        >
                                            {/* Category Header */}
                                            <div className={`flex items-center gap-2 ${config.color}`}>
                                                <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                                    <Icon size={14} />
                                                </div>
                                                <h3 className="text-sm font-bold uppercase tracking-wider">
                                                    {config.label}
                                                </h3>
                                                <div className="flex-1 h-px bg-current opacity-20" />
                                            </div>

                                            {/* Shortcuts List */}
                                            <div className="space-y-2">
                                                {categoryShortcuts.map((shortcut, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: categoryOrder.indexOf(key) * 0.05 + idx * 0.02 }}
                                                        className="group flex items-center justify-between px-3 py-1.5 bg-muted/20 hover:bg-muted/40 rounded-xl transition-all duration-200 border border-transparent hover:border-border/50"
                                                    >
                                                        <span className="text-sm text-foreground/90 group-hover:text-foreground transition-colors">
                                                            {shortcut.description}
                                                        </span>
                                                        <kbd className="px-2.5 py-1 bg-background border border-border rounded-lg font-mono text-xs shadow-sm group-hover:shadow-md group-hover:border-primary/30 transition-all min-w-[60px] text-center">
                                                            {formatShortcutKey(shortcut)}
                                                        </kbd>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer with tips */}
                        <div className="p-4 border-t border-border/50 bg-muted/10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <Info size={14} className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium text-foreground/70">Pro Tips:</p>
                                        <ul className="mt-1 space-y-0.5">
                                            <li>• Use number keys <kbd className="px-1 bg-background border border-border rounded text-[10px]">1-5</kbd> for quick navigation</li>
                                            <li>• Press <kbd className="px-1 bg-background border border-border rounded text-[10px]">Space</kbd> anywhere to toggle playback</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                    Press <kbd className="px-1.5 py-0.5 bg-background border border-border rounded mx-1">Esc</kbd> to close
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

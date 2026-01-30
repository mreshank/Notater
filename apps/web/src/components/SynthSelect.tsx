"use client";
import { useStore } from "@/lib/store";
import { SynthPreset } from "@/lib/audio/synth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PRESETS: { id: SynthPreset; label: string; color: string }[] = [
    { id: "basic", label: "Basic", color: "bg-blue-500" },
    { id: "bass", label: "Bass", color: "bg-red-500" },
    { id: "lead", label: "Lead", color: "bg-yellow-500" },
    { id: "pad", label: "Pad", color: "bg-purple-500" },
    { id: "pluck", label: "Pluck", color: "bg-green-500" },
    { id: "retro", label: "Retro", color: "bg-orange-500" },
    { id: "bell", label: "Bell", color: "bg-pink-500" },
    { id: "fat", label: "Fat", color: "bg-indigo-500" },
    { id: "dark", label: "Dark", color: "bg-slate-700" },
    { id: "keys", label: "Keys", color: "bg-teal-500" },
    { id: "strings", label: "Strings", color: "bg-rose-500" },
];

export function SynthSelect() {
    const { synthPreset, setSynthPreset } = useStore();
    const [isOpen, setIsOpen] = useState(false);

    const activePreset = PRESETS.find(p => p.id === synthPreset) || PRESETS[0];

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-full transition-colors"
            >
                <div className={`w-3 h-3 rounded-full ${activePreset.color}`}></div>
                <span className="text-xs font-bold uppercase">{activePreset.label}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-48 p-2 bg-surface border border-border rounded-xl shadow-xl z-50 grid grid-cols-1 gap-1"
                        >
                            <div className="px-2 py-1 text-[10px] font-bold opacity-50 uppercase tracking-wider mb-1">
                                Select Preset
                            </div>
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => {
                                        setSynthPreset(preset.id);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                                        ${synthPreset === preset.id ? "bg-background shadow-sm" : "hover:bg-background/50"}
                                    `}
                                >
                                    <div className={`w-2 h-2 rounded-full ${preset.color}`} />
                                    <span className="text-xs font-bold">{preset.label}</span>
                                    {synthPreset === preset.id && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

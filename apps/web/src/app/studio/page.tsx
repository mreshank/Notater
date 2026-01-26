"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { MiniKeyboard } from "@/components/MiniKeyboard";
import { DrumPads } from "@/components/DrumPads";
import { StepSequencer } from "@/components/StepSequencer";
import { ProjectControl } from "@/components/ProjectControl";
import { PianoRoll } from "@/components/PianoRoll";
import { BpmControl } from "@/components/BpmControl";
import { Mixer } from "@/components/Mixer";
import { SynthSelect } from "@/components/SynthSelect";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "keys" | "pads" | "seq" | "piano" | "mix";

import { midiManager } from "@/lib/midi";

export default function StudioPage() {
    const { isPlaying, togglePlay, theme, setTheme } = useStore();
    const [activeView, setActiveView] = useState<ViewMode>("seq");
    const [midiConnected, setMidiConnected] = useState(false);

    // Initialize MIDI
    useEffect(() => {
        midiManager.initialize().then(() => {
            // Simple check if any inputs are present (could be refined)
            // For now, we just initialize it.
            // In a real app we'd sub to state changes to update UI.
            setMidiConnected(true);
        });
    }, []);

    return (
        <div className="h-full w-full flex flex-col bg-background transition-colors duration-500">
            {/* Top Bar / Transport */}
            <header className="h-16 border-b border-foreground/10 glass flex items-center px-4 justify-between shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-xl tracking-tighter cursor-default select-none hidden md:block">
                        NOTATER
                    </div>
                    <ProjectControl />
                    {midiConnected && (
                        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-surface rounded-full border border-border">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-muted-foreground">MIDI ACTIVE</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex gap-2">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={togglePlay}
                            aria-label={isPlaying ? "PAUSE" : "PLAY"}
                            className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isPlaying
                                ? "bg-primary text-primary-foreground ring-2 ring-accent"
                                : "bg-surface text-foreground hover:bg-surface-hover"
                                }`}
                        >
                            {isPlaying ? "⏸" : "▶"}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                if (isPlaying) togglePlay();
                            }}
                            aria-label="STOP"
                            className="h-12 w-12 rounded-full bg-surface hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors border border-border"
                        >
                            ■
                        </motion.button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <BpmControl />
                    <select
                        title="Theme"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as "lofi" | "cyber" | "neo")}
                        className="bg-surface border border-border rounded px-2 py-1 text-xs font-bold"
                    >
                        <option value="lofi">Lo-Fi</option>
                        <option value="cyber">Cyber</option>
                        <option value="neo">Neo</option>
                    </select>
                    <SynthSelect />
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_50%)]" />

                {/* Synth Preset Selector - Removed inline buttons */}


                {/* Instrument View */}
                <div className="flex-1 flex items-center justify-center p-4 z-10 overflow-auto">
                    <AnimatePresence mode="wait">
                        {activeView === "keys" && (
                            <motion.div
                                key="keys"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full max-w-md"
                            >
                                <MiniKeyboard />
                            </motion.div>
                        )}
                        {activeView === "pads" && (
                            <motion.div
                                key="pads"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full max-w-sm"
                            >
                                <DrumPads />
                            </motion.div>
                        )}
                        {activeView === "seq" && (
                            <motion.div
                                key="seq"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full"
                            >
                                <StepSequencer />
                            </motion.div>
                        )}
                        {activeView === "piano" && (
                            <motion.div
                                key="piano"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full"
                            >
                                <PianoRoll />
                            </motion.div>
                        )}
                        {activeView === "mix" && (
                            <motion.div
                                key="mix"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full h-full p-4"
                            >
                                <Mixer />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Bottom Control / Nav */}
            <nav className="h-20 border-t border-foreground/10 glass flex items-center justify-around shrink-0 pb-safe">
                <button
                    onClick={() => setActiveView("seq")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "seq" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <span className="text-2xl">🎼</span>
                    <span className="text-xs font-bold">Seq</span>
                </button>
                <button
                    onClick={() => setActiveView("piano")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "piano" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <span className="text-2xl">🎹</span>
                    <span className="text-xs font-bold">Roll</span>
                </button>
                <button
                    onClick={() => setActiveView("keys")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "keys" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <span className="text-2xl">🎹</span>
                    <span className="text-xs font-bold">Keys</span>
                </button>
                <button
                    onClick={() => setActiveView("pads")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "pads" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <span className="text-2xl">🥁</span>
                    <span className="text-xs font-bold">Pads</span>
                </button>
                <button
                    onClick={() => setActiveView("mix")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "mix" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <span className="text-2xl">🎚</span>
                    <span className="text-xs font-bold">Mix</span>
                </button>
            </nav>
        </div>
    );
}

"use client";
import { useState } from "react";
// import { useStore } from "@/lib/store"; // Removed unused import
import { MiniKeyboard } from "@/components/MiniKeyboard";
import { Drums } from "@/components/Drums";
import { StepSequencer } from "@/components/StepSequencer";
import { PianoRoll } from "@/components/PianoRoll";
import { Mixer } from "@/components/Mixer";
import { StudioHeader } from "@/components/StudioHeader";
import { LooperPanel } from "@/components/LooperPanel";
import { motion, AnimatePresence } from "framer-motion";
import { ListMusic, LayoutGrid, AudioWaveform, Disc, SlidersHorizontal } from "lucide-react";

type ViewMode = "keys" | "drums" | "seq" | "piano" | "mix";

export default function StudioPage() {
    const [activeView, setActiveView] = useState<ViewMode>("seq");
    // const [midiConnected, setMidiConnected] = useState(false); // TODO: Re-integrate MIDI status if needed in header


    return (
        <div className="h-full w-full flex flex-col bg-background transition-colors duration-500">
            {/* Global Studio Header */}
            <StudioHeader />

            <div className="flex-1 flex overflow-hidden relative">
                {/* Main Workspace */}
                <main className="flex-1 relative overflow-hidden flex flex-col min-w-0">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_50%)]" />

                    {/* Instrument View */}
                    <div className="flex-1 flex items-center justify-center p-4 z-10 overflow-auto">
                        <AnimatePresence mode="wait">
                            {activeView === "keys" && (
                                <motion.div
                                    key="keys"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full max-w-3xl"
                                >
                                    <MiniKeyboard />
                                </motion.div>
                            )}
                            {activeView === "drums" && (
                                <motion.div
                                    key="drums"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full max-w-2xl"
                                >
                                    <Drums />
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
                                    className="w-full h-full"
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

                {/* Global Looper Panel */}
                <LooperPanel />
            </div>

            {/* Bottom Control / Nav */}
            <nav className="h-20 border-t border-foreground/10 glass flex items-center justify-around shrink-0 pb-safe z-40 bg-background/80 backdrop-blur-md">
                <button
                    onClick={() => setActiveView("seq")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "seq" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <ListMusic size={24} />
                    <span className="text-xs font-bold">Seq</span>
                </button>
                <button
                    onClick={() => setActiveView("piano")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "piano" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <LayoutGrid size={24} />
                    <span className="text-xs font-bold">Roll</span>
                </button>
                <button
                    onClick={() => setActiveView("keys")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "keys" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <AudioWaveform size={24} />
                    <span className="text-xs font-bold">Keys</span>
                </button>
                <button
                    onClick={() => setActiveView("drums")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "drums" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <Disc size={24} />
                    <span className="text-xs font-bold">Drums</span>
                </button>
                <button
                    onClick={() => setActiveView("mix")}
                    className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeView === "mix" ? "opacity-100 text-primary" : "opacity-50 hover:opacity-100"
                        }`}
                >
                    <SlidersHorizontal size={24} className="rotate-90" />
                    <span className="text-xs font-bold">Mix</span>
                </button>
            </nav>
        </div>
    );
}

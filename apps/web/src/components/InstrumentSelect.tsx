"use client";
import { useStore } from "@/lib/store";
import { SynthPreset } from "@/lib/audio/synth";
import { DRUM_KITS } from "@/lib/audio/drums";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Piano, Drum } from "lucide-react";

// Synth Presets (Moved here or duplicated from SynthSelect for now, better to import if strictly typed but list was local)
const SYNTH_PRESETS: { id: SynthPreset; label: string; color: string }[] = [
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

export function InstrumentSelect() {
    const {
        pianoRollInstrument,
        setPianoRollInstrument,
        synthPreset,
        setSynthPreset,
        activeDrumKit,
        setActiveDrumKit
    } = useStore();

    const [isOpen, setIsOpen] = useState(false);

    // Derived display values
    const isSynth = pianoRollInstrument === "synth";
    const currentLabel = isSynth
        ? SYNTH_PRESETS.find(p => p.id === synthPreset)?.label
        : DRUM_KITS.find(k => k.id === activeDrumKit)?.name;

    const currentColor = isSynth
        ? SYNTH_PRESETS.find(p => p.id === synthPreset)?.color
        : "bg-orange-600"; // Drum default color

    return (
        <div className="relative z-50">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-surface hover:bg-surface-hover/50 rounded transition-colors pr-2"
                title="Select Instrument"
                aria-label="Select Instrument"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <div className={`p-1 rounded ${isSynth ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {isSynth ? <Piano size={14} /> : <Drum size={14} />}
                </div>

                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${currentColor}`}></div>
                    <span className="text-xs font-bold uppercase">{currentLabel}</span>
                </div>
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
                            className="absolute right-0 top-full mt-2 w-56 p-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 flex flex-col gap-2 max-h-[80vh] overflow-y-auto custom-scrollbar"
                        >
                            {/* Instrument Type Switch */}
                            <div className="flex p-1 bg-zinc-900 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setPianoRollInstrument("synth")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${isSynth ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                >
                                    <Piano size={12} /> Synth
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPianoRollInstrument("drums")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${!isSynth ? "bg-orange-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                >
                                    <Drum size={12} /> Drums
                                </button>
                            </div>

                            <div className="w-full h-px bg-zinc-800/50" />

                            {/* Preset List */}
                            <div className="px-2 py-1 text-[10px] font-bold opacity-50 uppercase tracking-wider">
                                {isSynth ? "Synth Presets" : "Drum Kits"}
                            </div>

                            <div className="flex flex-col gap-0.5">
                                {isSynth ? (
                                    SYNTH_PRESETS.map((preset) => (
                                        <button
                                            type="button"
                                            key={preset.id}
                                            onClick={() => {
                                                setSynthPreset(preset.id);
                                                setIsOpen(false);
                                            }}
                                            className={`
                                                flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                                                ${synthPreset === preset.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}
                                            `}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${preset.color}`} />
                                            <span className="text-xs font-bold">{preset.label}</span>
                                            {synthPreset === preset.id && (
                                                <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    DRUM_KITS.map((kit) => (
                                        <button
                                            type="button"
                                            key={kit.id}
                                            onClick={() => {
                                                setActiveDrumKit(kit.id);
                                                setIsOpen(false);
                                            }}
                                            className={`
                                                flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                                                ${activeDrumKit === kit.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}
                                            `}
                                        >
                                            <div className={`w-2 h-2 rounded-full bg-orange-500`} />
                                            <span className="text-xs font-bold">{kit.name} Kit</span>
                                            {activeDrumKit === kit.id && (
                                                <div className="ml-auto w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

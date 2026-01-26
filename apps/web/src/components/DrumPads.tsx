"use client";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

const PADS = [
    { id: 1, note: "C2", label: "KICK" },
    { id: 2, note: "D2", label: "SNARE" },
    { id: 3, note: "F#2", label: "HI-HAT" },
    { id: 4, note: "A#2", label: "CLAP" },
    { id: 5, note: "C3", label: "TOM 1" },
    { id: 6, note: "D3", label: "TOM 2" },
    { id: 7, note: "E3", label: "PERC" },
    { id: 8, note: "F3", label: "FX" },
];

export function DrumPads() {
    const { playNote, isAudioInitialized, initializeAudio } = useStore();

    const handlePadHit = async (note: string) => {
        if (!isAudioInitialized) {
            await initializeAudio();
        }
        playNote(note, "16n");
    };

    return (
        <div className="grid grid-cols-4 gap-2 p-2">
            {PADS.map((pad) => (
                <motion.button
                    key={pad.id}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    onPointerDown={() => handlePadHit(pad.note)}
                    className="aspect-square bg-surface hover:bg-surface-hover border border-border rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg active:shadow-inner transition-all select-none"
                >
                    <span className="text-2xl">
                        {pad.id <= 4 ? "🥁" : "🎵"}
                    </span>
                    <span className="text-xs font-bold opacity-60">{pad.label}</span>
                </motion.button>
            ))}
        </div>
    );
}

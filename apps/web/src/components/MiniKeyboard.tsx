"use client";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

const KEYS = [
    { note: "C4", label: "C", isBlack: false },
    { note: "C#4", label: "C#", isBlack: true },
    { note: "D4", label: "D", isBlack: false },
    { note: "D#4", label: "D#", isBlack: true },
    { note: "E4", label: "E", isBlack: false },
    { note: "F4", label: "F", isBlack: false },
    { note: "F#4", label: "F#", isBlack: true },
    { note: "G4", label: "G", isBlack: false },
    { note: "G#4", label: "G#", isBlack: true },
    { note: "A4", label: "A", isBlack: false },
    { note: "A#4", label: "A#", isBlack: true },
    { note: "B4", label: "B", isBlack: false },
    { note: "C5", label: "C", isBlack: false },
];

export function MiniKeyboard() {
    const { playNote, isAudioInitialized, initializeAudio } = useStore();

    const handleKeyPress = async (note: string) => {
        if (!isAudioInitialized) {
            await initializeAudio();
        }
        playNote(note, "8n");
    };

    return (
        <div className="flex h-32 relative select-none">
            {/* White keys */}
            {KEYS.filter((k) => !k.isBlack).map((key, i) => (
                <motion.button
                    key={key.note}
                    whileTap={{ scale: 0.95, backgroundColor: "var(--primary)" }}
                    onPointerDown={() => handleKeyPress(key.note)}
                    className="flex-1 bg-white border border-border rounded-b-lg shadow-lg flex items-end justify-center pb-2 text-xs font-bold text-black/50 hover:bg-surface transition-colors"
                >
                    {key.label}
                </motion.button>
            ))}

            {/* Black keys (absolute positioned) */}
            <div className="absolute top-0 left-0 right-0 flex pointer-events-none">
                {KEYS.map((key, i) => {
                    if (!key.isBlack) return null;
                    // Calculate position based on white key index
                    const whiteKeysBefore = KEYS.slice(0, i).filter((k) => !k.isBlack).length;
                    const leftPercent = ((whiteKeysBefore + 0.65) / 8) * 100;

                    return (
                        <motion.button
                            key={key.note}
                            whileTap={{ scale: 0.95, backgroundColor: "var(--primary)" }}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                handleKeyPress(key.note);
                            }}
                            className="absolute h-20 w-[8%] bg-foreground rounded-b-md shadow-xl pointer-events-auto hover:bg-foreground/80 transition-colors"
                            style={{ left: `${leftPercent}%` }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

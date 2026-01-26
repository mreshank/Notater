"use client";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

export function BpmControl() {
    const { project, setBpm, isAudioInitialized, initializeAudio } = useStore();

    const handleBpmChange = async (value: number) => {
        if (!isAudioInitialized) {
            await initializeAudio();
        }
        setBpm(value);
    };

    const increment = () => handleBpmChange(Math.min(project.bpm + 5, 300));
    const decrement = () => handleBpmChange(Math.max(project.bpm - 5, 15));

    return (
        <div className="flex items-center gap-2">
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={decrement}
                className="h-8 w-8 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-lg font-bold border border-border"
            >
                −
            </motion.button>

            <div className="flex flex-col items-center min-w-[60px]">
                <span className="font-mono text-lg font-bold">{project.bpm}</span>
                <span className="text-[10px] uppercase opacity-50">BPM</span>
            </div>

            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={increment}
                className="h-8 w-8 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center text-lg font-bold border border-border"
            >
                +
            </motion.button>
        </div>
    );
}

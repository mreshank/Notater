"use client";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

const ROWS = [
    { id: "kick", label: "KICK", note: "C2", color: "bg-primary" },
    { id: "snare", label: "SNARE", note: "D2", color: "bg-secondary" },
    { id: "hihat", label: "HI-HAT", note: "F#2", color: "bg-accent" },
    { id: "clap", label: "CLAP", note: "D#2", color: "bg-destructive" },
];

const STEPS = 16;

export function StepSequencer() {
    const {
        playTrack,
        playNote,
        isPlaying,
        isAudioInitialized,
        initializeAudio,
        project,
        sequencerGrid: grid,
        toggleSequencerStep,
        setSequencerGrid
    } = useStore();

    const [currentStep, setCurrentStep] = useState(0);
    const currentStepRef = useRef(currentStep);

    // Keep ref in sync with state
    useEffect(() => {
        currentStepRef.current = currentStep;
    }, [currentStep]);

    // Playback engine
    useEffect(() => {
        if (!isPlaying) {
            const timeout = setTimeout(() => setCurrentStep(0), 0);
            return () => clearTimeout(timeout);
        }

        const stepDuration = (60 / project.bpm / 4) * 1000;
        let step = currentStepRef.current;

        const interval = setInterval(() => {
            step = (step + 1) % STEPS;
            setCurrentStep(step);
            ROWS.forEach((row) => {
                if (grid[row.id][step]) {
                    playTrack(row.id);
                }
            });
        }, stepDuration);

        return () => clearInterval(interval);
    }, [isPlaying, project.bpm, grid, playTrack]);

    const handleStepClick = async (rowId: string, stepIndex: number) => {
        if (!isAudioInitialized) {
            await initializeAudio();
        }
        toggleSequencerStep(rowId, stepIndex);

        // Preview sound if turning on
        if (!grid[rowId][stepIndex]) {
            const row = ROWS.find((r) => r.id === rowId);
            if (row) {
                playTrack(row.id);
            }
        }
    };

    const clearGrid = () => {
        const newGrid: Record<string, boolean[]> = {};
        ROWS.forEach(row => newGrid[row.id] = Array(STEPS).fill(false));
        setSequencerGrid(newGrid);
    };

    const randomize = () => {
        const newGrid: Record<string, boolean[]> = {};
        ROWS.forEach((row, rowIndex) => {
            newGrid[row.id] = Array.from({ length: STEPS }, (_, i) => {
                if (rowIndex === 0) return i % 4 === 0 && Math.random() > 0.2;
                if (rowIndex === 1) return (i === 4 || i === 12) && Math.random() > 0.3;
                return Math.random() > 0.75;
            });
        });
        setSequencerGrid(newGrid);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            {/* Step indicators */}
            <div className="flex gap-1 mb-2 ml-16">
                {Array.from({ length: STEPS }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-1 rounded-full transition-all ${currentStep === i && isPlaying
                            ? "bg-primary scale-y-150"
                            : i % 4 === 0
                                ? "bg-foreground/30"
                                : "bg-foreground/10"
                            }`}
                    />
                ))}
            </div>

            {/* Grid */}
            <div className="space-y-1">
                {ROWS.map((row) => (
                    <div key={row.id} className="flex items-center gap-2">
                        <div className="w-14 text-xs font-bold text-foreground/60 select-none">
                            {row.label}
                        </div>
                        <div className="flex gap-1 flex-1">
                            {grid[row.id].map((isActive, stepIndex) => (
                                <motion.button
                                    key={stepIndex}
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => handleStepClick(row.id, stepIndex)}
                                    className={`
                                        flex-1 aspect-square rounded-md transition-all
                                        ${stepIndex % 4 === 0 ? "ring-1 ring-foreground/10" : ""}
                                        ${isActive ? `${row.color} shadow-lg` : "bg-surface hover:bg-surface-hover"}
                                        ${currentStep === stepIndex && isPlaying ? "ring-2 ring-accent scale-105" : ""}
                                    `}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-2 mt-4">
                <button
                    onClick={clearGrid}
                    className="px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg text-xs font-bold transition-colors"
                >
                    CLEAR
                </button>
                <button
                    onClick={randomize}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                >
                    RANDOMIZE
                </button>
            </div>
        </div>
    );
}

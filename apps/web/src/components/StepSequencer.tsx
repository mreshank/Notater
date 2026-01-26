"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

const ROWS = [
    { id: "kick", label: "KICK", color: "#ec4899" },
    { id: "snare", label: "SNARE", color: "#3b82f6" },
    { id: "hihat", label: "HI-HAT", color: "#fbbf24" },
    { id: "clap", label: "CLAP", color: "#f97316" },
];

const STEPS = 16;

// Preset patterns
const PRESETS = {
    "4/4 Basic": {
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        clap: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
    },
    "Trap": {
        kick: [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap: [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true],
    },
    "House": {
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        clap: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    },
    "Breakbeat": {
        kick: [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, true, false, true, false, false, false],
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        clap: [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
    },
};

type PresetName = keyof typeof PRESETS;

export function StepSequencer() {
    const {
        playTrack,
        isPlaying,
        isAudioInitialized,
        initializeAudio,
        currentStep: globalStep,
        sequencerGrid: grid,
        toggleSequencerStep,
        setSequencerGrid
    } = useStore();

    const [selectedPreset, setSelectedPreset] = useState<PresetName | null>(null);
    const currentStep = globalStep !== undefined ? globalStep % STEPS : 0;

    // Play on step
    useEffect(() => {
        if (!isPlaying) return;

        ROWS.forEach((row) => {
            if (grid[row.id]?.[currentStep]) {
                playTrack(row.id);
            }
        });
    }, [currentStep, isPlaying, grid, playTrack]);

    const handleStepClick = async (rowId: string, stepIndex: number) => {
        if (!isAudioInitialized) await initializeAudio();
        toggleSequencerStep(rowId, stepIndex);
        if (!grid[rowId][stepIndex]) {
            playTrack(rowId);
        }
    };

    const clearGrid = () => {
        const newGrid: Record<string, boolean[]> = {};
        ROWS.forEach(row => newGrid[row.id] = Array(STEPS).fill(false));
        setSequencerGrid(newGrid);
        setSelectedPreset(null);
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
        setSelectedPreset(null);
    };

    const loadPreset = (name: PresetName) => {
        setSequencerGrid(PRESETS[name]);
        setSelectedPreset(name);
    };

    const fillRow = (rowId: string) => {
        const newGrid = { ...grid };
        newGrid[rowId] = Array(STEPS).fill(true);
        setSequencerGrid(newGrid);
    };

    const clearRow = (rowId: string) => {
        const newGrid = { ...grid };
        newGrid[rowId] = Array(STEPS).fill(false);
        setSequencerGrid(newGrid);
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-4">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                {/* Presets */}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] opacity-50 mr-1">Preset:</span>
                    {(Object.keys(PRESETS) as PresetName[]).map(name => (
                        <button
                            key={name}
                            onClick={() => loadPreset(name)}
                            className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${selectedPreset === name
                                ? "bg-primary text-primary-foreground"
                                : "bg-surface border border-border hover:bg-surface-hover"
                                }`}
                        >
                            {name}
                        </button>
                    ))}
                </div>

                {/* Step indicator */}
                <span className="text-xs opacity-50 font-mono">
                    Step {currentStep + 1}/{STEPS}
                </span>
            </div>

            {/* Step indicators */}
            <div className="flex gap-1 mb-2 ml-20">
                {Array.from({ length: STEPS }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full transition-all ${currentStep === i && isPlaying
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
                    <div key={row.id} className="flex items-center gap-2 group">
                        {/* Row label with controls */}
                        <div className="w-20 flex items-center gap-1">
                            <span className="text-xs font-bold" style={{ color: row.color }}>
                                {row.label}
                            </span>
                            <div className="hidden group-hover:flex gap-0.5">
                                <button
                                    onClick={() => fillRow(row.id)}
                                    className="w-4 h-4 text-[8px] bg-primary/20 hover:bg-primary/40 rounded"
                                    title="Fill row"
                                >
                                    +
                                </button>
                                <button
                                    onClick={() => clearRow(row.id)}
                                    className="w-4 h-4 text-[8px] bg-destructive/20 hover:bg-destructive/40 rounded"
                                    title="Clear row"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="flex gap-0.5 flex-1">
                            {grid[row.id]?.map((isActive, stepIndex) => (
                                <motion.button
                                    key={stepIndex}
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => handleStepClick(row.id, stepIndex)}
                                    className={`flex-1 aspect-square rounded-md transition-all border ${stepIndex % 4 === 0 ? "border-foreground/20" : "border-transparent"
                                        } ${currentStep === stepIndex && isPlaying ? "ring-2 ring-accent scale-105" : ""}`}
                                    style={{
                                        backgroundColor: isActive ? row.color : 'var(--surface)',
                                        boxShadow: isActive ? `0 2px 8px ${row.color}50` : 'none',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom controls */}
            <div className="flex justify-center gap-2 mt-4">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={clearGrid}
                    className="px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg text-xs font-bold transition-colors"
                >
                    CLEAR
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={randomize}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                >
                    RANDOMIZE
                </motion.button>
            </div>

            {/* Help */}
            <div className="text-[10px] opacity-40 text-center mt-3">
                Click steps to toggle • Hover row labels for fill/clear
            </div>
        </div>
    );
}

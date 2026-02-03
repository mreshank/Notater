"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { playDrum, DrumType, DRUM_TYPES } from "@notater/core";
// import { useToast } from "./ui/ToastProvider";

// Simple drum labels
const DRUM_INFO: Record<DrumType, { label: string; colorClass: string; shadowClass: string }> = {
    kick: { label: "KICK", colorClass: "bg-pink-500", shadowClass: "shadow-pink-500/50" },
    snare: { label: "SNR", colorClass: "bg-blue-500", shadowClass: "shadow-blue-500/50" },
    hihat: { label: "HH", colorClass: "bg-amber-400", shadowClass: "shadow-amber-400/50" },
    hihatOpen: { label: "OH", colorClass: "bg-amber-500", shadowClass: "shadow-amber-500/50" },
    clap: { label: "CLAP", colorClass: "bg-orange-500", shadowClass: "shadow-orange-500/50" },
    tom1: { label: "T1", colorClass: "bg-violet-500", shadowClass: "shadow-violet-500/50" },
    tom2: { label: "T2", colorClass: "bg-purple-500", shadowClass: "shadow-purple-500/50" },
    crash: { label: "CRS", colorClass: "bg-red-500", shadowClass: "shadow-red-500/50" },
    ride: { label: "RDE", colorClass: "bg-teal-500", shadowClass: "shadow-teal-500/50" },
};

const STEPS = 16;

export type DrumPattern = {
    id: string;
    name: string;
    grid: Record<DrumType, boolean[]>;
};

function createEmptyGrid(): Record<DrumType, boolean[]> {
    return DRUM_TYPES.reduce((acc, type) => {
        acc[type] = Array(STEPS).fill(false);
        return acc;
    }, {} as Record<DrumType, boolean[]>);
}

export function DrumRoll() {
    const { isPlaying, currentStep, isAudioInitialized, initializeAudio } = useStore();
    const [grid, setGrid] = useState<Record<DrumType, boolean[]>>(createEmptyGrid);
    const [patterns, setPatterns] = useState<DrumPattern[]>([]);
    const [currentPattern, setCurrentPattern] = useState<string | null>(null);
    const [patternName, setPatternName] = useState("");
    const lastPlayedStep = useRef<number>(-1);
    // const { success, error } = useToast();

    // Toggle step
    const toggleStep = (drum: DrumType, step: number) => {
        setGrid(prev => ({
            ...prev,
            [drum]: prev[drum].map((v, i) => i === step ? !v : v)
        }));
    };

    // Play drums on step
    useEffect(() => {
        if (!isPlaying) {
            lastPlayedStep.current = -1;
            return;
        }

        const stepIndex = currentStep % STEPS;
        if (stepIndex === lastPlayedStep.current) return;
        lastPlayedStep.current = stepIndex;

        DRUM_TYPES.forEach(async (drum) => {
            if (grid[drum][stepIndex]) {
                if (!isAudioInitialized) await initializeAudio();
                playDrum(drum);
            }
        });
    }, [isPlaying, currentStep, grid, isAudioInitialized, initializeAudio]);

    // Save pattern
    const savePattern = () => {
        if (!patternName.trim()) return;
        const newPattern: DrumPattern = {
            id: Date.now().toString(),
            name: patternName,
            grid: JSON.parse(JSON.stringify(grid))
        };
        setPatterns(prev => [...prev, newPattern]);
        setCurrentPattern(newPattern.id);
        setPatternName("");
    };

    // Load pattern
    const loadPattern = (id: string) => {
        const pattern = patterns.find(p => p.id === id);
        if (pattern) {
            setGrid(JSON.parse(JSON.stringify(pattern.grid)));
            setCurrentPattern(id);
        }
    };

    // Delete pattern
    const deletePattern = (id: string) => {
        setPatterns(prev => prev.filter(p => p.id !== id));
        if (currentPattern === id) setCurrentPattern(null);
    };

    // Clear
    const clearGrid = () => {
        setGrid(createEmptyGrid());
        setCurrentPattern(null);
    };

    const playheadPos = currentStep % STEPS;

    return (
        <div className="w-full flex flex-col gap-3 max-w-3xl mx-auto">
            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
                <input
                    type="text"
                    placeholder="Pattern name"
                    value={patternName}
                    onChange={(e) => setPatternName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && savePattern()}
                    className="px-2 py-1 text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary w-28"
                />
                <button
                    onClick={savePattern}
                    disabled={!patternName.trim()}
                    className="px-2 py-1 text-xs font-bold bg-primary text-primary-foreground rounded disabled:opacity-50"
                >
                    Save
                </button>
                <button
                    onClick={clearGrid}
                    className="px-2 py-1 text-xs font-bold text-destructive border border-destructive/30 rounded hover:bg-destructive/10"
                >
                    Clear
                </button>

                <div className="flex-1" />
                <span className="text-xs opacity-50 font-mono">
                    Step {playheadPos + 1}/{STEPS}
                </span>
            </div>

            {/* Grid */}
            <div className="bg-surface/30 rounded-lg border border-border p-2 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="w-12 text-left text-[10px] opacity-50 font-normal pb-1">DRUM</th>
                            {Array.from({ length: STEPS }).map((_, i) => (
                                <th
                                    key={i}
                                    className={`w-6 text-center text-[9px] font-mono pb-1 ${i % 4 === 0 ? 'opacity-80' : 'opacity-30'
                                        } ${playheadPos === i && isPlaying ? 'text-accent font-bold' : ''}`}
                                >
                                    {i + 1}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DRUM_TYPES.map((drum) => (
                            <tr key={drum} className="group">
                                <td className="pr-2 py-0.5">
                                    <span
                                        className={`text-[10px] font-bold ${DRUM_INFO[drum].colorClass.replace('bg-', 'text-')}`}
                                    >
                                        {DRUM_INFO[drum].label}
                                    </span>
                                </td>
                                {Array.from({ length: STEPS }).map((_, step) => {
                                    const isActive = grid[drum][step];
                                    const isPlayhead = playheadPos === step && isPlaying;

                                    return (
                                        <td key={step} className="p-0.5">
                                            <motion.button
                                                whileTap={{ scale: 0.8 }}
                                                onClick={() => toggleStep(drum, step)}
                                                className={`w-5 h-5 rounded-sm transition-all duration-200 ${step % 4 === 0 ? 'border-l border-border/30' : ''} ${isActive
                                                    ? `${DRUM_INFO[drum].colorClass} ${DRUM_INFO[drum].shadowClass} shadow-[0_0_6px]`
                                                    : 'bg-surface'
                                                    } ${isPlayhead ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''}`}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Saved Patterns */}
            {patterns.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {patterns.map(p => (
                        <div
                            key={p.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${currentPattern === p.id
                                ? 'bg-primary/20 border-primary'
                                : 'bg-surface border-border'
                                }`}
                        >
                            <button onClick={() => loadPattern(p.id)} className="font-bold">
                                {p.name}
                            </button>
                            <button
                                onClick={() => deletePattern(p.id)}
                                className="opacity-50 hover:opacity-100 hover:text-destructive"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

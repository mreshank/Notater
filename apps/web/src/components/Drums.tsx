"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playDrum, DrumType, DRUM_TYPES, setDrumKit, DrumKit, DRUM_KITS } from "@/lib/audio/drums";
import { useStore } from "@/lib/store";
import { LucideIcon, Circle, Triangle, Square, Hexagon, Octagon, Star, Disc, Zap, Save, Trash2, X } from "lucide-react";

type DrumMode = "pad" | "set" | "roll";

// Pattern type
type DrumPattern = {
    id: string;
    name: string;
    grid: Record<DrumType, boolean[]>;
};

// Keyboard mapping
const KEY_MAP: Record<string, DrumType> = {
    'a': 'kick', 's': 'snare', 'd': 'hihat', 'f': 'hihatOpen',
    'g': 'clap', 'h': 'tom1', 'j': 'tom2', 'k': 'crash', 'l': 'ride',
};

// Drum kit layout
const SET_LAYOUT: Record<DrumType, { x: number; y: number; size: number; label: string; color: string; key: string }> = {
    hihat: { x: 8, y: 35, size: 14, label: "HH", color: "#fbbf24", key: "D" },
    hihatOpen: { x: 8, y: 60, size: 12, label: "OH", color: "#f59e0b", key: "F" },
    crash: { x: 20, y: 15, size: 18, label: "CRASH", color: "#ef4444", key: "K" },
    tom1: { x: 38, y: 28, size: 16, label: "T1", color: "#8b5cf6", key: "H" },
    snare: { x: 30, y: 55, size: 18, label: "SNR", color: "#3b82f6", key: "S" },
    tom2: { x: 55, y: 28, size: 16, label: "T2", color: "#a855f7", key: "J" },
    kick: { x: 50, y: 72, size: 24, label: "KICK", color: "#ec4899", key: "A" },
    ride: { x: 78, y: 18, size: 17, label: "RIDE", color: "#14b8a6", key: "L" },
    clap: { x: 70, y: 55, size: 14, label: "CLAP", color: "#f97316", key: "G" },
};

// Pad config
const PAD_CONFIG: { type: DrumType; label: string; icon: LucideIcon; color: string; key: string }[] = [
    { type: "kick", label: "KICK", icon: Circle, color: "#ec4899", key: "A" },
    { type: "snare", label: "SNARE", icon: Triangle, color: "#3b82f6", key: "S" },
    { type: "hihat", label: "HI-HAT", icon: Hexagon, color: "#fbbf24", key: "D" },
    { type: "hihatOpen", label: "OPEN HH", icon: Octagon, color: "#f59e0b", key: "F" },
    { type: "clap", label: "CLAP", icon: Zap, color: "#f97316", key: "G" },
    { type: "tom1", label: "TOM 1", icon: Square, color: "#8b5cf6", key: "H" },
    { type: "tom2", label: "TOM 2", icon: Square, color: "#a855f7", key: "J" },
    { type: "crash", label: "CRASH", icon: Star, color: "#ef4444", key: "K" },
    { type: "ride", label: "RIDE", icon: Disc, color: "#14b8a6", key: "L" },
];

// Roll grid colors
const DRUM_INFO: Record<DrumType, { label: string; label_short: string; color: string }> = {
    kick: { label: "Kick", label_short: "KICK", color: "#ec4899" },
    snare: { label: "Snare", label_short: "SNR", color: "#3b82f6" },
    hihat: { label: "Hi-Hat", label_short: "HH", color: "#fbbf24" },
    hihatOpen: { label: "Hi-Hat (O)", label_short: "OH", color: "#f59e0b" },
    clap: { label: "Clap", label_short: "CLAP", color: "#f97316" },
    tom1: { label: "Tom 1", label_short: "T1", color: "#8b5cf6" },
    tom2: { label: "Tom 2", label_short: "T2", color: "#a855f7" },
    crash: { label: "Crash", label_short: "CRS", color: "#ef4444" },
    ride: { label: "Ride", label_short: "RDE", color: "#14b8a6" },
};

const STEPS = 16;

function createEmptyGrid(): Record<DrumType, boolean[]> {
    return DRUM_TYPES.reduce((acc, type) => {
        acc[type] = Array(STEPS).fill(false);
        return acc;
    }, {} as Record<DrumType, boolean[]>);
}

export function Drums() {
    const [mode, setMode] = useState<DrumMode>("roll");
    const [hitDrum, setHitDrum] = useState<DrumType | null>(null);
    const [currentKit, setCurrentKit] = useState<DrumKit>("standard");
    const { isAudioInitialized, initializeAudio, isPlaying, currentStep } = useStore();

    // Roll grid & Pattern state
    const [grid, setGrid] = useState<Record<DrumType, boolean[]>>(createEmptyGrid);
    const [patterns, setPatterns] = useState<DrumPattern[]>([]);
    const [patternName, setPatternName] = useState("");
    const [currentPatternId, setCurrentPatternId] = useState<string | null>(null);
    const lastPlayedStep = useRef<number>(-1);

    // Save Pattern
    const savePattern = () => {
        if (!patternName.trim()) return;
        const newPattern: DrumPattern = {
            id: Date.now().toString(),
            name: patternName,
            grid: JSON.parse(JSON.stringify(grid))
        };
        setPatterns(prev => [...prev, newPattern]);
        setCurrentPatternId(newPattern.id);
        setPatternName("");
    };

    // Load Pattern
    const loadPattern = (id: string) => {
        const p = patterns.find(pat => pat.id === id);
        if (p) {
            setGrid(JSON.parse(JSON.stringify(p.grid)));
            setCurrentPatternId(id);
        }
    };

    // Delete Pattern
    const deletePattern = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPatterns(prev => prev.filter(p => p.id !== id));
        if (currentPatternId === id) setCurrentPatternId(null);
    };

    // Main hit handler
    const handleHit = useCallback(async (type: DrumType) => {
        if (!isAudioInitialized) await initializeAudio();
        playDrum(type);
        setHitDrum(type);
        setTimeout(() => setHitDrum(null), 150);
    }, [isAudioInitialized, initializeAudio]);

    // Keyboard listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const drumType = KEY_MAP[e.key.toLowerCase()];
            if (drumType) {
                e.preventDefault();
                handleHit(drumType);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleHit]);

    // Roll playback
    useEffect(() => {
        if (!isPlaying || mode !== "roll") {
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
    }, [isPlaying, currentStep, grid, isAudioInitialized, initializeAudio, mode]);

    const handleKitChange = (kit: DrumKit) => {
        setCurrentKit(kit);
        setDrumKit(kit);
    };

    const toggleStep = (drum: DrumType, step: number) => {
        setGrid(prev => ({
            ...prev,
            [drum]: prev[drum].map((v, i) => i === step ? !v : v)
        }));
    };

    const clearGrid = () => {
        setGrid(createEmptyGrid());
        setCurrentPatternId(null);
    };

    const playheadPos = currentStep % STEPS;

    return (
        <div className="relative w-full">
            {/* Top Controls */}
            <div className="flex items-center justify-between mb-2 px-1 flex-wrap gap-2">
                {/* Kit Selector */}
                <div className="flex items-center gap-1">
                    <span className="text-[10px] opacity-50 font-bold">KIT:</span>
                    <div className="flex gap-0.5 bg-surface rounded-full p-0.5 border border-border">
                        {DRUM_KITS.map(kit => (
                            <button
                                key={kit.id}
                                onClick={() => handleKitChange(kit.id)}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded-full transition-all ${currentKit === kit.id ? "bg-primary text-primary-foreground" : "opacity-60 hover:opacity-100"
                                    }`}
                            >
                                {kit.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-0.5 bg-surface/80 backdrop-blur rounded-full p-0.5 border border-border text-[10px]">
                    {[
                        { id: "pad" as DrumMode, label: "PADS" },
                        { id: "set" as DrumMode, label: "KIT" },
                        { id: "roll" as DrumMode, label: "ROLL" },
                    ].map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`px-3 py-1 rounded-full font-bold transition-all ${mode === m.id ? "bg-primary text-primary-foreground" : "opacity-60 hover:opacity-100"
                                }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* PAD MODE */}
                {mode === "pad" && (
                    <motion.div
                        key="pad"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="grid grid-cols-3 gap-2 p-2 max-w-xs mx-auto"
                    >
                        {PAD_CONFIG.map((pad) => (
                            <motion.button
                                key={pad.type}
                                whileTap={{ scale: 0.85 }}
                                whileHover={{ scale: 1.05 }}
                                onPointerDown={() => handleHit(pad.type)}
                                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 shadow-lg transition-all select-none border-2 relative bg-surface border-border overflow-hidden"
                                style={{
                                    borderColor: hitDrum === pad.type ? pad.color : 'var(--border)',
                                    boxShadow: hitDrum === pad.type ? `0 0 20px ${pad.color}` : undefined,
                                }}
                            >
                                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: pad.color }} />
                                <pad.icon
                                    size={32}
                                    style={{
                                        color: pad.color,
                                        fill: hitDrum === pad.type ? pad.color : 'transparent',
                                        strokeWidth: 1.5
                                    }}
                                />
                                <span className="text-[9px] font-bold opacity-80 mt-1">{pad.label}</span>
                                <span className="absolute bottom-1 right-1 text-[8px] opacity-40 font-mono">{pad.key}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                )}

                {/* KIT MODE */}
                {mode === "set" && (
                    <motion.div
                        key="set"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="relative w-full"
                    >
                        <div className="relative w-full aspect-2/1 min-h-48 max-h-80 bg-linear-to-b from-surface/30 to-background rounded-xl border border-border overflow-hidden">
                            <div className="absolute bottom-0 left-0 right-0 h-3 bg-linear-to-t from-border/30 to-transparent" />
                            {DRUM_TYPES.map((type) => {
                                const pos = SET_LAYOUT[type];
                                const isHit = hitDrum === type;
                                return (
                                    <motion.button
                                        key={type}
                                        onClick={() => handleHit(type)}
                                        animate={{ scale: isHit ? 1.2 : 1 }}
                                        transition={{ duration: 0.08 }}
                                        className="absolute rounded-full flex flex-col items-center justify-center font-bold text-white cursor-pointer border-2 border-white/20"
                                        style={{
                                            left: `${pos.x}%`,
                                            top: `${pos.y - 12}%`,
                                            width: `${pos.size}%`,
                                            aspectRatio: '1',
                                            transform: 'translate(-50%, -50%)',
                                            backgroundColor: isHit ? pos.color : `${pos.color}99`,
                                            boxShadow: isHit ? `0 0 30px ${pos.color}` : '0 4px 6px rgba(0,0,0,0.3)',
                                            fontSize: 'clamp(8px, 1.5vw, 11px)',
                                        }}
                                    >
                                        <span>{pos.label}</span>
                                        <span className="text-[7px] opacity-50">{pos.key}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ROLL MODE - NEW! */}
                {mode === "roll" && (
                    <motion.div
                        key="roll"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full "
                    >

                        {/* Pattern Controls */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <input
                                type="text"
                                value={patternName}
                                onChange={(e) => setPatternName(e.target.value)}
                                placeholder="New pattern..."
                                className="text-[10px] bg-surface border border-border rounded px-2 py-1 w-24 focus:outline-none focus:border-primary"
                            />
                            <button
                                onClick={savePattern}
                                disabled={!patternName.trim()}
                                className="px-2 py-1 text-[10px] font-bold bg-primary text-primary-foreground rounded disabled:opacity-50 flex items-center gap-1"
                            >
                                <Save size={12} /> Save
                            </button>
                            <button
                                onClick={clearGrid}
                                className="px-2 py-1 text-[10px] font-bold text-destructive border border-destructive/30 rounded hover:bg-destructive/10 flex items-center gap-1"
                            >
                                <Trash2 size={12} /> Clear
                            </button>
                            <span className="text-xs opacity-50 font-mono ml-auto">
                                Step {playheadPos + 1}/{STEPS}
                            </span>
                        </div>

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
                                        <tr key={drum}>
                                            <td className="pr-2 py-0.5">
                                                <span className="text-[10px] font-bold" style={{ color: DRUM_INFO[drum].color }}>
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
                                                            className={`w-5 h-5 rounded-sm transition-colors ${step % 4 === 0 ? 'border-l border-border/30' : ''}`}
                                                            style={{
                                                                backgroundColor: isActive ? DRUM_INFO[drum].color : 'var(--surface)',
                                                                boxShadow: isActive ? `0 0 6px ${DRUM_INFO[drum].color}50` : 'none',
                                                                outline: isPlayhead ? '2px solid var(--accent)' : 'none',
                                                                outlineOffset: '-1px',
                                                            }}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="text-[9px] opacity-40 text-center mt-2">
                            Press A-L to play drums
                        </div>

                        {/* Saved Patterns List */}
                        {patterns.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {patterns.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => loadPattern(p.id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded border cursor-pointer hover:bg-surface-hover ${currentPatternId === p.id
                                            ? "bg-primary/20 border-primary"
                                            : "bg-surface border-border"
                                            }`}
                                    >
                                        <span className="text-[10px] font-bold">{p.name}</span>
                                        <button
                                            onClick={(e) => deletePattern(p.id, e)}
                                            className="w-3 h-3 flex items-center justify-center rounded-full hover:bg-destructive/20 hover:text-destructive"
                                            aria-label="Delete pattern"
                                        >
                                            <X size={8} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>


        </div>
    );
}

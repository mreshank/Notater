"use client";
import { useRef, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

// Full octave range with proper musical notes
const NOTES = ["C5", "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4", "B3", "A#3", "A3"];

// Scale patterns (in semitones from root)
const SCALES: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
};

const NOTE_HEIGHT = 26;
const STEP_WIDTH = 34;
const STEPS = 16;
const PIANO_KEY_WIDTH = 44;

// Get semitone value from note name
function noteToSemitone(note: string): number {
    const noteMap: Record<string, number> = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
    const match = note.match(/([A-G]#?)(\d)/);
    if (!match) return 0;
    return noteMap[match[1]] + (parseInt(match[2]) * 12);
}

// Check if note is in scale
function isInScale(note: string, rootNote: string, scale: number[]): boolean {
    const noteSemitone = noteToSemitone(note) % 12;
    const rootSemitone = noteToSemitone(rootNote) % 12;
    const interval = (noteSemitone - rootSemitone + 12) % 12;
    return scale.includes(interval);
}

export function PianoRoll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const {
        playNote,
        isAudioInitialized,
        initializeAudio,
        isPlaying,
        project,
        currentStep: globalStep,
        pianoRollNotes: notes,
        addPianoNote,
        removePianoNote,
        clearPianoNotes
    } = useStore();

    const [selectedScale, setSelectedScale] = useState<string>("major");
    const [rootNote, setRootNote] = useState<string>("C4");
    const [showScaleGuide, setShowScaleGuide] = useState(true);
    const [playingNotes, setPlayingNotes] = useState<Set<string>>(new Set());

    const currentStep = globalStep !== undefined ? globalStep % STEPS : 0;

    // Play notes on step change
    useEffect(() => {
        if (!isPlaying) {
            setPlayingNotes(new Set());
            return;
        }

        const stepNotes = notes.filter((n) => n.step === currentStep);
        const newPlaying = new Set<string>();

        stepNotes.forEach(async (note) => {
            if (!isAudioInitialized) await initializeAudio();
            playNote(note.pitch, "8n");
            newPlaying.add(note.id);
        });

        setPlayingNotes(newPlaying);
        const timeout = setTimeout(() => setPlayingNotes(new Set()), 120);
        return () => clearTimeout(timeout);
    }, [currentStep, isPlaying, notes, playNote, isAudioInitialized, initializeAudio]);

    // Handle cell click
    const handleCellClick = async (pitch: string, step: number) => {
        const existingNote = notes.find((n) => n.pitch === pitch && n.step === step);
        if (existingNote) {
            removePianoNote(existingNote.id);
        } else {
            if (!isAudioInitialized) await initializeAudio();
            playNote(pitch, "16n");
            addPianoNote({
                id: `${Date.now()}-${Math.random()}`,
                pitch,
                step,
                duration: 1
            });
        }
    };

    // Handle piano key click
    const handleKeyClick = async (pitch: string) => {
        if (!isAudioInitialized) await initializeAudio();
        playNote(pitch, "8n");
    };

    const scaleNotes = SCALES[selectedScale] || SCALES.major;

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Controls */}
            <div className="flex items-center justify-between mb-3 px-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    {/* Scale selector */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] opacity-50">Scale:</span>
                        <select
                            value={selectedScale}
                            onChange={(e) => setSelectedScale(e.target.value)}
                            className="text-xs bg-surface border border-border rounded px-2 py-1"
                            title="Select scale"
                        >
                            <option value="major">Major</option>
                            <option value="minor">Minor</option>
                            <option value="pentatonic">Pentatonic</option>
                            <option value="blues">Blues</option>
                        </select>
                    </div>

                    {/* Root note */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] opacity-50">Key:</span>
                        <select
                            value={rootNote}
                            onChange={(e) => setRootNote(e.target.value)}
                            className="text-xs bg-surface border border-border rounded px-2 py-1"
                            title="Select root note"
                        >
                            {["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4"].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    {/* Toggle scale guide */}
                    <button
                        onClick={() => setShowScaleGuide(!showScaleGuide)}
                        className={`text-[10px] px-2 py-1 rounded ${showScaleGuide ? "bg-primary/20 text-primary" : "opacity-50"}`}
                    >
                        Scale Guide
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={clearPianoNotes}
                        className="px-3 py-1 bg-destructive/20 text-destructive hover:bg-destructive/30 rounded text-xs font-bold"
                    >
                        Clear
                    </motion.button>
                    <span className="text-[10px] opacity-40 font-mono">
                        {notes.length} notes • Step {currentStep + 1}
                    </span>
                </div>
            </div>

            {/* Piano Roll Grid */}
            <div
                ref={containerRef}
                className="overflow-x-auto rounded-xl border border-border bg-zinc-950 shadow-2xl"
            >
                <div className="inline-flex flex-col min-w-max">
                    {/* Header */}
                    <div className="flex border-b border-zinc-800">
                        <div className="shrink-0 bg-zinc-900/50" style={{ width: PIANO_KEY_WIDTH }} />
                        {Array.from({ length: STEPS }).map((_, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-center text-[10px] font-mono border-r border-zinc-800 ${i % 4 === 0 ? "font-bold opacity-70 bg-zinc-900/30" : "opacity-40"
                                    } ${currentStep === i && isPlaying ? "bg-purple-500/30 text-purple-300" : ""}`}
                                style={{ width: STEP_WIDTH, height: 22 }}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    {/* Note rows */}
                    {NOTES.map((note) => {
                        const isBlack = note.includes("#");
                        const inScale = showScaleGuide && isInScale(note, rootNote, scaleNotes);
                        const isRoot = note.replace(/\d/, '') === rootNote.replace(/\d/, '');

                        return (
                            <div key={note} className="flex">
                                {/* Piano key */}
                                <motion.button
                                    whileTap={{ scale: 0.97, x: 2 }}
                                    onClick={() => handleKeyClick(note)}
                                    className={`shrink-0 flex items-center justify-end pr-2 text-[10px] font-mono border-b transition-all ${isBlack
                                            ? "bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800"
                                            : "bg-zinc-200 text-zinc-700 border-zinc-300 hover:bg-zinc-300"
                                        } ${isRoot ? "ring-2 ring-inset ring-purple-500/50" : ""}`}
                                    style={{ width: PIANO_KEY_WIDTH, height: NOTE_HEIGHT }}
                                >
                                    {note}
                                </motion.button>

                                {/* Step cells */}
                                {Array.from({ length: STEPS }).map((_, stepIndex) => {
                                    const noteData = notes.find((n) => n.pitch === note && n.step === stepIndex);
                                    const hasNote = !!noteData;
                                    const isCurrentStep = currentStep === stepIndex && isPlaying;
                                    const isNoteActive = noteData && playingNotes.has(noteData.id);
                                    const isDownbeat = stepIndex % 4 === 0;

                                    return (
                                        <motion.button
                                            key={stepIndex}
                                            onClick={() => handleCellClick(note, stepIndex)}
                                            whileTap={{ scale: 0.92 }}
                                            className={`relative border-b border-r transition-all ${isBlack ? "border-zinc-800" : "border-zinc-800/50"
                                                } ${isDownbeat ? "border-l border-l-zinc-700" : ""}`}
                                            style={{
                                                width: STEP_WIDTH,
                                                height: NOTE_HEIGHT,
                                                backgroundColor: isCurrentStep
                                                    ? "rgba(168, 85, 247, 0.2)"
                                                    : inScale
                                                        ? isBlack ? "rgba(168, 85, 247, 0.08)" : "rgba(168, 85, 247, 0.05)"
                                                        : isBlack
                                                            ? "rgba(0, 0, 0, 0.4)"
                                                            : "rgba(39, 39, 42, 0.3)",
                                            }}
                                        >
                                            <AnimatePresence>
                                                {hasNote && (
                                                    <motion.div
                                                        initial={{ scale: 0.5, opacity: 0 }}
                                                        animate={{
                                                            scale: isNoteActive ? 1.05 : 1,
                                                            opacity: 1,
                                                        }}
                                                        exit={{ scale: 0.5, opacity: 0 }}
                                                        transition={{ duration: 0.08 }}
                                                        className="absolute inset-1 rounded"
                                                        style={{
                                                            background: isNoteActive
                                                                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                                                                : "linear-gradient(135deg, #a855f7, #7c3aed)",
                                                            boxShadow: isNoteActive
                                                                ? "0 0 16px rgba(34, 197, 94, 0.6)"
                                                                : "0 2px 8px rgba(168, 85, 247, 0.4)",
                                                        }}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Help */}
            <div className="text-[10px] opacity-40 text-center mt-3">
                Click cells to place notes • Highlighted cells are in the {selectedScale} scale of {rootNote}
            </div>
        </div>
    );
}

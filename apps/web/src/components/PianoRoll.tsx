import { useRef, useEffect, useState, useMemo } from "react";
import { useStore, Note } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Layers, Grid3X3, Eraser, ChevronsLeftRight, MousePointer2, Pencil, Trash2 } from "lucide-react";
import { SynthSelect } from "./SynthSelect";

// Scale patterns (in semitones from root)
const SCALES: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const NOTE_HEIGHT = 28;
// STEP_WIDTH is now dynamic
const PIANO_KEY_WIDTH = 60;

// Generate notes dynamically
function generateNotes(startOctave: number, endOctave: number): string[] {
    const notes: string[] = [];
    const scale = ["B", "A#", "A", "G#", "G", "F#", "F", "E", "D#", "D", "C#", "C"];

    for (let o = startOctave; o >= endOctave; o--) {
        scale.forEach(note => {
            notes.push(`${note}${o}`);
        });
    }
    return notes;
}

// Get semitone value from note name (0-11 relative to C)
function getNoteIndex(note: string): number {
    const noteMap: Record<string, number> = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
    const match = note.match(/([A-G]#?)(\d)/);
    if (!match) return 0;
    return noteMap[match[1]];
}

// Check if note is in scale
function isInScale(note: string, rootNote: string, scale: number[]): boolean {
    const noteIdx = getNoteIndex(note);
    const rootIdx = getNoteIndex(rootNote);
    // Calculate interval relative to root
    const interval = (noteIdx - rootIdx + 12) % 12;
    return scale.includes(interval);
}

export function PianoRoll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const {
        playNote,
        isAudioInitialized,
        initializeAudio,
        isPlaying,
        currentStep: globalStep, // infinite step
        pianoRollNotes: notes,
        addPianoNote,
        removePianoNote,
        clearPianoNotes,
        project,
        setBarCount,
        currentTool,
        setTool
    } = useStore();

    const [selectedScale, setSelectedScale] = useState<string>("minor");
    const [rootNote, setRootNote] = useState<string>("C");
    const [showScaleGuide, setShowScaleGuide] = useState(true);
    const [isFolded, setIsFolded] = useState(false);
    const [playingNotes, setPlayingNotes] = useState<Set<string>>(new Set());
    const [showAdvanced, setShowAdvanced] = useState(false);

    // View Customization State
    const [zoom, setZoom] = useState(1); // 0.5 to 3
    const [startOctave, setStartOctave] = useState(2);
    const [octaveCount, setOctaveCount] = useState(5);

    // Derived dimensions
    const stepWidth = 40 * zoom;

    // Computed total steps based on project settings
    const totalSteps = (project.barCount || 4) * 16;
    const currentStep = globalStep !== undefined ? globalStep % totalSteps : 0;

    // Generate full range notes dynamically
    const allNotes = useMemo(() => generateNotes(startOctave + octaveCount, startOctave), [startOctave, octaveCount]);

    // Filter notes if folded
    const displayNotes = useMemo(() => {
        const scaleIntervals = SCALES[selectedScale];
        if (!isFolded) return allNotes;
        return allNotes.filter(note => isInScale(note, rootNote, scaleIntervals));
    }, [isFolded, selectedScale, rootNote, allNotes]);

    const scaleIntervals = SCALES[selectedScale];

    // Play notes on step change
    useEffect(() => {
        if (!isPlaying) {
            requestAnimationFrame(() => {
                setPlayingNotes(prev => prev.size > 0 ? new Set() : prev);
            });
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
        // Prevent clicking beyond current grid size (cleanup)
        if (step >= totalSteps) return;

        const existingNote = notes.find((n) => n.pitch === pitch && n.step === step);

        if (currentTool === 'eraser') {
            if (existingNote) removePianoNote(existingNote.id);
            return;
        }

        if (currentTool === 'pencil') {
            if (existingNote) {
                removePianoNote(existingNote.id);
            } else {
                if (!isAudioInitialized) await initializeAudio();
                playNote(pitch, "16n");
                addPianoNote({
                    id: crypto.randomUUID(),
                    pitch,
                    step,
                    duration: 1
                });
            }
            return;
        }

        // Pointer tool: currently does nothing on click (will handle selection/drag later)
    };

    // Handle piano key click
    const handleKeyClick = async (pitch: string) => {
        if (!isAudioInitialized) await initializeAudio();
        playNote(pitch, "8n");
    };

    return (
        <div className="w-full h-full flex flex-col bg-background/50 rounded-xl border border-border overflow-hidden backdrop-blur-sm shadow-xl">
            {/* Controls Header - Mobile Responsive */}
            <div className="flex flex-col--x justify-between gap-2 p-2 sm:p-3 border-b border-border bg-surface/50 shrink-0">

                {/* Row 1: Essential Controls - Always visible */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    {/* Scale & Synth */}
                    <div className="flex items-center gap-1 sm:gap-2 bg-zinc-900/50 p-1 sm:p-1.5 rounded-lg border border-border">
                        <Music size={14} className="text-primary ml-1 hidden sm:block" />
                        <select
                            value={rootNote}
                            onChange={(e) => setRootNote(e.target.value)}
                            className="text-xs font-bold bg-transparent border-none outline-none text-foreground w-10 text-center cursor-pointer touch-manipulation"
                            title="Root Note"
                        >
                            {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <div className="w-px h-4 bg-border"></div>
                        <select
                            value={selectedScale}
                            onChange={(e) => setSelectedScale(e.target.value)}
                            className="text-xs font-bold bg-transparent border-none outline-none text-foreground w-16 sm:w-20 cursor-pointer touch-manipulation"
                            title="Scale Type"
                        >
                            {Object.keys(SCALES).map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                        </select>
                        <div className="hidden sm:block w-px h-4 bg-border"></div>
                        <div className="hidden sm:block">
                            <SynthSelect />
                        </div>
                    </div>

                     {/* Tools Palette - Larger on mobile */}
                    <div className="flex items-center gap-1 bg-zinc-900/50 p-1 sm:p-1.5 rounded-lg border border-border">
                        <button
                            onClick={() => setTool("pointer")}
                            className={`p-2 sm:p-1 rounded transition-colors touch-manipulation ${currentTool === "pointer" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                            title="Pointer"
                        >
                            <MousePointer2 size={16} className="sm:w-[10px] sm:h-[10px]" />
                        </button>
                        <button
                            onClick={() => setTool("pencil")}
                            className={`p-2 sm:p-1 rounded transition-colors touch-manipulation ${currentTool === "pencil" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                            title="Pencil"
                        >
                            <Pencil size={16} className="sm:w-[10px] sm:h-[10px]" />
                        </button>
                        <button
                            onClick={() => setTool("eraser")}
                            className={`p-2 sm:p-1 rounded transition-colors touch-manipulation ${currentTool === "eraser" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                            title="Eraser"
                        >
                            <Eraser size={16} className="sm:w-[10px] sm:h-[10px]" />
                        </button>
                    </div>

                    {/* Bars */}
                    <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-border">
                        <ChevronsLeftRight size={14} className="text-primary" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Bars</span>
                        <select
                            value={project.barCount || 4}
                            onChange={(e) => setBarCount(Number(e.target.value))}
                            className="text-xs font-bold bg-transparent text-foreground w-10 text-center cursor-pointer touch-manipulation"
                        >
                            {[1, 2, 4, 8, 16].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowScaleGuide(!showScaleGuide)}
                            className={`p-2 sm:p-1.5 rounded touch-manipulation ${showScaleGuide ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
                            title="Scale Guide"
                        >
                            <Grid3X3 size={16} className="sm:w-[14px] sm:h-[14px]" />
                        </button>
                        <button
                            onClick={() => setIsFolded(!isFolded)}
                            className={`p-2 sm:p-1.5 rounded touch-manipulation ${isFolded ? "text-secondary-foreground bg-secondary" : "text-muted-foreground hover:bg-muted"}`}
                            title="Fold to Scale"
                        >
                            <Layers size={16} className="sm:w-[14px] sm:h-[14px]" />
                        </button>
                        <button
                            onClick={clearPianoNotes}
                            className="p-2 sm:p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                            title="Clear"
                        >
                            <Trash2 size={16} className="sm:w-[14px] sm:h-[14px]" />
                        </button>

                        {/* Toggle Advanced - Mobile only shows button */}
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="sm:hidden p-2 rounded text-muted-foreground hover:bg-muted touch-manipulation"
                        >
                            <ChevronsLeftRight size={16} className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Row 2: Advanced Controls - Collapsible on mobile */}
                <div className={`flex items-center justify-between flex-wrap gap-2 ${showAdvanced ? 'flex' : 'hidden'} sm:flex`}>
                    

                    {/* Zoom - Hidden on very small screens */}
                    <div className="hidden xs:flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Zoom</span>
                        <input
                            type="range"
                            min="0.5" max="3" step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-16 sm:w-20 accent-primary h-2 touch-manipulation"
                        />
                    </div>

                    {/* Range - Desktop only */}
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Range</span>
                        <div className="flex items-center gap-1 bg-zinc-900/50 rounded border border-border px-1.5 py-1">
                            <span className="text-[9px] text-muted-foreground">Start:</span>
                            <input
                                type="number"
                                min={0} max={8}
                                value={startOctave}
                                onChange={(e) => setStartOctave(Number(e.target.value))}
                                className="w-6 bg-transparent text-xs text-center outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-zinc-900/50 rounded border border-border px-1.5 py-1">
                            <span className="text-[9px] text-muted-foreground">Oct:</span>
                            <input
                                type="number"
                                min={1} max={8}
                                value={octaveCount}
                                onChange={(e) => setOctaveCount(Number(e.target.value))}
                                className="w-6 bg-transparent text-xs text-center outline-none"
                            />
                        </div>
                    </div>

                    {/* Synth - Mobile only (when advanced is open) */}
                    <div className="sm:hidden">
                        <SynthSelect />
                    </div>

                    {/* Note Count */}
                    <span className="text-[10px] font-mono text-muted-foreground bg-zinc-900/50 border border-border px-2 py-1 rounded">
                        {notes.length} notes
                    </span>
                </div>
            </div>

            {/* Scrollable Grid Area */}
            <div className="flex-1 overflow-hidden relative">
                <div
                    ref={containerRef}
                    className="absolute inset-0 overflow-auto custom-scrollbar"
                >
                    <div className="min-w-max pb-12">
                        {/* Sticky Header: Time Steps */}
                        <div className="sticky top-0 z-20 flex bg-background border-b border-border shadow-sm">
                            <div className="shrink-0 bg-background border-r border-border" style={{ width: PIANO_KEY_WIDTH }}></div>
                            {Array.from({ length: totalSteps }).map((_, i) => {
                                const isBarStart = i % 16 === 0;
                                const isBeatStart = i % 4 === 0;

                                return (
                                    <div
                                        key={i}
                                        className={`shrink-0 flex flex-col items-center justify-center text-[9px] font-mono border-r h-6 select-none ${isBarStart ? "border-r-foreground/20 bg-muted/30" : "border-border/30"
                                            } ${isBeatStart && !isBarStart ? "border-r-border/60" : ""
                                            } ${currentStep === i && isPlaying ? "bg-primary/20 text-primary border-primary/20" : "text-muted-foreground/50"}`}
                                        style={{ width: stepWidth }}
                                    >
                                        {isBarStart
                                            ? <span className="font-bold text-foreground">{(i / 16) + 1}</span>
                                            : isBeatStart
                                                ? <span className="opacity-70">{(i % 16 / 4) + 1}</span>
                                                : "•"
                                        }
                                    </div>
                                )
                            })}
                        </div>

                        {/* Piano Rows */}
                        <div className="relative">
                            {displayNotes.map((note) => {
                                const isBlack = note.includes("#");
                                const noteName = note.replace(/\d/, "");
                                const isRoot = noteName === rootNote;
                                const inScale = isInScale(noteName, rootNote, scaleIntervals);
                                const shouldHighlight = showScaleGuide && inScale;

                                return (
                                    <div key={note} className="flex group">
                                        {/* Sticky Piano Key */}
                                        <div className="sticky left-0 z-10 shrink-0">
                                            <button
                                                onClick={() => handleKeyClick(note)}
                                                className={`flex items-center justify-between px-2 w-full text-[10px] font-mono border-b border-r transition-colors select-none ${isBlack
                                                    ? "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                                                    : "bg-white text-zinc-900 border-gray-100 hover:bg-gray-50"
                                                    } ${isRoot ? "bg-primary/5 text-primary font-bold" : ""}`}
                                                style={{ width: PIANO_KEY_WIDTH, height: NOTE_HEIGHT }}
                                            >
                                                <span className={isRoot ? "text-primary" : ""}>{noteName}</span>
                                                <span className="opacity-30 text-[8px]">{note.slice(-1)}</span>
                                            </button>
                                        </div>

                                        {/* Grid Cells */}
                                        {Array.from({ length: totalSteps }).map((_, step) => {
                                            const noteData = notes.find((n) => n.pitch === note && n.step === step);
                                            const isActive = !!noteData;
                                            const isPlayingNote = isActive && playingNotes.has(noteData!.id);
                                            const isCurrentRowStep = currentStep === step && isPlaying;
                                            const isBarStart = step % 16 === 0;
                                            const isBeatStart = step % 4 === 0;

                                            return (
                                                <div
                                                    key={`${note}-${step}`}
                                                    onClick={() => handleCellClick(note, step)}
                                                    className={`shrink-0 border-b border-r relative cursor-crosshair transition-colors 
                                                    ${isBarStart ? "border-l-foreground/20 border-l" : isBeatStart ? "border-l border-l-border/50" : ""}
                                                    ${isBlack ? "border-zinc-800/50" : "border-zinc-200/50"} 
                                                    ${isCurrentRowStep ? "bg-primary/5" : ""} 
                                                    ${shouldHighlight && !isBlack
                                                            ? "bg-primary/5"
                                                            : shouldHighlight && isBlack
                                                                ? "bg-primary/10"
                                                                : isBlack
                                                                    ? "bg-zinc-950/40"
                                                                    : "bg-transparent"
                                                        }`}
                                                    style={{ width: stepWidth, height: NOTE_HEIGHT }}
                                                >
                                                    {/* Note Block */}
                                                    <AnimatePresence>
                                                        {isActive && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    scale: isPlayingNote ? 1.1 : 1,
                                                                    boxShadow: isPlayingNote
                                                                        ? "0 0 15px var(--primary)"
                                                                        : "0 2px 4px rgba(0,0,0,0.2)"
                                                                }}
                                                                exit={{ opacity: 0, scale: 0.8 }}
                                                                transition={{ duration: 0.1 }}
                                                                className={`absolute inset-0.5 rounded-md flex items-center justify-center shadow-sm ${isPlayingNote ? "bg-primary-foreground text-primary z-20" : "bg-primary z-10"
                                                                    }`}
                                                            >
                                                                <span className={`text-[8px] font-bold ${isPlayingNote ? "text-primary" : "text-primary-foreground"}`}>
                                                                    {noteName}
                                                                </span>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

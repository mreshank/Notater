"use client";
import { useState } from "react";
import { useStore, SynthParams } from "@/lib/store";
import { motion } from "framer-motion";
import {
    Upload, Download, ChevronLeft, ChevronRight, Zap, Sliders, AudioWaveform
} from "lucide-react";

// Helpers
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const OSCILLATORS = [
    { type: "triangle", label: "TRI" },
    { type: "sine", label: "SINE" },
    { type: "square", label: "SQR" },
    { type: "sawtooth", label: "SAW" },
    { type: "fatsawtooth", label: "FAT" },
    { type: "pulse", label: "PUL" }
];

// Reusable Knob Component (Vertical Range Slider styled as Knob-ish or Slider)
const Slider = ({
    label, value, min, max, step, onChange, unit = ""
}: {
    label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, unit?: string
}) => (
    <div className="flex flex-col items-center gap-2 group">
        <div className="h-28 bg-muted/30 rounded-full p-1 relative w-8 flex justify-center">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="[-webkit-appearance:slider-vertical] w-full h-full opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer accent-primary"
            />
        </div>
        <div className="text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
            <div className="text-[9px] font-mono text-primary">{value}{unit}</div>
        </div>
    </div>
);

export function MiniKeyboard() {
    const {
        playNote, isAudioInitialized, initializeAudio,
        synthParams, setSynthParam, isRecording, toggleRecord,
        exportAudio, saveProject
    } = useStore();

    const [octave, setOctave] = useState(4);
    const [range, setRange] = useState(2); // octaves to show
    const [startKey, setStartKey] = useState("C");
    const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

    // Initialize audio on first interaction
    const checkAudio = async () => {
        if (!isAudioInitialized) await initializeAudio();
    };

    const handleNoteOn = async (note: string) => {
        checkAudio();
        setActiveNotes(prev => new Set(prev).add(note));
        playNote(note, "8n");
    };

    const handleNoteOff = (note: string) => {
        setActiveNotes(prev => {
            const next = new Set(prev);
            next.delete(note);
            return next;
        });
    };

    // Generate keys based on range
    const renderKeys = () => {
        const keys = [];
        const startOctave = octave;
        const totalKeys = range * 12 + 1; // +1 to end on C

        for (let i = 0; i < totalKeys; i++) {
            const noteIndex = i % 12;
            const currentOctave = startOctave + Math.floor(i / 12);
            const noteName = KEYS[noteIndex];
            const fullNote = `${noteName}${currentOctave}`;
            const isBlack = noteName.includes("#");

            keys.push({ note: fullNote, label: noteName, isBlack });
        }
        return keys;
    };

    const allKeys = renderKeys();
    const whiteKeys = allKeys.filter(k => !k.isBlack);
    const blackKeys = allKeys.filter(k => k.isBlack);
    const whiteKeyWidth = 100 / whiteKeys.length;

    return (
        <div className="flex flex-col gap-4 h-full select-none">
            {/* Synth Engine Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/10 rounded-xl border border-border relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>

                {/* 1. Oscillator */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <AudioWaveform size={14} /> OSCILLATOR
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {OSCILLATORS.map((osc) => (
                            <button
                                key={osc.type}
                                onClick={() => setSynthParam("oscillatorType", osc.type)}
                                className={`p-2 rounded-md text-[10px] font-bold border transition-all ${synthParams.oscillatorType === osc.type
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background border-border hover:border-primary/50"
                                    }`}
                            >
                                {osc.label}
                            </button>
                        ))}
                    </div>
                    <div className="pt-2">
                        <div className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Detune</div>
                        <input
                            type="range" min="-100" max="100"
                            value={synthParams.detune}
                            onChange={(e) => setSynthParam("detune", parseFloat(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>
                </div>

                {/* 2. Envelope (ADSR) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Sliders size={14} /> ENVELOPE
                    </div>
                    <div className="flex justify-between">
                        <Slider label="ATK" value={synthParams.attack} min={0.001} max={2} step={0.01} onChange={(v) => setSynthParam("attack", v)} unit="s" />
                        <Slider label="DEC" value={synthParams.decay} min={0.01} max={2} step={0.01} onChange={(v) => setSynthParam("decay", v)} unit="s" />
                        <Slider label="SUS" value={synthParams.sustain} min={0} max={1} step={0.01} onChange={(v) => setSynthParam("sustain", v)} />
                        <Slider label="REL" value={synthParams.release} min={0.01} max={4} step={0.01} onChange={(v) => setSynthParam("release", v)} unit="s" />
                    </div>
                </div>

                {/* 3. Filter */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Zap size={14} /> FILTER & FX
                    </div>
                    <div className="flex justify-between">
                        <Slider label="FREQ" value={synthParams.filterCutoff} min={20} max={20000} step={100} onChange={(v) => {
                            setSynthParam("filterCutoff", v);
                            useStore.getState().setMasterEffect("filterFreq", v);
                        }} unit="Hz" />
                        <Slider label="RES" value={synthParams.filterResonance} min={0} max={20} step={0.1} onChange={(v) => {
                            setSynthParam("filterResonance", v);
                            useStore.getState().setMasterEffect("filterRes", v);
                        }} />
                    </div>
                </div>
            </div>

            {/* Keyboard Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
                    <button onClick={() => setOctave(o => Math.max(0, o - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-background rounded transition-colors"><ChevronLeft size={16} /></button>
                    <span className="text-xs font-mono font-bold w-16 text-center">OCT {octave}</span>
                    <button onClick={() => setOctave(o => Math.min(8, o + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-background rounded transition-colors"><ChevronRight size={16} /></button>
                </div>

                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
                    <span className="text-[10px] font-bold px-2 text-muted-foreground">RANGE</span>
                    <button onClick={() => setRange(r => Math.max(1, r - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-background rounded transition-colors">-</button>
                    <span className="text-xs font-mono font-bold w-8 text-center">{range}</span>
                    <button onClick={() => setRange(r => Math.min(4, r + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-background rounded transition-colors">+</button>
                </div>
            </div>

            {/* Piano Keys Container */}
            <div className="h-64 relative overflow-hidden pb-4 select-none border-t border-border/50 pt-4">
                {/* Scroll Container if needed, but we try to fit range */}
                <div className="absolute inset-0 flex">
                    {whiteKeys.map((key) => (
                        <motion.button
                            key={key.note}
                            onPointerDown={() => handleNoteOn(key.note)}
                            onPointerUp={() => handleNoteOff(key.note)}
                            onPointerLeave={() => handleNoteOff(key.note)}
                            className={`flex-1 border-r border-b border-l border-border/50 rounded-b-lg flex items-end justify-center pb-2 relative active:bg-primary/20 transition-colors z-10 ${activeNotes.has(key.note) ? "bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.5)]" : "bg-white/5 hover:bg-white/10"
                                }`}
                            whileTap={{ scale: 0.99 }}
                        >
                            <span className="text-[10px] font-bold text-muted-foreground/50 mb-2">{key.label}{key.note.replace(/\D/g, '')}</span>
                        </motion.button>
                    ))}

                    {/* Black Keys Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                        {blackKeys.map((key) => {
                            // Calculate position based on the white key preceding it
                            // Find index of this key in allKeys
                            const myIndex = allKeys.findIndex(k => k.note === key.note);
                            // Function to count white keys before this index
                            const whiteKeysBefore = allKeys.slice(0, myIndex).filter(k => !k.isBlack).length;

                            // whiteKeyWidth is 100 / whiteKeys.length (%)
                            // Center of black key should be at border of white key `whiteKeysBefore`.
                            // i.e. Left = (whiteKeysBefore * whiteKeyWidth) - (blackKeyWidth / 2)

                            const blackKeyWidth = whiteKeyWidth * 0.65; // Slightly narrower than white key
                            const leftPosition = (whiteKeysBefore * whiteKeyWidth) - (blackKeyWidth / 2);

                            return (
                                <motion.button
                                    key={key.note}
                                    onPointerDown={(e) => { e.stopPropagation(); handleNoteOn(key.note); }}
                                    onPointerUp={() => handleNoteOff(key.note)}
                                    onPointerLeave={() => handleNoteOff(key.note)}
                                    className={`absolute h-[60%] bg-black border border-gray-700/50 rounded-b-md shadow-lg pointer-events-auto transition-colors ${activeNotes.has(key.note) ? "bg-primary border-primary shadow-primary/50" : "hover:bg-gray-900"
                                        }`}
                                    style={{
                                        left: `${leftPosition}%`,
                                        width: `${blackKeyWidth}%`
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

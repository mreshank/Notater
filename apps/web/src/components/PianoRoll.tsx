"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

const NOTES = ["C5", "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4"];
const NOTE_HEIGHT = 24;
const STEP_WIDTH = 32;
const STEPS = 16;
const PIANO_KEY_WIDTH = 40;

export function PianoRoll() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const {
        playNote,
        isAudioInitialized,
        initializeAudio,
        isPlaying,
        project,
        pianoRollNotes: notes,
        addPianoNote,
        removePianoNote,
        clearPianoNotes
    } = useStore();

    const [currentStep, setCurrentStep] = useState(0);

    const width = PIANO_KEY_WIDTH + STEPS * STEP_WIDTH;
    const height = NOTES.length * NOTE_HEIGHT;

    // Draw the piano roll
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear
        ctx.fillStyle = "var(--background, #09090b)";
        ctx.fillRect(0, 0, width, height);

        // Draw piano keys
        NOTES.forEach((note, i) => {
            const y = i * NOTE_HEIGHT;
            const isBlack = note.includes("#");

            ctx.fillStyle = isBlack ? "#18181b" : "#f4f4f5";
            ctx.fillRect(0, y, PIANO_KEY_WIDTH, NOTE_HEIGHT);
            ctx.strokeStyle = "#3f3f46";
            ctx.strokeRect(0, y, PIANO_KEY_WIDTH, NOTE_HEIGHT);

            // Note label
            ctx.fillStyle = isBlack ? "#a1a1aa" : "#27272a";
            ctx.font = "10px monospace";
            ctx.textAlign = "right";
            ctx.fillText(note, PIANO_KEY_WIDTH - 4, y + NOTE_HEIGHT / 2 + 3);
        });

        // Draw grid
        for (let i = 0; i < NOTES.length; i++) {
            const y = i * NOTE_HEIGHT;
            const isBlack = NOTES[i].includes("#");
            ctx.fillStyle = isBlack ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)";
            ctx.fillRect(PIANO_KEY_WIDTH, y, width - PIANO_KEY_WIDTH, NOTE_HEIGHT);

            for (let j = 0; j <= STEPS; j++) {
                const x = PIANO_KEY_WIDTH + j * STEP_WIDTH;
                ctx.strokeStyle = j % 4 === 0 ? "#52525b" : "#27272a";
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + NOTE_HEIGHT);
                ctx.stroke();
            }

            // Horizontal line
            ctx.strokeStyle = "#27272a";
            ctx.beginPath();
            ctx.moveTo(PIANO_KEY_WIDTH, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw playhead
        if (isPlaying) {
            const playheadX = PIANO_KEY_WIDTH + currentStep * STEP_WIDTH;
            ctx.fillStyle = "rgba(217, 70, 239, 0.3)";
            ctx.fillRect(playheadX, 0, STEP_WIDTH, height);
        }

        // Draw notes
        notes.forEach((note) => {
            const noteIndex = NOTES.indexOf(note.pitch);
            if (noteIndex === -1) return;

            const x = PIANO_KEY_WIDTH + note.step * STEP_WIDTH;
            const y = noteIndex * NOTE_HEIGHT + 2;
            const w = note.duration * STEP_WIDTH - 4;
            const h = NOTE_HEIGHT - 4;

            // Note body with gradient
            const gradient = ctx.createLinearGradient(x, y, x, y + h);
            gradient.addColorStop(0, "#d946ef");
            gradient.addColorStop(1, "#a855f7");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x + 2, y, w, h, 4);
            ctx.fill();
        });
    }, [notes, isPlaying, currentStep, width, height]);

    // Redraw on state change
    useEffect(() => {
        draw();
    }, [draw]);

    // Playback step tracking
    useEffect(() => {
        if (!isPlaying) {
            const timeout = setTimeout(() => setCurrentStep(0), 0);
            return () => clearTimeout(timeout);
        }

        const stepDuration = (60 / project.bpm / 4) * 1000;
        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                const nextStep = (prev + 1) % STEPS;

                // Trigger notes on this step
                notes.forEach((note) => {
                    if (note.step === nextStep) {
                        playNote(note.pitch, "8n");
                    }
                });

                return nextStep;
            });
        }, stepDuration);

        return () => clearInterval(interval);
    }, [isPlaying, project.bpm, notes, playNote]);

    // Handle canvas click
    const handleClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Ignore clicks on piano keys
        if (x < PIANO_KEY_WIDTH) {
            const noteIndex = Math.floor(y / NOTE_HEIGHT);
            if (noteIndex >= 0 && noteIndex < NOTES.length) {
                if (!isAudioInitialized) await initializeAudio();
                playNote(NOTES[noteIndex], "8n");
            }
            return;
        }

        const step = Math.floor((x - PIANO_KEY_WIDTH) / STEP_WIDTH);
        const noteIndex = Math.floor(y / NOTE_HEIGHT);

        if (step >= 0 && step < STEPS && noteIndex >= 0 && noteIndex < NOTES.length) {
            const pitch = NOTES[noteIndex];

            // Check if note exists at this position
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
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <div
                ref={containerRef}
                className="relative overflow-x-auto rounded-lg border border-border shadow-lg"
            >
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    onClick={handleClick}
                    className="cursor-crosshair block [image-rendering:pixelated]"
                />
            </div>

            <div className="flex justify-center gap-2 mt-4">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={clearPianoNotes}
                    className="px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg text-xs font-bold transition-colors"
                >
                    CLEAR
                </motion.button>
                <span className="px-4 py-2 text-xs text-foreground/50">
                    {notes.length} notes
                </span>
            </div>
        </div>
    );
}

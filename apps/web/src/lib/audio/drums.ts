/**
 * High-quality drum sampler using Tone.js
 * Supports multiple kit presets: Standard, 808, and Electronic
 */
import * as Tone from "tone";

// Kit presets
export type DrumKit = "standard" | "808" | "electronic";

export const DRUM_KITS: { id: DrumKit; name: string }[] = [
    { id: "standard", name: "STD" },
    { id: "808", name: "808" },
    { id: "electronic", name: "ELEC" },
];

let currentKit: DrumKit = "standard";

export function setDrumKit(kit: DrumKit) {
    currentKit = kit;
}

export function getCurrentKit(): DrumKit {
    return currentKit;
}

// Kit-specific parameters
const KIT_PARAMS: Record<DrumKit, {
    kickOctaves: number;
    kickDecay: number;
    snareDecay: number;
    hihatDecay: number;
    basePitch: number;
}> = {
    standard: { kickOctaves: 6, kickDecay: 0.4, snareDecay: 0.25, hihatDecay: 0.08, basePitch: 0 },
    "808": { kickOctaves: 8, kickDecay: 0.8, snareDecay: 0.35, hihatDecay: 0.05, basePitch: -12 },
    electronic: { kickOctaves: 4, kickDecay: 0.2, snareDecay: 0.15, hihatDecay: 0.03, basePitch: 12 },
};

// Drum configuration factory
function createDrumConfig(kit: DrumKit) {
    const params = KIT_PARAMS[kit];
    
    return {
        kick: {
            synth: () => new Tone.MembraneSynth({
                pitchDecay: kit === "808" ? 0.08 : 0.05,
                octaves: params.kickOctaves,
                oscillator: { type: kit === "808" ? "sine" : "triangle" },
                envelope: {
                    attack: 0.001,
                    decay: params.kickDecay,
                    sustain: kit === "808" ? 0.1 : 0.01,
                    release: kit === "808" ? 1.5 : 1.2,
                    attackCurve: "exponential"
                }
            }),
            note: kit === "808" ? "F0" : "C1",
            duration: kit === "808" ? "4n" : "8n"
        },
        snare: {
            synth: () => {
                const membrane = new Tone.MembraneSynth({
                    pitchDecay: kit === "electronic" ? 0.02 : 0.008,
                    octaves: kit === "808" ? 5 : 4,
                    envelope: { attack: 0.0006, decay: params.snareDecay, sustain: 0, release: 0.4 }
                });
                const noise = new Tone.NoiseSynth({
                    noise: { type: kit === "808" ? "pink" : "white" },
                    envelope: { attack: 0.0005, decay: kit === "808" ? 0.2 : 0.15, sustain: 0, release: 0.2 }
                });
                return { membrane, noise };
            },
            note: kit === "808" ? "D2" : "E2",
            duration: "16n"
        },
        hihat: {
            synth: () => new Tone.MetalSynth({
                envelope: { attack: 0.001, decay: params.hihatDecay, release: 0.01 },
                harmonicity: kit === "electronic" ? 8 : 5.1,
                modulationIndex: kit === "electronic" ? 40 : 32,
                resonance: kit === "808" ? 3000 : 4000,
                octaves: kit === "electronic" ? 2 : 1.5
            }),
            note: "C6",
            duration: "32n"
        },
        hihatOpen: {
            synth: () => new Tone.MetalSynth({
                envelope: { attack: 0.001, decay: kit === "electronic" ? 0.2 : 0.3, release: 0.1 },
                harmonicity: kit === "electronic" ? 8 : 5.1,
                modulationIndex: kit === "electronic" ? 40 : 32,
                resonance: 4000,
                octaves: 1.5
            }),
            note: "C6",
            duration: "8n"
        },
        clap: {
            synth: () => new Tone.NoiseSynth({
                noise: { type: kit === "808" ? "brown" : "pink" },
                envelope: { attack: kit === "808" ? 0.01 : 0.005, decay: kit === "808" ? 0.2 : 0.12, sustain: 0, release: 0.15 }
            }),
            note: "C4",
            duration: "16n"
        },
        tom1: {
            synth: () => new Tone.MembraneSynth({
                pitchDecay: kit === "electronic" ? 0.05 : 0.03,
                octaves: 3,
                envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.5 }
            }),
            note: kit === "808" ? "A2" : "G2",
            duration: "8n"
        },
        tom2: {
            synth: () => new Tone.MembraneSynth({
                pitchDecay: kit === "electronic" ? 0.05 : 0.03,
                octaves: 3,
                envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.5 }
            }),
            note: kit === "808" ? "E2" : "D2",
            duration: "8n"
        },
        crash: {
            synth: () => new Tone.MetalSynth({
                envelope: { attack: 0.001, decay: kit === "electronic" ? 0.8 : 1.4, release: 0.2 },
                harmonicity: 5.1,
                modulationIndex: 40,
                resonance: 5000,
                octaves: 1.5
            }),
            note: "C5",
            duration: "2n"
        },
        ride: {
            synth: () => new Tone.MetalSynth({
                envelope: { attack: 0.001, decay: 0.6, release: 0.1 },
                harmonicity: 3,
                modulationIndex: 20,
                resonance: 6000,
                octaves: 1.2
            }),
            note: "D5",
            duration: "4n"
        }
    };
}

// Get current config based on kit
function getDrumConfig() {
    return createDrumConfig(currentKit);
}

export type DrumType = "kick" | "snare" | "hihat" | "hihatOpen" | "clap" | "tom1" | "tom2" | "crash" | "ride";


import { mixer } from "./mixer";

export function playDrum(type: DrumType) {
    const config = getDrumConfig()[type];
    const synth = config.synth();
    
    // Try to find a mixer channel for this drum
    // We Map drum types to channel IDs. Default to specific name, or 'drums' bus if we had one.
    // Our store uses 'kick', 'snare', 'hihat', 'clap'. Others might need a generic 'percussion' channel or own channel.
    // For now detailed mapping:
    let channelId = type; 
    // If we only have 4 channels in sequencer, maybe map tom => kick? No, let's look for exact match.
    // If no channel found, maybe fallback to 'drums' or Master.
    
    const channel = mixer.getChannel(channelId);
    const destination = channel ? channel.input : Tone.getDestination();

    if (typeof synth === 'object' && 'membrane' in synth) {
        synth.membrane.connect(destination);
        synth.noise.connect(destination);
        synth.membrane.triggerAttackRelease(config.note!, config.duration);
        synth.noise.triggerAttackRelease(config.duration);
        setTimeout(() => {
            synth.membrane.dispose();
            synth.noise.dispose();
        }, 2000);
    } else if (type === 'clap') {
        (synth as Tone.NoiseSynth).connect(destination);
        (synth as Tone.NoiseSynth).triggerAttackRelease(config.duration);
        setTimeout(() => (synth as Tone.NoiseSynth).dispose(), 2000);
    } else if (config.note) {
        (synth as Tone.MembraneSynth).connect(destination);
        (synth as Tone.MembraneSynth).triggerAttackRelease(config.note, config.duration);
        setTimeout(() => (synth as Tone.MembraneSynth).dispose(), 2000);
    } else {
        (synth as Tone.MetalSynth).connect(destination);
        (synth as Tone.MetalSynth).triggerAttackRelease(config.note!, config.duration);
        setTimeout(() => (synth as Tone.MetalSynth).dispose(), 2000);
    }
}

export const DRUM_TYPES: DrumType[] = [
    "kick", "snare", "hihat", "hihatOpen", "clap", "tom1", "tom2", "crash", "ride"
];

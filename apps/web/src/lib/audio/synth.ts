/**
 * Synthesizer Engine
 * 
 * Provides ready-to-use synth instruments.
 */
import * as Tone from "tone";

export type SynthPreset = "basic" | "bass" | "lead" | "pad" | "pluck" | "retro" | "bell" | "fat" | "dark";

/**
 * Create a synth with the given preset
 */
export function createSynth(preset: SynthPreset = "basic"): Tone.PolySynth {
  const synth = new Tone.PolySynth(Tone.Synth);
  
  // Apply preset settings
  switch (preset) {
    case "bass":
      synth.set({
        oscillator: { type: "sawtooth" as const },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
      });
      break;
    case "lead":
      synth.set({
        oscillator: { type: "square" as const },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
      });
      break;
    case "pad":
      synth.set({
        oscillator: { type: "sine" as const },
        envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 2 },
      });
      break;
    case "pluck":
      synth.set({
        oscillator: { type: "triangle" as const },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      });
      break;
    case "retro":
      synth.set({
        oscillator: { type: "square" as const },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0.1, release: 0.1 },
      });
      break;
    case "bell":
      synth.set({
        oscillator: { type: "sine" as const }, // FM simplified to just simple sine here, or maybe complex
        // For simple FM, Tone.Synth supports AM/FM but PolySynth<Synth> is simpler.
        // Let's stick to simple sine with specific envelope for bell-like sound
        envelope: { attack: 0.001, decay: 1.0, sustain: 0.0, release: 1.5 },
      });
      break;
    case "fat":
      // "Fat" usually implies detuned saws. Standard Tone.Synth is mono-osc.
      // We can use "fatsawtooth" if available or just a nice saw.
      // Tone.js oscillators support "fatsawtooth"
      synth.set({
        oscillator: { type: "fatsawtooth" as any, count: 3, spread: 20 },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.5 },
      });
      break;
    case "dark":
      synth.set({
        oscillator: { type: "pulse" as const, width: 0.4 },
        envelope: { attack: 0.2, decay: 0.5, sustain: 0.4, release: 1.0 },
      });
      break;
    case "basic":
    default:
      synth.set({
        oscillator: { type: "triangle" as const },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 },
      });
      break;
  }
  
  return synth;
}

/**
 * Create a simple membrane synth for drums
 */
export function createDrumSynth(): Tone.MembraneSynth {
  return new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    oscillator: { type: "sine" as const },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
  });
}

/**
 * Create a noise synth for hi-hats/percussion
 */
export function createNoiseSynth(): Tone.NoiseSynth {
  return new Tone.NoiseSynth({
    noise: { type: "white" as const },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 },
  });
}

/**
 * Synthesizer Engine
 * 
 * Provides ready-to-use synth instruments.
 */
import * as Tone from "tone";

export type SynthPreset = "basic" | "bass" | "lead" | "pad" | "pluck" | "retro" | "bell" | "fat" | "dark" | "keys" | "strings";

/**
 * Create a synth with the given preset
 */
/**
 * Create a synth with the given preset
 */
export function createSynth(preset: SynthPreset = "basic"): Tone.PolySynth {
  const synth = new Tone.PolySynth(Tone.Synth);
  applyPreset(synth, preset);
  return synth;
}

/**
 * Apply a preset to an existing synth instance
 */
export function applyPreset(synth: Tone.PolySynth, preset: SynthPreset) {
  // Release all notes to prevent stuck buffer when changing settings drastically
  synth.releaseAll();

  switch (preset) {
    case "keys":
      // Close to an Electric Piano: FM or Triangle with specific envelope
      synth.set({
        oscillator: { type: "triangle" as const },
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.4 },
      });
      break;
    case "strings":
      // Slow attack saw/pwm
      synth.set({
        oscillator: { type: "pwm" as const, modulationFrequency: 0.4 },
        envelope: { attack: 0.6, decay: 0.5, sustain: 0.8, release: 2.5 },
      });
      break;
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
        oscillator: { type: "sine" as const }, 
        envelope: { attack: 0.001, decay: 1.0, sustain: 0.0, release: 1.5 },
      });
      break;
    case "fat":
      // Explicit cast to satisfy Tone types for special oscillators
      synth.set({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

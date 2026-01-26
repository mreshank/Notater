/**
 * Effects Chain
 * 
 * Provides ready-to-use audio effects with sensible defaults.
 */
import * as Tone from "tone";

export interface EffectsChain {
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  distortion: Tone.Distortion;
  filter: Tone.Filter;
  compressor: Tone.Compressor;
  output: Tone.Gain;
}

/**
 * Create a complete effects chain
 */
export function createEffectsChain(): EffectsChain {
  const reverb = new Tone.Reverb({
    decay: 2,
    wet: 0.3,
  });

  const delay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.3,
    wet: 0.2,
  });

  const distortion = new Tone.Distortion({
    distortion: 0.2,
    wet: 0,
  });

  const filter = new Tone.Filter({
    frequency: 2000,
    type: "lowpass",
    rolloff: -12,
  });

  const compressor = new Tone.Compressor({
    threshold: -20,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
  });

  const output = new Tone.Gain(0.8);

  // Chain: distortion -> filter -> delay -> reverb -> compressor -> output
  distortion.connect(filter);
  filter.connect(delay);
  delay.connect(reverb);
  reverb.connect(compressor);
  compressor.connect(output);
  output.toDestination();

  return { reverb, delay, distortion, filter, compressor, output };
}

/**
 * Create a minimal effects chain (just reverb + output)
 */
export function createMinimalChain(): Pick<EffectsChain, "reverb" | "output"> {
  const reverb = new Tone.Reverb({
    decay: 1.5,
    wet: 0.2,
  });

  const output = new Tone.Gain(0.8);

  reverb.connect(output);
  output.toDestination();

  return { reverb, output };
}

/**
 * Dispose of an effects chain
 */
export function disposeEffectsChain(chain: Partial<EffectsChain>): void {
  Object.values(chain).forEach((effect) => {
    if (effect && "dispose" in effect) {
      effect.dispose();
    }
  });
}

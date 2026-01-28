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
  bitCrusher: Tone.BitCrusher;
  chorus: Tone.Chorus;
  filter: Tone.Filter;
  compressor: Tone.Compressor;
  limiter: Tone.Limiter;
  output: Tone.Gain;
}

/**
 * Create a complete effects chain
 */
export function createEffectsChain(): EffectsChain {
  const reverb = new Tone.Reverb({
    decay: 2,
    wet: 0.2,
  });

  const delay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.3,
    wet: 0,
  });

  const distortion = new Tone.Distortion({
    distortion: 0.2,
    wet: 0,
  });

  const bitCrusher = new Tone.BitCrusher({
    bits: 4,
  });
  bitCrusher.wet.value = 0;

  const chorus = new Tone.Chorus({
    frequency: 4,
    delayTime: 2.5,
    depth: 0.5,
    wet: 0
  }).start();

  const filter = new Tone.Filter({
    frequency: 20000,
    type: "lowpass",
    rolloff: -12,
  });

  const compressor = new Tone.Compressor({
    threshold: -20,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
  });

  const limiter = new Tone.Limiter(-1);

  const output = new Tone.Gain(0.8);

  // Chain: distortion -> bitCrusher -> filter -> chorus -> delay -> reverb -> compressor -> limiter -> output
  distortion.connect(bitCrusher);
  bitCrusher.connect(filter);
  filter.connect(chorus);
  chorus.connect(delay);
  delay.connect(reverb);
  reverb.connect(compressor);
  compressor.connect(limiter);
  limiter.connect(output);
  output.toDestination();

  return { reverb, delay, distortion, bitCrusher, chorus, filter, compressor, limiter, output };
}

/**
 * Create a minimal effects chain (reverb + limiter + output)
 */
export function createMinimalChain(): Pick<EffectsChain, "reverb" | "delay" | "output"> & { limiter: Tone.Limiter } {
  const delay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.3,
    wet: 0, // Start dry
  });

  const reverb = new Tone.Reverb({
    decay: 1.5,
    wet: 0.25,
  });

  const limiter = new Tone.Limiter(-3); // Prevent clipping

  const output = new Tone.Gain(0.7);

  // Chain: Delay -> Reverb -> Limiter -> Output
  delay.connect(reverb);
  reverb.connect(limiter);
  limiter.connect(output);
  output.toDestination();

  return { delay, reverb, limiter, output };
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

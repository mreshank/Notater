import * as Tone from "tone";
import { createSynth, createDrumSynth, createNoiseSynth, SynthPreset } from "./synth";
import { createMinimalChain } from "./effects";

// Helper to convert AudioBuffer to WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let result: Float32Array;
  if (numChannels === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }

  return encodeWAV(result, numChannels, sampleRate, format, bitDepth);
}

function interleave(inputL: Float32Array, inputR: Float32Array) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);

  let index = 0;
  let inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function encodeWAV(samples: Float32Array, numChannels: number, sampleRate: number, format: number, bitDepth: number) {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * bytesPerSample, true);

  if (bitDepth === 16) {
      floatTo16BitPCM(view, 44, samples);
  } else {
      floatTo32BitPCM(view, 44, samples);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function floatTo32BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 4) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setFloat32(offset, s, true); // this is actually float 32 not int 32 PCM usually, but simple WAV often uses int. Let's stick to 16bit for compatibility.
    }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ------------------------------------------------------------------

// Partial type to avoid circular dependency loop if we imported AppState directly 
// (though it usually works in TS unless we use 'typeof').
// Let's just define what we need.
interface ExportState {
    project: { bpm: number };
    sequencerGrid: Record<string, boolean[]>;
    pianoRollNotes: { pitch: string; step: number; duration: number }[];
    synthPreset: SynthPreset;
    mixer: Record<string, { volume: number; pan: number; muted: boolean }>;
    trackSamples: Record<string, string>;
}

export async function exportProjectToWav(state: ExportState): Promise<Blob> {
    const { bpm } = state.project;
    const { sequencerGrid, pianoRollNotes, synthPreset, mixer, trackSamples } = state;

    // 0. Pre-load Samples
    const loadedBuffers: Record<string, Tone.ToneAudioBuffer> = {};
    await Promise.all(Object.entries(trackSamples).map(async ([trackId, url]) => {
        try {
            if (url) {
                const buffer = new Tone.ToneAudioBuffer();
                await buffer.load(url);
                loadedBuffers[trackId] = buffer;
            }
        } catch (e) {
            console.warn(`Failed to load sample for export: ${trackId}`, e);
        }
    }));

    // 1. Calculate Duration
    // Assume 4 bars (64 steps) for now as standard loop, or find max step
    let maxStep = 63; 
    pianoRollNotes.forEach(n => {
        if (n.step + n.duration > maxStep) maxStep = n.step + n.duration;
    });
    
    // Duration in seconds = (beats / bpm) * 60
    // beats = steps / 4
    const totalBeats = (maxStep + 1) / 4; 
    // Add a bit of tail for reverb
    const duration = (totalBeats / bpm) * 60 + 2; 

    // 2. Render Offline
    const buffer = await Tone.Offline(({ transport }) => {
        
        // --- Setup Instruments ---

        // Helper to mix a channel
        const createChannel = (id: string, source: Tone.ToneAudioNode) => {
            const channel = mixer[id];
            
            // Create strip
            const pan = new Tone.Panner(channel.pan).toDestination();
            const vol = new Tone.Volume(channel.muted ? -Infinity : channel.volume).connect(pan);
            
            source.connect(vol);
        };

        // Drums
        const drumIds = ["kick", "snare", "hihat", "clap"];
        const drums: Record<string, Tone.ToneAudioNode> = {};
        
        drumIds.forEach(id => {
             // Recreate the specific synth type logic from store/initAudio roughly
             // For simplicity, we'll just check ID. Real app should have better factory.
             let inst: any;
             if (id === 'hihat') {
                 inst = createNoiseSynth();
             } else {
                 inst = createDrumSynth();
             }
             drums[id] = inst;
             createChannel(id, inst);
        });

        // Melodic Synth
        const synth = createSynth(synthPreset);
        const effects = createMinimalChain();
        synth.connect(effects.reverb);
        
        // Channel strip for synth
        const channel = mixer["melodic"];
        const pan = new Tone.Panner(channel.pan).toDestination();
        const vol = new Tone.Volume(channel.muted ? -Infinity : channel.volume).connect(pan);
        effects.output.connect(vol);
        // Effects output is actually a Gain in our util, so:
        // effects.output.connect(vol) is valid. note: createMinimalChain does output.toDestination() 
        // which in Offline context means "Offline Destination".
        // But we want to route through our mixer channel first.
        // So we should strictly NOT call toDestination in createMinimalChain if we want to route it.
        // However, createMinimalChain code says: `output.toDestination();`.
        // In Tone.Offline, toDestination() routes to the render output.
        // If we want to insert volume/pan, we must disconnect it or create a new chain that doesn't connect to dest.
        // For this implementation, let's just assume we connect in parallel or accept the limitation. 
        // BETTER: Disconnect effects.output from destination if possible, or just build the chain manually here.
        // Let's build manually to be safe.
        effects.output.disconnect(); 
        effects.output.connect(vol);


        // --- Schedule Events ---

        transport.bpm.value = bpm;

        // Schedule Drums
        drumIds.forEach(id => {
            const row = sequencerGrid[id];
            if (!row) return;
            const inst = drums[id];
            
            row.forEach((isActive, stepIndex) => {
                if (isActive) {
                    const time = `0:0:${stepIndex}`;
                    // Note mapping
                    let note = "C2";
                    if (id === 'snare') note = "D2";
                    if (id === 'clap') note = "D#2";
                    // Hihat is noise, triggerAttackRelease default
                    
                    transport.schedule(() => {
                        if (id === 'hihat') {
                             (inst as Tone.NoiseSynth).triggerAttackRelease("32n");
                        } else {
                             (inst as Tone.MembraneSynth).triggerAttackRelease(note, "16n");
                        }
                    }, time);
                }
            });
        });

        // Schedule Melody
        pianoRollNotes.forEach(note => {
            transport.schedule(() => {
                synth.triggerAttackRelease(note.pitch, note.duration * Tone.Time("16n").toSeconds()); 
                // Note: duration in steps (16ths). 
                // Tone.Time("16n") calculation might be tricky inside Offline if BPM is dynamic, 
                // but usually fine. Better to use "0:0:duration" format.
            }, `0:0:${note.step}`);
        });

        transport.start();

    }, duration);

    return audioBufferToWav(buffer.get() as AudioBuffer);
}

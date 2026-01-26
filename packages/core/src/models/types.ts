// import { z } from 'zod';

export type TimeSignature = [number, number]; // [numerator, denominator] e.g. [4, 4]

export type NoteValue = '1n' | '2n' | '4n' | '8n' | '16n' | '32n';

export interface ProjectConfig {
  bpm: number;
  timeSignature: TimeSignature;
  swing: number; // 0.0 to 1.0
  name: string;
}

export type StepType = 'on' | 'off' | 'hold';

export interface Step {
  id: string; // Unique ID
  index: number; // Grid index
  type: StepType;
  velocity: number; // 0.0 to 1.0
  duration: number; // In beats (1.0 = quarter note)
  microTiming: number; // -0.5 to 0.5 (time shift)
  pitch?: string; // e.g. "C4" (for melodic instruments)
}

export type InstrumentType = 'sampler' | 'synth' | 'noise';

// Effects Chain Definitions
export interface EffectConfig {
  id: string;
  type: 'reverb' | 'delay' | 'distortion' | 'filter';
  wet: number; // 0 to 1
  params: Record<string, number | string | boolean>;
}

export interface Instrument {
  id: string;
  name: string;
  type: InstrumentType;
  source: string; // URL for sample, or preset name for synth
  volume: number; // -Infinity to +10 dB
  pan: number; // -1 to 1
  muted: boolean;
  solo: boolean;
  color: string; // Hex code for UI
  effects: EffectConfig[];
}

export interface Track {
  id: string;
  instrument: Instrument;
  steps: Record<number, Step>; // sparse map: index -> Step
  length: number; // Steps in the pattern (e.g. 16, 32, 64)
}

export interface Pattern {
  id: string;
  name: string;
  tracks: Track[];
  bars: number; // Length in bars
}

export interface Project {
  id: string;
  version: string;
  config: ProjectConfig;
  patterns: Pattern[];
  activePatternId: string;
  createdAt: number;
  updatedAt: number;
}

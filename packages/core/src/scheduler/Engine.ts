import { Pattern, Step } from '../models/types';
import * as Tone from 'tone';

/**
 * Event payload when a step is triggered during playback
 */
export interface StepEvent {
  trackId: string;
  instrumentId: string;
  step: Step;
  time: number;
}

export type PlaybackCallback = (event: StepEvent) => void;

/**
 * Headless Audio Engine
 * 
 * Manages playback scheduling using Tone.js Transport.
 * Framework-agnostic - can be used in CLI, PWA, or any JS environment.
 */
export class AudioEngine {
  private _isPlaying = false;
  private _pattern: Pattern | null = null;
  private _callback: PlaybackCallback | null = null;

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Set the pattern to be scheduled for playback
   */
  setPattern(pattern: Pattern): void {
    this._pattern = pattern;
    this._reschedule();
  }

  /**
   * Set the tempo in BPM
   */
  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm;
  }

  /**
   * Register a callback to be called when steps are triggered
   */
  setCallback(cb: PlaybackCallback): void {
    this._callback = cb;
  }

  /**
   * Start playback (requires user gesture on web)
   */
  async start(): Promise<void> {
    await Tone.start();
    Tone.getTransport().start();
    this._isPlaying = true;
  }

  /**
   * Stop playback
   */
  stop(): void {
    Tone.getTransport().stop();
    this._isPlaying = false;
  }

  /**
   * Internal: Schedule all steps in the current pattern
   */
  private _reschedule(): void {
    const transport = Tone.getTransport();
    transport.cancel();
    
    if (!this._pattern) return;

    const maxSteps = Math.max(...this._pattern.tracks.map(t => t.length), 16);
    
    // Schedule each track's steps
    this._pattern.tracks.forEach(track => {
      Object.values(track.steps).forEach(step => {
        if (step.type === 'off') return;

        // Calculate time position: step.index as 16th notes
        // Format: "bars:quarters:sixteenths"
        const bars = Math.floor(step.index / 16);
        const quarters = Math.floor((step.index % 16) / 4);
        const sixteenths = step.index % 4;
        const timePosition = `${bars}:${quarters}:${sixteenths}`;
        
        transport.schedule((scheduledTime) => {
          if (this._callback) {
            this._callback({
              trackId: track.id,
              instrumentId: track.instrument.id,
              step: step,
              time: scheduledTime
            });
          }
        }, timePosition);
      });
    });
    
    // Enable looping
    transport.loop = true;
    const loopBars = Math.ceil(maxSteps / 16);
    transport.loopEnd = `${loopBars}:0:0`;
  }
}

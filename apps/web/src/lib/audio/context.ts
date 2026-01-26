/**
 * Audio Context Singleton
 * 
 * Manages the global Tone.js context and provides utilities
 * for audio initialization (requires user gesture on web).
 */
import * as Tone from "tone";

let isInitialized = false;

/**
 * Initialize the audio context (must be called from user gesture)
 */
export async function initAudio(): Promise<void> {
  if (isInitialized) return;
  
  await Tone.start();
  isInitialized = true;
  console.log("🎵 Audio Context initialized");
}

/**
 * Check if audio is ready
 */
export function isAudioReady(): boolean {
  return isInitialized && Tone.getContext().state === "running";
}

/**
 * Get the current audio context state
 */
export function getAudioState(): AudioContextState {
  return Tone.getContext().state;
}

/**
 * Set the global BPM
 */
export function setBpm(bpm: number): void {
  Tone.getTransport().bpm.value = bpm;
}

/**
 * Get the current BPM
 */
export function getBpm(): number {
  return Tone.getTransport().bpm.value;
}

/**
 * Start the transport
 */
export function startTransport(): void {
  Tone.getTransport().start();
}

/**
 * Stop the transport
 */
export function stopTransport(): void {
  Tone.getTransport().stop();
  Tone.getTransport().cancel(); // Clear scheduled events
}

/**
 * Get transport time position
 */
export function getPosition(): string {
  return Tone.getTransport().position as string;
}

export { Tone };

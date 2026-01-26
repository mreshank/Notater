import { Pattern } from '../models/types';
import { write, AnyEvent, SetTempoEvent, EndOfTrackEvent, NoteOnEvent, NoteOffEvent } from 'midifile-ts';

const PPQ = 480; // Ticks per quarter note
const TICKS_PER_16TH = PPQ / 4;

export function patternToMidi(pattern: Pattern, bpm: number = 120): Uint8Array {
  // 1. Create tracks array
  const tracks: AnyEvent[][] = [];

  // 2. Tempo Track (Track 0)
  const microsecondsPerBeat = Math.round(60000000 / bpm);

  const tempoTrack: AnyEvent[] = [
    {
      deltaTime: 0,
      meta: true,
      type: 'meta',
      subtype: 'setTempo',
      microsecondsPerBeat: microsecondsPerBeat,
    } as SetTempoEvent,
    {
      deltaTime: 0,
      meta: true,
      type: 'meta',
      subtype: 'endOfTrack',
    } as EndOfTrackEvent
  ];
  tracks.push(tempoTrack);

  // 3. Convert Instrument Tracks
  pattern.tracks.forEach((track, i) => {
    const midiEvents: AnyEvent[] = [];
    
    // Sort steps by index
    const sortedSteps = Object.values(track.steps).sort((a, b) => a.index - b.index);

    // Absolute Event container
    interface AbsEvent {
      time: number;
      type: 'noteOn' | 'noteOff';
      note: number;
      velocity: number;
    }

    const absEvents: AbsEvent[] = [];

    sortedSteps.forEach(step => {
      if (step.type === 'off') return;

      const stepStartTick = step.index * TICKS_PER_16TH;
      const start = Math.max(0, Math.round(stepStartTick));
      const duration = Math.round(step.duration * PPQ); 
      const end = start + duration;

      const note = 60; 
      const velocity = Math.round(step.velocity * 127);

      absEvents.push({ time: start, type: 'noteOn', note, velocity });
      absEvents.push({ time: end, type: 'noteOff', note, velocity: 0 });
    });

    // Sort events by time
    absEvents.sort((a, b) => a.time - b.time);

    // Convert to Delta Time
    let lastTime = 0;
    absEvents.forEach(e => {
        const delta = e.time - lastTime;
        lastTime = e.time;
        
        if (e.type === 'noteOn') {
            midiEvents.push({
                deltaTime: delta,
                channel: i % 16, 
                type: 'channel',
                subtype: 'noteOn',
                noteNumber: e.note,
                velocity: e.velocity
            } as NoteOnEvent);
        } else {
            midiEvents.push({
                deltaTime: delta,
                channel: i % 16,
                type: 'channel',
                subtype: 'noteOff',
                noteNumber: e.note,
                velocity: e.velocity
            } as NoteOffEvent);
        }
    });

    // End Track
    midiEvents.push({
        deltaTime: 0,
        meta: true,
        type: 'meta',
        subtype: 'endOfTrack',
    } as EndOfTrackEvent);

    tracks.push(midiEvents);
  });

  // Note: write() takes tracks array as first arg, ticksPerBeat as second
  // Actually checking d.ts again: declare function write(tracks: AnyEvent[][], ticksPerBeat?: number): Uint8Array;
  return write(tracks, PPQ);
}

import { describe, it, expect } from 'vitest';
import { Pattern, Track } from '../models/types';
import { AudioEngine } from '../scheduler/Engine';

describe('Notater Core Logic', () => {
  it('should create a valid pattern structure', () => {
    const track: Track = {
      id: 't1',
      length: 16,
      instrument: {
        id: 'kick',
        name: 'Kick Drum',
        type: 'sampler',
        source: 'kick.wav',
        volume: 0,
        pan: 0,
        muted: false,
        solo: false,
        color: '#ff0000',
        effects: []
      },
      steps: {
        0: { id: 's1', index: 0, type: 'on', velocity: 1, duration: 0.25, microTiming: 0 },
        4: { id: 's2', index: 4, type: 'on', velocity: 1, duration: 0.25, microTiming: 0 }
      }
    };

    const pattern: Pattern = {
      id: 'p1',
      name: 'Test Pattern',
      bars: 1,
      tracks: [track]
    };

    expect(pattern.tracks.length).toBe(1);
    expect(pattern.tracks[0].steps[0].type).toBe('on');
  });

  it('should initialize the AudioEngine', () => {
    const engine = new AudioEngine();
    expect(engine).toBeDefined();
    expect(engine.isPlaying).toBe(false);
  });
});

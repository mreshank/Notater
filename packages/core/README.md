# @notater/core

Headless music engine for the Notater ecosystem.

## Installation

```bash
pnpm add notater
```

## Features

- 🎵 **Pattern & Track System** - Flexible data structures for beats
- ⏱️ **Audio Engine** - High-precision Tone.js scheduler
- 🎹 **MIDI Export** - Export patterns to standard MIDI files
- 📦 **Zero UI Dependencies** - Use anywhere (CLI, web, Node.js)

## Usage

### Audio Playback

```typescript
import { AudioEngine, type Pattern } from "notater";

const engine = new AudioEngine();

// Set tempo
engine.setBpm(120);

// Set pattern
engine.setPattern(myPattern);

// Register callback for step triggers
engine.setCallback((event) => {
  console.log(`Track ${event.trackId} step triggered at ${event.time}`);
});

// Start playback (requires user gesture on web)
await engine.start();

// Stop
engine.stop();
```

### MIDI Export

```typescript
import { patternToMidi, type Pattern } from "notater";
import fs from "fs";

const pattern: Pattern = {
  id: "my-pattern",
  name: "Demo Beat",
  bars: 1,
  tracks: [
    /* ... */
  ],
};

const midiData = patternToMidi(pattern);
fs.writeFileSync("output.mid", midiData);
```

## Types

```typescript
interface Pattern {
  id: string;
  name: string;
  tracks: Track[];
  bars: number;
}

interface Track {
  id: string;
  instrument: Instrument;
  steps: Record<number, Step>;
  length: number;
}

interface Step {
  id: string;
  index: number;
  type: "on" | "off" | "hold";
  velocity: number;
  duration: number;
  microTiming: number;
  pitch?: string;
}
```

## License

MIT

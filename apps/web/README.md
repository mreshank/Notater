# Notater PWA

> Gen-Z Edition Music Studio

A progressive web app for making beats, anywhere.

## Features

- 🎹 **MiniKeyboard** - Touch-friendly piano with 13 keys
- 🥁 **DrumPads** - 8-pad grid for finger drumming
- 🎼 **StepSequencer** - 16-step, 4-track drum sequencer
- 🎨 **Theme Engine** - Lo-Fi, Cyber, Neo-Brutalism themes
- 📱 **Offline-First** - Works without internet via Service Worker
- 💾 **IndexedDB** - Projects saved locally with Dexie.js

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 + CSS Variables
- **State**: Zustand
- **Audio**: Tone.js
- **Animations**: Framer Motion
- **PWA**: Serwist
- **Storage**: Dexie.js (IndexedDB)

## Development

```bash
# From monorepo root
pnpm dev --filter notater-pwa

# Or from this directory
pnpm dev
```

## Build

```bash
pnpm build
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with fonts
│   ├── page.tsx        # Landing page
│   ├── studio/page.tsx # Main studio interface
│   └── sw.ts           # Service Worker
├── components/
│   ├── MiniKeyboard.tsx
│   ├── DrumPads.tsx
│   └── StepSequencer.tsx
└── lib/
    ├── store.ts        # Zustand state
    ├── db.ts           # Dexie database
    └── audio/          # Tone.js modules
```

## Themes

Switch themes via the dropdown in the studio header:

| Theme | Description                    |
| ----- | ------------------------------ |
| Lo-Fi | Warm, cozy, Solarized-inspired |
| Cyber | Dark, neon, high contrast      |
| Neo   | Brutalist, stark, bold borders |

## License

MIT

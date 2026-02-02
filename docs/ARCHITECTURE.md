# Notater Architecture Guide

## 🏗 System Overview

Notater is a **client-side heavy, offline-first Progressive Web App (PWA)** for music production. It leverages modern web technologies to deliver a DAW-like experience in the browser.

```mermaid
graph TD
    User[User Interaction] --> UI[React UI Components]
    UI --> Store[Zustand Store]
    Store --> Audio[Audio Engine (Tone.js)]
    Store --> P2P[P2P Network (PeerJS)]
    P2P <--> Network[WebRTC Mesh]
    Audio --> Output[Web Audio API]
```

## 🧠 State Management (Zustand)

We use **Zustand** for global state management. The store is the single source of truth for:

- **Project Data**: Notes, patterns, song structure.
- **Audio State**: Playback status, BPM, instrument settings.
- **UI State**: Active panels, selected tools, modals.
- **Collaboration**: List of connected peers and their cursors.

**Key File:** `src/lib/store.ts`

The store not only holds data but also acts as the **controller** for the audio engine. Actions in the store (e.g., `playNote`) directly trigger Tone.js methods.

## 🔊 Audio Engine (Tone.js)

The audio engine is built on **Tone.js**. It handles synthesis, scheduling, and effects.

- **Synths**: `Tone.PolySynth` for melody, `Tone.MembraneSynth` & `Tone.NoiseSynth` for drums.
- **Scheduling**: We use `Tone.Transport` for precise timing.
- **Mixer**: A custom `MixerManager` handles channel routing, volume, and effects sends.

**Key Files:**

- `src/lib/audio/index.ts`: Entry point.
- `src/lib/audio/drums.ts`: Drum synthesis definitions.
- `src/lib/audio/mixer.ts`: Routing logic.

## 🤝 P2P Collaboration (WebRTC)

Real-time collaboration is achieved via a **custom P2P mesh network** using `PeerJS`. This allows users to connect directly without a central server for data relay.

### Protocol

1.  **Handshake**: Users exchange Peer IDs (via QR code or link).
2.  **Full Sync**: On join, the host sends the entire project state (`FULL_SYNC`).
3.  **Delta Updates**: User actions (e.g., adding a note) broadcast lightweight events (`PIANOROLL_UPDATE`).
4.  **Presence**: Cursor positions and user statuses are broadcast periodically.

**Key File:** `src/lib/p2p.ts`

## 📂 Directory Structure

```
apps/web/
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React UI components (PianoRoll, Drums, etc.)
│   ├── lib/
│   │   ├── audio/      # Tone.js wrappers and logic
│   │   ├── db.ts       # IndexedDB storage (Dexie.js)
│   │   ├── p2p.ts      # WebRTC networking
│   │   └── store.ts    # Global Zustand store
│   └── styles/         # Global CSS and Tailwind
```

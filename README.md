# Notater

> **Capture your sound using the web. Anywhere. Instantly.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build Status](https://github.com/mreshank/Notate/actions/workflows/ci.yml/badge.svg)](https://github.com/mreshank/Notate/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Tone.js](https://img.shields.io/badge/Audio-Tone.js-pink)](https://tonejs.github.io/)

Notater is an **offline-first, collaborative music production environment** running entirely in your browser. No installs, no accounts required to start—just open the link and make noise.

---

## 🎹 Why Notater?

We're building the "Google Docs for Music Production".

- **🤝 Real-time Collaboration**: Jam with friends instantly via P2P WebRTC. No central server latency for note updates.
- **🔊 Pro Audio Engine**: Built on Tone.js, featuring polyphonic synthesizers, samplers, and a complete effects chain (Reverb, Delay, EQ).
- **🥁 AI Drummer**: Stuck on a beat? Let our generative AI assist you with drum patterns.
- **📱 Install Everywhere**: A fully capable PWA that works offline on iOS, Android, and Desktop.

## 🚀 Quick Start

Get your local studio running in 30 seconds.

```bash
# 1. Clone the repo
git clone https://github.com/mreshank/Notate.git
cd Notate

# 2. Install dependencies (we use pnpm)
pnpm install

# 3. Start the Studio
pnpm --filter notater-pwa dev
```

Open [http://localhost:3000](http://localhost:3000) and turn up your volume. 🔈

## 🛠️ Architecture

Notater is a modern monorepo built for speed and scale.

| Package             | Purpose              | Stack                         |
| :------------------ | :------------------- | :---------------------------- |
| **`apps/web`**      | The Studio (PWA)     | Next.js 14, Zustand, Tailwind |
| **`packages/core`** | Headless music logic | pure TypeScript               |
| **`packages/cli`**  | Automation tools     | Commander                     |

For a deep dive into how the Audio Engine and P2P Sync work, check out the [Architecture Guide](docs/ARCHITECTURE.md).

## 🗺️ Roadmap

- [x] **Core Engine**: PolySynth, Drum Sampler, Sequencer.
- [x] **PWA**: Offline support, installability.
- [x] **P2P Sync**: Real-time session joining via WebRTC.
- [ ] **Cloud Save**: Persist projects to database.
- [ ] **VST Support**: Load WebAudio plugins.
- [ ] **Export**: Mix down to WAV/MP3.

## 🤝 Contributing

We love contributors! Whether you're fixing a typo or rewriting the synth engine, we welcome your help.

Read our [Contributing Guide](CONTRIBUTING.md) to get started.

1.  Fork it (`https://github.com/mreshank/Notate/fork`)
2.  Create your feature branch (`git checkout -b feature/cool-synth`)
3.  Commit your changes (`git commit -m 'feat: Add FM synthesis'`)
4.  Push to the branch (`git push origin feature/cool-synth`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/mreshank">mreshank</a>
</p>

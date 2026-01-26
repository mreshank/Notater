# Notater

> **Capture your sound. Anywhere. Instantly.**

A modern, offline-first music production ecosystem built with TypeScript.

[![Build Status](https://github.com/mreshank/Notate/actions/workflows/ci.yml/badge.svg)](https://github.com/mreshank/Notate/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🎵 Overview

Notater is a monorepo containing:

| Package                       | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| [`notater`](packages/core)    | Headless music engine - patterns, scheduling, MIDI export       |
| [`notater-cli`](packages/cli) | Command-line tools for project scaffolding and export           |
| [`notater-pwa`](apps/web)     | Progressive Web App with synths, sequencer, and offline support |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/mreshank/Notate.git
cd Notate

# Install dependencies
pnpm install

# Start the PWA development server
pnpm --filter notater-pwa dev

# Build all packages
pnpm build
```

## 📦 Packages

### Core (`packages/core`)

Headless music logic. Zero UI dependencies.

```typescript
import { AudioEngine, patternToMidi, type Pattern } from "notater";

const engine = new AudioEngine();
engine.setBpm(120);
await engine.start();
```

### CLI (`packages/cli`)

Command-line interface for power users.

```bash
# Create a new project
npx notater new

# Export pattern to MIDI
npx notater export output.mid --demo
```

### PWA (`apps/web`)

Gen-Z edition music studio with:

- 🎹 Interactive keyboard
- 🥁 Drum pads
- 🎼 16-step sequencer
- 🎨 Theme engine (Lo-Fi, Cyber, Neo-Brutalism)
- 📱 Offline-first PWA

## 🛠️ Development

```bash
# Run all tests
pnpm test

# Build all packages
pnpm build

# Lint all packages
pnpm lint
```

## 📄 License

MIT © [mreshank](https://github.com/mreshank)

# Contributing to Notater

First off, thanks for taking the time to contribute! 🎉

We follow a **"Ship fast, break nothing"** philosophy. We want your features, your bug fixes, and your ideas.

## 🛠 Development Setup

Notater is a monorepo managed by `pnpm`.

### Prerequisites

- Node.js 18+
- pnpm 8+

### Quick Start

1.  **Clone the repo**

    ```bash
    git clone https://github.com/mreshank/Notate.git
    cd Notate
    ```

2.  **Install dependencies**

    ```bash
    pnpm install
    ```

3.  **Start the specific app (PWA)**

    ```bash
    pnpm --filter notater-pwa dev
    ```

4.  **Open in browser**
    Navigate to `http://localhost:3000`.

## 🌳 Project Structure

- **`apps/web`**: The main Progressive Web App (Notater Studio). Most work happens here.
- **`packages/core`**: Shared logic (future use).
- **`packages/cli`**: CLI tools.

## workflow

1.  **Fork & Clone**: Fork the repo and clone it locally.
2.  **Branch**: Create a branch for your feature (`git checkout -b feature/amazing-synth`).
3.  **Code**: Write awesome code.
    - **Linting**: Run `pnpm lint` to check for style issues.
    - **Formatting**: We use Prettier.
4.  **Commit**: Use [Conventional Commits](https://www.conventionalcommits.org/).
    - `feat: add new reverb effect`
    - `fix: resolve mobile scrolling bug`
    - `docs: update readme`
5.  **Push & PR**: Push to your fork and open a Pull Request.

## 🧪 Testing

Before submitting, please verify your changes:

- **Manual Test**: Does it actually work? (Click the buttons!)
- **Lint**: `pnpm lint` in the `apps/web` directory.
- **Build**: `pnpm build` to ensure no build errors.

## ❓ Need Help?

Open a [Question Issue](https://github.com/mreshank/Notate/issues/new) or join our community discord (link coming soon!).

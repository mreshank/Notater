# @notater/cli

Command-line interface for the Notater ecosystem.

## Installation

```bash
# Global install
pnpm add -g notater-cli

# Or use with npx
npx notater-cli <command>
```

## Commands

### `new` - Create a new project

Interactive project scaffolding with genre presets.

```bash
notater new
```

**Options:**

- Project name
- Genre preset (Lofi, Trap, House, Techno, Blank)

Creates a `project.json` with:

- Project metadata
- BPM based on genre
- Empty pattern array

### `export` - Export to MIDI

Export patterns to standard MIDI files.

```bash
# Export from project
notater export output.mid

# Export demo pattern
notater export output.mid --demo
```

**Options:**

- `--demo, -d` - Export a demo pattern instead of loading from project

## Example Workflow

```bash
# Create a new project
notater new
# → "my-beat" directory created with project.json

# Edit patterns in the PWA or programmatically

# Export when ready
notater export my-beat.mid
```

## License

MIT

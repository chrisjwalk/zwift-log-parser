# Zwift Log Parser

A TypeScript command-line tool for parsing and analyzing Zwift activity log files. Built with [Bun](https://bun.sh) and [React Ink](https://github.com/vadimdemedes/ink).

## Features

- 📊 **FPS Analysis** — Visualize frame rate performance with ASCII graphs and statistics
- 🗺️ **Route Tracking** — Identify routes/activities with duration, distance, and elevation data
- 🌍 **World Sessions** — Track world changes and activity segments
- 💻 **System Information** — Extract GPU, CPU, RAM, resolution, and graphics settings
- 🎮 **Session Metadata** — View game version, launcher version, device info, and timestamps
- 📤 **JSON Export** — Output data as JSON for further processing
- 🔧 **Flexible Options** — Enable/disable specific analysis sections as needed
- 📁 **Interactive File Picker** — Browse and select log files if no path is provided

## Installation

### From npm

```bash
npm install -g zwift-log-parser
zwift-log-parser /path/to/your/Log.txt
```

### Local Development

```bash
git clone https://github.com/chrisjwalk/zwift-log-parser.git
cd zwift-log-parser
bun install
bun run build
npm link          # makes the zwift-log-parser command available globally
zwift-log-parser /path/to/your/Log.txt
```

## Usage

### Basic Usage

```bash
zwift-log-parser /path/to/Log.txt
```

If no file path is provided, an interactive file picker will launch:

```bash
zwift-log-parser
```

### Command-Line Options

```
zwift-log-parser [logfile] [options]

Arguments:
  logfile            Path to Zwift log file to parse

Options:
  -V, --version      Output the version number
  --no-fps           Skip FPS analysis and graphs
  --no-routes        Skip route/activity information
  --no-metadata      Skip session and system metadata
  --json             Output results as JSON instead of formatted display
  -h, --help         Display help information
```

### Examples

```bash
# Analyze everything (default)
zwift-log-parser ~/Documents/Zwift/Logs/Log.txt

# Routes and metadata only, no FPS graph
zwift-log-parser ~/Documents/Zwift/Logs/Log.txt --no-fps

# Export to JSON for further processing
zwift-log-parser ~/Documents/Zwift/Logs/Log.txt --json > output.json

# FPS analysis only
zwift-log-parser ~/Documents/Zwift/Logs/Log.txt --no-routes --no-metadata
```

## Sample Output

```
🚴 Zwift Log Parser v0.0.1

Session Information
  Log Date/Time:  21:09:07 2026-01-08
  Game Version:   1.104.4(157262) rc/1.104.4
  Device:         PC

System Information
  GPU:            NVIDIA GeForce RTX 5060/PCIe/SSE2
  Driver:         4.6.0 NVIDIA 591.74
  CPU:            12th Gen Intel(R) Core(TM) i5-12600KF
  RAM:            64GB
  Resolution:     1920x1080
  Graphics:       ultra

Worlds
  Watopia
  • Triple Flat Loops
  • The Big Ring

FPS Analysis

  📍 Watopia

     126.00 ┤
     121.33 ┤  ╭───╮                     ╭──────╮
     116.67 ┼──╯   │        ╭╮           │      ╰╮
     ...

  Time: 1h 48m 52s | Average: 99.76 | Min: 61.73 | Max: 120.97
```

## Development

### Project Structure

This is a Bun workspace monorepo with two packages:

```
core/                       # Parser library (@zwift-log-parser/core)
├── src/
│   ├── index.ts            # Library entry point
│   └── lib/
│       ├── parser.ts       # ZwiftLogParser class
│       ├── file-picker.ts  # Interactive file picker
│       └── __fixtures__/   # Test data (real log files)
└── package.json

cli/                        # CLI application
├── src/
│   ├── main.tsx            # Entry point — argument parsing
│   ├── App.tsx             # Root React Ink component
│   └── components/         # Individual UI panel components
│       ├── Banner.tsx
│       ├── MetadataPanel.tsx
│       ├── WorldsPanel.tsx
│       ├── FpsPanel.tsx
│       └── Section.tsx
└── package.json

scripts/
└── build.ts                # Bun build script (bundles CLI via esbuild)

bin/
└── zwift-log-parser.js     # npm bin wrapper
```

### Available Commands

```bash
bun install              # Install dependencies
bun run build            # Build CLI bundle to dist/
bun run dev              # Run CLI directly with Bun (no build needed)
bun start                # Run the built CLI from dist/
bun test                 # Run all tests
bun lint                 # Lint all source files with ESLint
bun run clean            # Remove build artifacts
bun run pack             # Create npm tarball in dist/
```

### Development Workflow

```bash
# 1. Install dependencies
bun install

# 2. Run directly without building (fastest iteration)
bun run dev /path/to/Log.txt

# 3. Build for production
bun run build

# 4. Test the built bundle
bun start /path/to/Log.txt

# 5. Run tests
bun test

# 6. Lint
bun lint
```

### Publishing to npm

```bash
# Bump version, build, and publish
npm version patch
bun run build
npm publish --access public
```

To test the package locally before publishing:

```bash
bun run pack
npm install -g dist/zwift-log-parser-<version>.tgz
```

## Technology Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript 6.0
- **UI**: [React Ink](https://github.com/vadimdemedes/ink) 7 (terminal UI, React 19)
- **Bundler**: esbuild (via Bun build API)
- **CLI Arg Parsing**: Commander.js
- **FPS Graphs**: asciichart
- **File Picker**: @inquirer/prompts
- **Testing**: Vitest
- **Linting**: ESLint 10 + typescript-eslint

## Architecture

### Core Library (`@zwift-log-parser/core`)

Provides the `ZwiftLogParser` class and `pickFile()` utility:

- `parseMetadata(content)` — session and system info
- `parseRouteSessions(content)` — routes and world sessions with timing
- `parseFPSLines(content)` — raw FPS sample array
- `parseFpsPerWorld(content)` — FPS data grouped by world, with timestamps
- `calculateFpsStats(fps)` — average, min, max statistics
- `downsampleData(data, width)` — reduce data points for graph rendering

### CLI Application

Built with React Ink — the terminal output is a rendered React component tree. Commander.js handles argument and option parsing before React renders.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

# Zwift Log Parser

A powerful TypeScript command-line tool for parsing and analyzing Zwift activity log files. Extract session metadata, system information, route/world details, and visualize FPS performance over time.

## Features

- 📊 **FPS Analysis** - Visualize frame rate performance with ASCII graphs and statistics
- 🗺️ **Route Tracking** - Identify routes/activities with duration, distance, and elevation data
- 🌍 **World Sessions** - Track world changes and activity segments
- 💻 **System Information** - Extract GPU, CPU, RAM, resolution, and graphics settings
- 🎮 **Session Metadata** - View game version, launcher version, device info, and timestamps
- 🎨 **Color-Coded Output** - Easy-to-read console output with syntax highlighting
- 📤 **JSON Export** - Output data as JSON for further processing
- 🔧 **Flexible Options** - Enable/disable specific analysis sections as needed
- 📁 **Interactive File Picker** - Browse and select log files if no path provided

## Installation

### From npm (once published)

```bash
npm install -g zwift-log-parser
zwift-log-parser /path/to/your/logfile.log
```

### Local Development

```bash
git clone https://github.com/chrisjwalk/zwift-log-parser.git
cd zwift-log-parser
npm install
npm run build
npm link
zwift-log-parser /path/to/your/logfile.log
```

## Usage

### Basic Usage

```bash
zwift-log-parser /path/to/Log.txt
```

If no file path is provided, an interactive file picker will appear:

```bash
zwift-log-parser
```

### Command-Line Options

```bash
zwift-log-parser [logfile] [options]

Arguments:
  logfile                 Path to Zwift log file to parse

Options:
  -V, --version          Output the version number
  --no-fps               Skip FPS analysis and graphs
  --no-routes            Skip route/activity information
  --no-metadata          Skip session and system metadata
  --json                 Output results as JSON instead of formatted text
  -h, --help             Display help information
```

### Examples

```bash
# Analyze everything (default)
zwift-log-parser ~/Documents/Zwift/Logs/Log.txt

# Only show routes and metadata, skip FPS
zwift-log-parser ~/Documents/Zwift/Logs/Log.txt --no-fps

# Export to JSON for further processing
zwift-log-parser ~/Documents/Zwift/Logs/Log.txt --json > output.json

# Only show FPS analysis
zwift-log-parser ~/Documents/Zwift/Logs/Log.txt --no-routes --no-metadata
```

## Sample Output

### Session Information
```
═══════════════════════════════════════════════════
  Session Information
═══════════════════════════════════════════════════
🕐 Log Time:        20:34:51 2024-10-27
🎮 Game Version:    1.71.0 (138908)
📱 Device:          Windows (x64)
🚀 Launcher:        2.4.1 (48)
💻 System Configuration
═══════════════════════════════════════════════════
```

### Route/Activity Information
```
═══════════════════════════════════════════════════
  Routes & Activities
═══════════════════════════════════════════════════
🌍 Watopia
  📍 Volcano Circuit (2 laps) — 23:45 (14.2 km, 168 m)
```

### FPS Graph
```
═══════════════════════════════════════════════════
  FPS Analysis (1,425 samples)
═══════════════════════════════════════════════════
   60.00 ┤  ╭───╮  ╭──╮     ╭─╮
   55.00 ┤──╯   ╰──╯  ╰─────╯ ╰───
   50.00 ┤
   45.00 ┤
   40.00 ┤
         └─────────────────────────
  Average: 57.3 fps | Min: 45.2 fps | Max: 60.0 fps
```

## Development

### Project Structure

This is an Nx monorepo with two projects:

```
core/                           # Parser library (@zwift-log-parser/core)
├── src/
│   ├── index.ts               # Library entry point
│   └── lib/
│       ├── parser.ts          # ZwiftLogParser class
│       └── file-picker.ts     # Interactive file picker
└── project.json               # Nx project configuration

cli/                            # CLI application
├── src/
│   └── main.ts                # CLI entry point with Commander.js
└── project.json               # Nx project configuration

bin/
└── zwift-log-parser.js        # Global CLI wrapper
```

### Available Commands

```bash
npm install               # Install dependencies
npm run build            # Build all projects (core + cli)
npm start                # Run the built CLI application
npm run dev              # Watch mode - rebuilds on changes
npm run zwift-log-parser # Run CLI without building (uses tsx)
npm test                 # Run all tests with Vitest
npm run lint             # Lint all projects with ESLint
npm run clean            # Remove build artifacts
npm run pack             # Create npm package tarball
```

### Running Specific Nx Tasks

```bash
npx nx run core:build    # Build core library only
npx nx run cli:build     # Build CLI only
npx nx run core:test     # Test core library
npx nx run cli:test      # Test CLI
npx nx run core:lint     # Lint core library
npx nx run cli:lint      # Lint CLI
npx nx graph             # View project dependency graph
```

### Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Run without building (fastest for development)
npm run zwift-log-parser -- /path/to/logfile.log

# 3. Build for production
npm run build

# 4. Test the built version
npm start -- /path/to/logfile.log

# 5. Run tests
npm test

# 6. Lint code
npm run lint
```

## Technology Stack

- **Language**: TypeScript 5.9
- **Build System**: Nx 22.3.3 (monorepo orchestration)
- **Runtime**: Node.js (ESM modules)
- **Bundler**: esbuild (CLI), tsc (library)
- **Testing**: Vitest 4.0
- **Linting**: ESLint 9.8
- **CLI Framework**: Commander.js 14.0
- **UI Libraries**: 
  - chalk 5.3 (colored output)
  - asciichart 1.5 (FPS graphs)
  - @inquirer/prompts 8.2 (file picker)

## Architecture

### Core Library (`@zwift-log-parser/core`)

The core library provides:
- `ZwiftLogParser` class - Main parser with methods for extracting metadata, FPS data, routes, and worlds
- `pickFile()` function - Interactive file picker for selecting log files
- TypeScript types and interfaces for all parsed data structures

### CLI Application

The CLI application:
- Uses Commander.js for argument parsing and help generation
- Provides formatted, color-coded console output
- Supports JSON export for programmatic use
- Imports and uses the core library for all parsing logic

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT
- **Type Checking**: Strict mode enabled

## Features

- Parse Zwift activity log files
- Extract and analyze activity data
- Console-based interface

## Publishing

When you're ready to publish to the npm registry (ensure the package name is unique):

```bash
# bump version, build, and publish
npm version patch
npm publish --access public
```

If you want to test the package locally before publishing, use `npm pack` and then install via `npm install ./zwift-log-parser-<version>.tgz` in a temporary project (no global permissions required).

## Contributing

Feel free to extend the parser with additional features and log format support.

## License

MIT

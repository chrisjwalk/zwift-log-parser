# Zwift Log Parser

A TypeScript monorepo for parsing and analyzing Zwift activity log files. Built with Nx for optimal developer experience.

## Installation

```bash
npm install
```

## Quick Start

### Running (Development - No Build Required)

```bash
npm run zwift-log-parser -- /path/to/logfile.log
```

### Running (Production Build)

```bash
npm run build
npm start -- /path/to/logfile.log
```

### Install & Usage

Install globally from npm (once published):

```bash
npm install -g zwift-log-parser
zwift-log-parser /path/to/your/logfile.log
```

Or test locally using npm link from the project root:

```bash
npm install
npm run build
npm link
zwift-log-parser /path/to/your/logfile.log
```

The package exposes a global command `zwift-log-parser` that prints session metadata, route information, and FPS graphs.

## Development

### Available Commands

```bash
npm run build          # Build all projects (core + cli)
npm run dev            # Watch mode - rebuilds on changes
npm run clean          # Remove build artifacts
npm run lint           # Lint all projects
npm test               # Run all tests
npm run pack           # Create npm package tarball
```

### Running Specific Projects

```bash
npx nx run core:build  # Build core library only
npx nx run cli:build   # Build CLI only
npx nx run core:test   # Test core library
npx nx run cli:test    # Test CLI
npx nx run core:lint   # Lint core library
npx nx run cli:lint    # Lint CLI
```

## Project Structure

This is an Nx monorepo with the following structure:

```
core/                    # Parser library (@zwift-log-parser/core)
├── src/
│   ├── index.ts        # Library entry point
│   └── lib/
│       └── parser.ts   # ZwiftLogParser class
├── project.json        # Nx project configuration
└── vite.config.mts     # Vitest configuration

cli/                     # CLI application
├── src/
│   └── main.ts         # CLI entry point
├── project.json        # Nx project configuration
└── vite.config.mts     # Vitest configuration

bin/
└── zwift-log-parser.js # Global CLI wrapper

dist/                    # Compiled output
├── core/               # Built library
└── cli/                # Built CLI application
```

## Technology Stack

- **Language**: TypeScript 5.3
- **Runtime**: Node.js (ES2020)
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

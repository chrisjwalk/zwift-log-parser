# Zwift Log Parser

A TypeScript console application for parsing and analyzing Zwift activity log files.

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Running

```bash
npm start
```

To parse a specific log file (dev):
```bash
npm start -- /path/to/logfile.log
```

### Install & Usage

Install globally from npm (once published):

```bash
npm install -g zwift-log-parser
```

Or test locally using npm link from the project root:

```bash
npm install
npm run build
npm link
# then run
zwift-log-parser /path/to/your/logfile.log
```

You can also run it directly from the repo during development:

```bash
npm run zwift-log-parser -- /path/to/logfile.log
```

The package exposes a global command `zwift-log-parser` that prints session metadata, route information, and FPS graphs.

## Development

Watch mode for continuous compilation:
```bash
npm run dev
```

Clean build artifacts:
```bash
npm run clean
```

## Project Structure

```
src/
├── index.ts          # Main entry point
└── ...               # Additional parser modules (TBD)
dist/                 # Compiled JavaScript output
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

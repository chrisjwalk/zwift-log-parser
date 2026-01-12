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

To parse a specific log file:
```bash
npm start -- /path/to/logfile.log
```

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

## Contributing

Feel free to extend the parser with additional features and log format support.

## License

MIT

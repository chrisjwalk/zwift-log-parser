# Zwift Log Parser - Project Setup

This is an Nx monorepo containing a TypeScript library and CLI application for parsing Zwift log files and analyzing performance data.

## Project Details
- **Type**: Nx Monorepo with Library + CLI Application
- **Build System**: Nx 22.3.3
- **Language**: TypeScript 5.9
- **Primary Purpose**: Parse and analyze Zwift activity log files with FPS metrics and route information
- **Runtime**: tsx (development), Node.js ESM (production)

## Architecture

### Projects
1. **core** (`@zwift-log-parser/core`) - Library containing parser logic
   - Location: `core/src/lib/parser.ts`
   - Exports: `ZwiftLogParser` class and types
   - Build: `@nx/js:tsc` executor
   
2. **cli** - Command-line interface application
   - Location: `cli/src/main.ts`
   - Imports from `@zwift-log-parser/core`
   - Build: `@nx/esbuild:esbuild` executor (ESM, bundled)

## Development Workflow
1. Install dependencies: `npm install`
2. Run without building: `npm run zwift-log-parser -- /path/to/logfile.log`
3. Build all projects: `npm run build`
4. Run built version: `npm start -- /path/to/logfile.log`
5. Watch mode: `npm run dev`
6. Run tests: `npm test`
7. Lint code: `npm run lint`

## Nx Commands
- `npx nx run core:build` - Build core library
- `npx nx run cli:build` - Build CLI application
- `npx nx run core:test` - Run core tests
- `npx nx run cli:test` - Run CLI tests
- `npx nx run core:lint` - Lint core library
- `npx nx run cli:lint` - Lint CLI application
- `npx nx run-many --target=build --projects=core,cli` - Build all
- `npx nx graph` - View dependency graph

## Features
- **Session Metadata**: Extract game version, device info, launcher version
- **System Information**: GPU, driver version, CPU, RAM, resolution, graphics settings
- **Route Tracking**: Identify route changes and calculate duration on each route
- **FPS Analysis**: Graph FPS over time with statistics (average, min, max)
- **Colored Output**: Color-coded console output for easy reading
- **Modular Design**: Separate library and CLI for potential reuse

## Status
- [x] Nx monorepo setup
- [x] Core library project (parser)
- [x] CLI application project
- [x] TypeScript path mappings configured
- [x] Build targets configured
- [x] Test infrastructure (Vitest)
- [x] Linting configured (ESLint)
- [x] Package publishing configured
- [x] FPS graphing implemented
- [x] Route/activity detection added
- [x] Duration calculation for routes
- [x] Color-coded output with chalk
- [x] Comprehensive test coverage
- [x] Documentation updated

## Available VS Code Tasks
- **Build Zwift Parser**: Compiles TypeScript to JavaScript (Ctrl+Shift+B)
- **Run Zwift Parser**: Executes the compiled application
- **Watch & Compile**: Continuously compiles on file changes


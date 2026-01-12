# Zwift Log Parser - Project Setup

This is a TypeScript console application for parsing Zwift log files and analyzing performance data.

## Project Details
- **Type**: Node.js Console Application
- **Language**: TypeScript
- **Primary Purpose**: Parse and analyze Zwift activity log files with FPS metrics and route information
- **Runtime**: ts-node (direct TypeScript execution)

## Development Workflow
1. Install dependencies: `npm install`
2. Run: `npm run zwift-log-parser -- /path/to/logfile.log`
3. Watch mode: `npm run dev`
4. Build: `npm run build` (compiles to JavaScript)

## Features
- **Session Metadata**: Extract game version, device info, launcher version
- **System Information**: GPU, driver version, CPU, RAM, resolution, graphics settings
- **Route Tracking**: Identify route changes and calculate duration on each route
- **FPS Analysis**: Graph FPS over time with statistics (average, min, max)
- **Colored Output**: Color-coded console output for easy reading

## Status
- [x] Project scaffolding
- [x] Dependencies installed
- [x] Compilation verified
- [x] Build and run tasks configured
- [x] FPS graphing implemented
- [x] Route/activity detection added
- [x] Duration calculation for routes
- [x] Color-coded output with chalk

- [x] Documentation complete

## Available VS Code Tasks
- **Build Zwift Parser**: Compiles TypeScript to JavaScript (Ctrl+Shift+B)
- **Run Zwift Parser**: Executes the compiled application
- **Watch & Compile**: Continuously compiles on file changes


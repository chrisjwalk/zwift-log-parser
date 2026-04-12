# Zwift Log Parser — Agent Guidelines

## Project Overview

This is a **Bun workspace monorepo** containing a TypeScript CLI tool for parsing Zwift activity log files. It uses React Ink for terminal UI rendering.

## Workspace Structure

```
core/   — Parser library (@zwift-log-parser/core)
cli/    — React Ink CLI application
```

## Key Commands

```bash
bun install          # Install dependencies
bun test             # Run all tests
bun lint             # Lint with ESLint
bun run build        # Bundle CLI to dist/
bun run dev          # Run CLI directly (no build needed)
bun start            # Run the built CLI from dist/
bun run clean        # Remove dist/
```

## Development Guidelines

- **Runtime**: Bun — use `bun` for all installs, test runs, and script execution
- **Tests**: Written with Vitest (compatible with `bun test`). Always run `bun test` after making changes
- **Linting**: ESLint 10 + typescript-eslint. Run `bun lint` to check; zero warnings is the standard
- **No Nx**: This project does not use Nx. Do not use `nx`, `project.json`, or Nx-specific tooling
- **Imports**: The core package is imported as `@zwift-log-parser/core` (resolved via Bun workspaces)
- **Test mocks**: Use explicit factory functions with `vi.mock()` — Bun's test runner does not support auto-mocking without a factory

## Tech Stack

- **Bun** — runtime, package manager, test runner
- **TypeScript 6** — strict mode
- **React 19 + Ink 7** — terminal UI
- **ESLint 10 + typescript-eslint** — linting
- **Vitest** — test framework
- **esbuild** (via Bun build API) — production bundler


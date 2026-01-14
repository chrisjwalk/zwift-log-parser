#!/usr/bin/env node

// Lightweight CLI shim that runs the compiled CLI output at dist/cli/main.js
// Keep this file minimal so it can be executed directly from the package 'bin' field
import('../dist/cli/main.js');

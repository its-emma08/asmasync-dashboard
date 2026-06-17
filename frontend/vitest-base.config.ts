// Learn more about Vitest configuration: https://vitest.dev/config/
//
// This file is discovered by `@angular/build:unit-test` (used by `ng test`)
// AND supports direct `npx vitest run` invocations.
//
// Key flags:
//   globals: true    → describe / it / expect / vi are available without imports
//   environment      → jsdom simulates the browser DOM (falls back to happy-dom if installed)
//   setupFiles       → imports @angular/compiler so TestBed JIT works outside the CLI wrapper

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    // Keep tests isolated by default; the Angular builder overrides this when needed.
    isolate: true,
    // Reporters — verbose locally, CI-friendly otherwise
    reporters: process.env['CI'] ? ['default'] : ['verbose'],
  },
});

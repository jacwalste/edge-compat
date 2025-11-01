import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  splitting: false,
  treeshake: true,
  external: ['ts-morph', 'esbuild', 'jscodeshift'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});


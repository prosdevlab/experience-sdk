import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'iife'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  outDir: 'dist',
  globalName: 'experiences',
  // Bundle dependencies for IIFE (script tag)
  noExternal: ['@lytics/sdk-kit', '@lytics/sdk-kit-plugins', '@prosdevlab/experience-sdk-plugins'],
});

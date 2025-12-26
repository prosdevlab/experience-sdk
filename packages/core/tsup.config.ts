import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: {
    'experience-sdk': 'src/index.ts',
  },
  // Only build ESM in watch mode (faster, no bundling issues)
  // Build both ESM and IIFE in production
  format: options.watch ? ['esm'] : ['esm', 'iife'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: !options.watch, // Don't minify in watch mode for faster builds
  outDir: 'dist',
  globalName: 'experiences',
  // Bundle all dependencies for IIFE (script tag) in production
  // In watch mode (ESM only), external workspace packages to avoid resolution issues
  noExternal: options.watch
    ? ['@lytics/sdk-kit', '@lytics/sdk-kit-plugins']
    : ['@lytics/sdk-kit', '@lytics/sdk-kit-plugins', '@prosdevlab/experience-sdk-plugins'],
  external: options.watch ? ['@prosdevlab/experience-sdk-plugins'] : [],
}));

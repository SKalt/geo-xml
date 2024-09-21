/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { doctest } from 'vite-plugin-doctest';
export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/geojson-to-gml-3.2.1',

  plugins: [doctest({})],

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: 'src/index.ts',
      name: 'geojson-to-gml-3',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [],
    },
  },
  test: {
    includeSource: ['./src/**/*.[jt]s'],
  },
});

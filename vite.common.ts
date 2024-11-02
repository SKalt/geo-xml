/// <reference types='vitest' />
import { defineConfig, UserConfig } from 'vite';
const base: UserConfig = defineConfig({
  root: __dirname,

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
    minify: true,

    lib: {
      entry: 'src/index.ts',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [],
      // output: { exports: 'named' },
    },
  },
  test: {
    includeSource: ['./src/**/*.ts'],
    include: ['**/*.{test,spec,example}.ts'],
  },
});
export default base;

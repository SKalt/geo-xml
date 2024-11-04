/// <reference types='vitest' />
import { defineConfig, LibraryOptions } from 'vite';
import base from '../../vite.common.js';
const lib = base.build!.lib! as LibraryOptions;
export default defineConfig({
  ...base,

  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/fes-2',

  build: {
    ...base.build,
    lib: {
      ...lib,
      name: 'fes-2',
    },
  },
});

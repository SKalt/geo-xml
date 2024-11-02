/// <reference types='vitest' />
import { defineConfig, LibraryOptions } from 'vite';
import base from '../../vite.common';
const lib = base.build!.lib! as LibraryOptions;
export default defineConfig({
  ...base,

  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/geojson-to-wfs-t-2',

  build: {
    ...base.build,
    lib: {
      ...lib,
      name: 'geojson-to-wfs-t-2',
    },
  },
});

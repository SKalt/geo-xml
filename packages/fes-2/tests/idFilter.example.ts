import { test, expect } from 'vitest';
import { NsRegistry } from 'minimxml';
import { filter, idFilter } from '../src/index.js';

test('simple ID filter', () => {
  expect(filter(idFilter('my_layer.id'))(new NsRegistry())).toMatchFileSnapshot(
    './snapshots/idFilter.xml',
  );
});

import { test, expect } from 'vitest';
import { NsRegistry } from 'minimxml/src';
import { filter, idFilter } from '../src';

test('simple ID filter', () => {
  expect(filter(idFilter('my_layer.id'))(new NsRegistry())).toMatchFileSnapshot(
    './snapshots/idFilter.xml',
  );
});

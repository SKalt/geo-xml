import { filter, idFilter } from '@geo-xml/fes-2';
import { update } from '../src/index.js';
import { test, expect } from 'vitest';
import { NsRegistry } from 'minimxml';

test('simple update', () => {
  const layer = 'tasmania_roads' as const;
  const actual = update({
    filter: filter(idFilter(`${layer}.id`)),
    properties: { TYPE: 'rainbow' },
    action: 'replace', // this is the default
    layer,
  })(new NsRegistry());
  expect(actual).toMatchFileSnapshot('./snapshots/update.example.xml');
});

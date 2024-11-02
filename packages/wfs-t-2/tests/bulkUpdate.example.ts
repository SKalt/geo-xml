import { filter, idFilter } from 'geojson-to-fes-2';
import { bulkUpdate } from '../src/update.js';
import { test, expect } from 'vitest';
import { NsRegistry } from 'minimxml';

test('bulk update', () => {
  const actual = bulkUpdate([
    {
      action: 'replace', // this is the default
      layer: 'one_layer',
      filter: filter(idFilter(`one_layer.123`)),
      properties: { unicorn: 'rainbow' },
    },
    {
      action: 'remove',
      filter: filter(idFilter(`other_layer.456`)),
      layer: 'other_layer',
    },
  ])(new NsRegistry());
  expect(actual).toMatchFileSnapshot('./snapshots/bulkUpdate.example.xml');
});

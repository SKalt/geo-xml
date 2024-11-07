import { NsRegistry } from 'minimxml';
import { type Feature } from 'geojson';
import { insert } from '../src/index.js';
import { test, expect } from 'vitest';

test('inserting a feature', () => {
  const f: Feature<null> = {
    type: 'Feature',
    id: 13,
    properties: { TYPE: 'rainbow' },
    geometry: null,
  };
  const layer = 'tasmania_roads';
  const nsUri = 'http://www.openplans.org/topp' as const;
  const actual = insert(
    f,
    { nsUri, convertGeom: null },
    { layer },
  )(new NsRegistry());

  expect(actual).toMatchFileSnapshot('./snapshots/insert.example.xml');
});

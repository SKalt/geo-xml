import { NsRegistry } from 'minimxml';
import { filter, idFilter } from '@geo-xml/fes-2';
import { replace } from '../src/index.js';
import { Feature } from 'geojson';
import { test, expect } from 'vitest';

test('replacing a feature by id', () => {
  const ns = new NsRegistry();
  const f: Feature<null> = {
    type: 'Feature',
    id: 13,
    properties: { TYPE: 'rainbow' },
    geometry: null,
  };
  const layer = 'tasmania_roads';
  const nsUri = 'http://www.openplans.org/topp' as const;
  const actual = replace([f], {
    filter: filter(idFilter(`${layer}.${f.id}`)),
    nsUri,
    convertGeom: null,
  })(ns);

  expect(actual).toMatchFileSnapshot('./snapshots/replace.example.xml');
});

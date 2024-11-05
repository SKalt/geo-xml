import type { Geometry } from 'geojson';
import gml from '../src/index.js';
import { it, expect } from 'vitest';

it('can convert any geometry to GML', () => {
  const nullIsland: Geometry = {
    type: 'Point',
    coordinates: [0, 0],
  };
  // prettier-ignore
  expect(gml(nullIsland)()).toMatchFileSnapshot('./snapshots/nullIsland.gml');
});

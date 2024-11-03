import type { LineString } from 'geojson';
import { lineString } from '../src/index.js';
import { it, expect } from 'vitest';

it('supports tree-shaking for slimmer builds', () => {
  const line: LineString = {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [1, 1],
    ],
  };
  expect(lineString(line)()).toMatchFileSnapshot('./snapshots/treeShaking.gml');
});

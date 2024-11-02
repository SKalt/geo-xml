import { type Point } from 'geojson';
import { expect, test } from 'vitest';
import { point } from '../src/index.js';

test('point', () => {
  const geom: Point = { type: 'Point', coordinates: [102.0, 0.5] };
  expect(point(geom)()).toMatchFileSnapshot('./snapshots/point.gml');
});

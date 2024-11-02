import { type LineString } from 'geojson';
import { expect, test } from 'vitest';
import { lineString } from '../src';

test('lineString', () => {
  const geom: LineString = {
    type: 'LineString',
    coordinates: [
      [102.0, 0.0],
      [103.0, 1.0],
      [104.0, 0.0],
      [105.0, 1.0],
    ],
  };
  expect(lineString(geom)()).toMatchFileSnapshot('./snapshots/line.gml');
});

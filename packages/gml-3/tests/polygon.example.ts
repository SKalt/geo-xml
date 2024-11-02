import { type Polygon } from 'geojson';
import { expect, test } from 'vitest';
import { polygon } from '../src';

test('polygon', () => {
  const geom: Polygon = {
    type: 'Polygon',
    coordinates: [
      [
        [100.0, 0.0],
        [101.0, 0.0],
        [101.0, 1.0],
        [100.0, 1.0],
        [100.0, 0.0],
      ],
    ],
  };
  expect(polygon(geom)()).toMatchFileSnapshot('./snapshots/polygon.gml');
});

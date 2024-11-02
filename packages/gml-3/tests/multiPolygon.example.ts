import { type MultiPolygon } from 'geojson';
import { expect, test } from 'vitest';
import { multiPolygon } from '../src/index.js';
import { point } from 'geojson-to-gml-3';

test('multiPolygon', () => {
  const geom: MultiPolygon = {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [102.0, 2.0],
          [103.0, 2.0],
          [103.0, 3.0],
          [102.0, 3.0],
          [102.0, 2.0],
        ],
      ],
      [
        [
          [100.0, 0.0],
          [101.0, 0.0],
          [101.0, 1.0],
          [100.0, 1.0],
          [100.0, 0.0],
        ],
        [
          [100.2, 0.2],
          [100.8, 0.2],
          [100.8, 0.8],
          [100.2, 0.8],
          [100.2, 0.2],
        ],
      ],
    ],
  };
  expect(multiPolygon(geom)()).toMatchFileSnapshot(
    './snapshots/multipolygon.gml',
  );
});

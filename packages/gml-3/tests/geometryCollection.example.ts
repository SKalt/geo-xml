import { type GeometryCollection } from 'geojson';
import { expect, test } from 'vitest';
import { geometryCollection } from '../src/index.js';

test('geometryCollection', () => {
  const geom: GeometryCollection = {
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: [100.0, 0.0] },
      {
        type: 'LineString',
        coordinates: [
          [101.0, 0.0],
          [102.0, 1.0],
        ],
      },
    ],
  };
  expect(geometryCollection(geom)()).toMatchFileSnapshot(
    './snapshots/geometrycollection.gml',
  );
});

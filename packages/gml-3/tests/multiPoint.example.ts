import { type MultiPoint } from 'geojson';
import { expect, test } from 'vitest';
import { multiPoint } from '../src';

test('multiPoint', () => {
  const geom: MultiPoint = {
    type: 'MultiPoint',
    coordinates: [
      [100.0, 0.0],
      [101.0, 1.0],
    ],
  };
  expect(multiPoint(geom)()).toMatchFileSnapshot('./snapshots/multipoint.gml');
});

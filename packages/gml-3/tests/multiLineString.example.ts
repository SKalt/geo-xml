import { MultiLineString } from 'geojson';
import { expect, test } from 'vitest';
import { multiLineString } from '../src';

test('multiLineString', () => {
  const geom: MultiLineString = {
    type: 'MultiLineString',
    coordinates: [
      [
        [100.0, 0.0],
        [101.0, 1.0],
      ],
      [
        [102.0, 2.0],
        [103.0, 3.0],
      ],
    ],
  };
  expect(multiLineString(geom)()).toMatchFileSnapshot(
    './snapshots/multilinestring.gml',
  );
});

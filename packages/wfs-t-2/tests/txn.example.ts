import { test, expect } from 'vitest';
import { insert, transaction } from '../src/index.js';
import { point, geometry } from 'geojson-to-gml-3';
import { Feature, Point } from 'geojson';

const nsUri = 'http://example.com/myFeature' as const;

test('empty transaction', () => {
  const actual = transaction([], { srsName: 'EPSG:4326' })();
  // prettier-ignore
  expect(actual).toMatchFileSnapshot('./snapshots/txn.empty.xml');
});

const f: Feature<Point, { a: number }> & { lyr: { id: string } } = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties: { a: 1 },
  lyr: { id: 'myLayer' },
};

test('use a specific geojson-to-gml converter', () => {
  const actual = transaction([insert(f, { nsUri, convertGeom: point })])();
  // prettier-ignore
  expect(actual).toMatchFileSnapshot('./snapshots/txn.insert.point.xml');
});

test('when in doubt, use the default geojson-to-gml converter', () => {
  const actual = transaction([insert(f, { nsUri, convertGeom: geometry })])();
  // prettier-ignore
  expect(actual).toMatchFileSnapshot('./snapshots/txn.insert.default.xml');
});

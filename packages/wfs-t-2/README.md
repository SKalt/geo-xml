# `geojson-to-wfs-t-2`

![NPM Version](https://img.shields.io/npm/v/geojson-to-wfs-t-2)

A library to create string Web Feature Service XML from geojson. As a string formatting library, `geojson-to-wfs-t-2` has only one dependency and will work in any environment.

## Installation

<details open><summary><code>pnpm</code></summary>

```sh
pnpm add geojson-to-wfs-t-2
```

</details>

<details><summary><code>npm</code></summary>

```sh
npm install geojson-to-wfs-t-2
```

</details>

<details><summary><code>yarn</code></summary>

```sh
yarn add geojson-to-wfs-t-2
```

## Usage

<!--!! use-example file://./tests/txn.example.ts -->

```ts
import { test, expect } from 'vitest';
import { insert, transaction } from '@geo-xml/wfs-t-2';
import { point, geometry } from 'geojson-to-gml-3';
import { Feature, Point } from 'geojson';

const nsUri = 'http://example.com/myFeature' as const;

test('empty transaction', () => {
  const actual = transaction([], { srsName: 'EPSG:4326' })();
  // prettier-ignore
  expect(actual).toBe(''
    + `<wfs:Transaction service="WFS" srsName="EPSG:4326" version="2.0.2" xmlns:wfs="http://www.opengis.net/wfs/2.0"/>`
  );
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
  expect(actual).toBe(''
    + `<wfs:Transaction service="WFS" version="2.0.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myFeature="http://example.com/myFeature" xmlns:wfs="http://www.opengis.net/wfs/2.0">`
    +   `<wfs:Insert>`
    +     `<myFeature:myFeature>`
    +       `<myFeature:geometry>`
    +         `<gml:Point>`
    +           `<gml:pos>`
    +             `0 0`
    +           `</gml:pos>`
    +         `</gml:Point>`
    +       `</myFeature:geometry>`
    +       `<myFeature:a>`
    +         `1`
    +       `</myFeature:a>`
    +     `</myFeature:myFeature>`
    +   `</wfs:Insert>`
    + `</wfs:Transaction>`
  );
});

test('when in doubt, use the default geojson-to-gml converter', () => {
  const actual = transaction([insert(f, { nsUri, convertGeom: geometry })])();
  // prettier-ignore
  expect(actual).toBe(''
    + `<wfs:Transaction service="WFS" version="2.0.2" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:myFeature="http://example.com/myFeature" xmlns:wfs="http://www.opengis.net/wfs/2.0">`
    +   `<wfs:Insert>`
    +     `<myFeature:myFeature>`
    +       `<myFeature:geometry>`
    +         `<gml:Point>`
    +           `<gml:pos>`
    +             `0 0`
    +           `</gml:pos>`
    +         `</gml:Point>`
    +       `</myFeature:geometry>`
    +       `<myFeature:a>`
    +         `1`
    +       `</myFeature:a>`
    +     `</myFeature:myFeature>`
    +   `</wfs:Insert>`
    + `</wfs:Transaction>`
  );
});
```

#### Further notes:

- to avoid conflicting with the `delete` keyword, the function to create a `wfs:Delete` is `delete_`.

- While you should make sure to secure permissions to your data elsewhere (such as the [geoserver layer-level permissions](http://docs.geoserver.org/stable/en/user/security/layer.html)), avoiding importing potentially-dangerous actions `update` or `delete_` is a good idea.

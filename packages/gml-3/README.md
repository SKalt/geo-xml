# geojson-to-gml-3

![NPM Version](https://img.shields.io/npm/v/geojson-to-gml-3)
![Build Status](https://img.shields.io/travis/SKalt/geojson-to-gml-3.2.1/master.svg)

<!-- TODO:  -->

A package to translate geojson geometries to GML 3.2.1.

## Installation

<details open><summary><code>pnpm</code></summary>

```sh
pnpm add geojson-to-gml-3
```

</details>

<details><summary><code>npm</code></summary>

```sh
npm install geojson-to-gml-3
```

</details>

<details><summary><code>yarn</code></summary>

```sh
yarn add geojson-to-gml-3
```

</details>

## Use

<!--!! use-example file://./tests/nullIsland.example.ts -->

```ts
import type { Geometry } from 'geojson';
import gml from 'geojson-to-gml-3';
import { it, expect } from 'vitest';

it('can convert any geometry to GML', () => {
  const nullIsland: Geometry = {
    type: 'Point',
    coordinates: [0, 0],
  };
  expect(gml(nullIsland)()).toBe(''
    + `<gml:Point>`
    +   `<gml:pos>`
    +     `0 0`
    +   `</gml:pos>`
    + `</gml:Point>`
  );
});
```

<!--!! use-example file://./tests/treeShaking.example.ts -->

```ts
import type { LineString } from 'geojson';
import { lineString } from 'geojson-to-gml-3';
import { it, expect } from 'vitest';

it('supports tree-shaking for slimmer builds', () => {
  const line: LineString = {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [1, 1],
    ],
  };
  expect(lineString(line)()).toBe(''
    + `<gml:LineString>`
    +   `<gml:posList>`
    +     `0 0 1 1`
    +   `</gml:posList>`
    + `</gml:LineString>`
  );
});
```

## License

`geojson-to-gml-3` is free for noncommercial use or commercial use for a period of 30 days. For more details, see the [license](./LICENSE.md).

---

Geography Markup Language (GML) is an OGC Standard.

More information may be found at http://www.opengeospatial.org/standards/gml

The most current schema are available at http://schemas.opengis.net/ .

---

Policies, Procedures, Terms, and Conditions of OGC(r) are available at http://www.opengeospatial.org/ogc/legal/ .

OGC and OpenGIS are registered trademarks of Open Geospatial Consortium.

# geojson-to-wfs-t-2

[![npm version](https://badge.fury.io/js/geojson-to-wfs-t-2.svg)](https://badge.fury.io/js/geojson-to-wfs-t-2)
[![Build Status](https://img.shields.io/travis/SKalt/geojson-to-wfs-t-2/master.svg)](https://travis-ci.org/SKalt/geojson-to-wfs-t-2)

A library to create string Web Feature Service XML from geojson. As a string formatting library, `geojson-to-wfs-t-2` has only one dependency and will work in any environment.

## Installation

get the library by executing

```
npm install geojson-to-wfs-t-2
```

or

```
git clone https://github.com/SKalt/geojson-to-wfs-t-2.git
```

and `import/require`-ing es6 or transpiled es5 commonjs, UMD, or es modules from `geojson-to-wfs-t-2/dist/`.

## Usage

```ts
import { transaction, insert } from 'geojson-to-wfs-t-2';

const nullIsland = {
  type: 'Feature',
  properties: {place_name: 'null island'},
  geometry: {
    type: 'Point',
    coordinates: [0, 0]
  }
  id: 'feature_id'
}
const params = {geometry_name: 'geom', layer: 'my_lyr', ns: 'my_namespace'};

// create a stringified transaction inserting null island
wfs.Transaction(
  wfs.Insert(nullIsland, params),
  {
    nsAssignments: {
      my_namespace: 'https://example.com/namespace_defn.xsd'
    }
  }
);

// create a stringified transaction updating null island's name
wfs.Transaction(
  wfs.Update({properties: {place_name: 'not Atlantis'}, id: nullIsland.id }),
  {nsAssignments: ...}
)
// same deal, but deleting it
wfs.Transaction(
  wfs.Delete({id: nullIsland.id}, params),
  {nsAssignments: ...}
)
```

#### Further notes:

- to avoid conflicting with the `delete` keyword, the function to create a `wfs:Delete` is `delete_`.

- While you should make sure to secure permissions to your data elsewhere (such as the [geoserver layer-level permissions](http://docs.geoserver.org/stable/en/user/security/layer.html)), avoiding importing dangerous actions `update` or `delete_` is a good idea.

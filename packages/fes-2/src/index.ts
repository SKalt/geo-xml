import type { Feature, GeoJsonProperties } from 'geojson';
import {
  type Name,
  tag,
  Namespaces,
  type Xml,
  tagFn,
  attr,
  escapeStr,
} from 'minimxml/src';
// https://docs.ogc.org/is/09-026r2/09-026r2.html
export const FES = 'http://www.opengis.net/fes/2.0';
const makeId = (lyr: string, id: string): string => {
  if (!id || id.includes('.')) throw new Error(`invalid id "${id}"`);
  if (!lyr || lyr.includes('.')) throw new Error(`invalid layer "${lyr}"`);
  if (lyr) return `${lyr}.${id}`;
  return id;
};
// import { GetLayerCallback, LayerParam } from './typeDefs';
import { GML } from 'packages/gml-3/src';

/** construct a `<fes:ResourceId rid=??/>` element */
const idFilter = (
  lyr: string,
  id: string,
  resourceIdTag: ReturnType<typeof tagFn<typeof FES>>,
): Xml<typeof FES> => {
  return resourceIdTag([attr('rid' as Name, escapeStr(makeId(lyr, id)))]);
};

/**
Builds a filter from feature ids if one is not already input.
@function
@param features an array of geojson feature objects
@param namespaces a mutable object collecting XML namespace declarations
@param layer the layer to filter on. If not provided, the layer is taken from the first feature's properties.
@return A `fes:Filter` element, or the input filter if it was a string.

@example
```ts @import.meta.vitest
const { Namespaces } = await import("minimxml/src");
const namespaces = new Namespaces();
const features = [{
  type: "Feature",
  id: "id",
  "layer": {id: "layer_from_feature"},
  geometry: null,
  properties: null,
}];

const layer = "fromOpt";
expect(filter(features, namespaces, { layer })).toBe(""
  + `<fes:Filter>`
  +   `<fes:ResourceId rid="fromOpt.id"/>`
  + `</fes:Filter>`
);

const getLayer = (f) => f.layer.id;
expect(filter(features, namespaces, { getLayer })).toBe(""
  + `<fes:Filter>`
  +   `<fes:ResourceId rid="layer_from_feature.id"/>`
  + `</fes:Filter>`
);

expect(filter(features, namespaces, { layer, getLayer })).toBe(""
  + `<fes:Filter>`
  +   `<fes:ResourceId rid="layer_from_feature.id"/>`
  + `</fes:Filter>`
);
```
 */
export function filter(
  predicates: Xml<typeof FES>[] | Xml<typeof FES>,
  namespaces: Namespaces,
): Xml<typeof FES> {
  return tag(
    namespaces.getOrInsert('fes' as Name, FES).qualify('Filter' as Name),
    [],
    ...(typeof predicates === 'string' ? [predicates] : predicates),
  );
}

// TODO: add more filter kinds

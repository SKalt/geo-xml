import type { Feature, GeoJsonProperties } from 'geojson';
import {
  type Name,
  tag,
  Namespaces,
  type XmlElements,
  tagFn,
  attr,
  escapeStr,
} from 'minimxml/src';
export const FES = 'http://www.opengis.net/fes/2.0';
import { makeId as ensureId } from './ensure';

/** construct a `<fes:ResourceId rid=??/>` element */
const idFilter = (
  lyr: string,
  id: string,
  resourceIdTag: ReturnType<typeof tagFn<typeof FES>>,
): XmlElements<typeof FES> => {
  return resourceIdTag([attr('rid' as Name, escapeStr(ensureId(lyr, id)))]);
};

/**
Builds a filter from feature ids if one is not already input.
@function
@param filter a possible string filter
@param features an array of geojson feature objects
@param params an object of backup / override parameters
@return A `fes:Filter` element, or the input filter if it was a string.

@example
```ts @import.meta.vitest
const { Namespaces } = await import("minimxml/src");
const ns = new Namespaces();

const features = [{
  type: "Feature", id: "id",
  geometry: null,
  properties: {layer: "defined_layer"},
}];
expect(filter(features, ns, "argLayer")).toBe(""
  + `<fes:Filter>`
  +   `<fes:ResourceId rid="argLayer.id"/>`
  + `</fes:Filter>`
);

expect(filter(features, ns)).toBe(""
  + `<fes:Filter>`
  +   `<fes:ResourceId rid="defined_layer.id"/>`
  + `</fes:Filter>`
);
```
 */
export function filter<P extends GeoJsonProperties = GeoJsonProperties>(
  features: Feature<any, P>[],
  namespaces: Namespaces,
  layer: string | null = null,
): string {
  if (!features.length) throw new Error('missing features');
  const fes = namespaces.getOrInsert('fes' as Name, FES);
  const resourceIdTag = tagFn(fes.qualify('ResourceId' as Name));
  const result = features.map((feature) => {
    const { id } = feature;
    if (!id) throw new Error('missing id');

    const lyr = layer ?? feature.properties?.layer;
    if (!lyr) throw new Error('missing layer');

    switch (typeof lyr) {
      case 'string':
      case 'number':
      case 'bigint':
        break;
      default:
        throw new Error(
          `invalid layer '${lyr}' for resource '${id}': must be a string or number`,
        );
    }
    return idFilter(String(lyr), String(id), resourceIdTag);
  });
  return tag(fes.qualify('Filter' as Name), [], ...result);
}

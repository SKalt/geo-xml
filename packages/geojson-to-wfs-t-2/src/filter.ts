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
export const FES = 'http://www.opengis.net/fes/2.0';
import { makeId as ensureId } from './ensure';
import { GetLayerCallback, LayerParam } from './typeDefs';

/** construct a `<fes:ResourceId rid=??/>` element */
const idFilter = (
  lyr: string,
  id: string,
  resourceIdTag: ReturnType<typeof tagFn<typeof FES>>,
): Xml<typeof FES> => {
  return resourceIdTag([attr('rid' as Name, escapeStr(ensureId(lyr, id)))]);
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
export function filter<
  P extends GeoJsonProperties = GeoJsonProperties,
  Extensions extends Record<string, any> = {},
>(
  features: Array<Feature<any, P> & Extensions>,
  namespaces: Namespaces,
  options: Partial<LayerParam & GetLayerCallback<P, Extensions>> = {},
): Xml<typeof FES> {
  if (!features.length) throw new Error('missing features');
  if (!options.layer && !options.getLayer)
    throw new Error('either layer or getLayer must be provided');
  const fes = namespaces.getOrInsert('fes' as Name, FES);
  const resourceIdTag = tagFn(fes.qualify('ResourceId' as Name));
  const { layer, getLayer = (_: any) => layer! } = options;
  const result = features.map((feature) => {
    const { id } = feature;
    if (!id) throw new Error('missing id');
    let layer = getLayer(feature);
    if (!layer) throw new Error('missing layer');

    switch (typeof layer) {
      case 'string':
      case 'number':
      case 'bigint':
        break;
      default:
        throw new Error(
          `invalid layer '${layer}' for resource '${id}': must be a string or number`,
        );
    }
    return idFilter(String(layer), String(id), resourceIdTag);
  });
  return tag(fes.qualify('Filter' as Name), [], ...result);
}

// TODO: add more filter kinds

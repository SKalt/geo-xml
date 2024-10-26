import type {
  FeatureCollection,
  Feature,
  Geometry,
  GeoJsonProperties,
} from 'geojson';
import { attrs, AttrValue, type Name, Namespaces, tag } from 'minimxml/src';
import { WFS } from './xml';
import {
  GetLayerCallback,
  HandleOpt,
  InputFormatOpt,
  LayerParam,
  SrsNameOpt,
} from './typeDefs';
import { asArray, translateFeatures } from './utils';
import { type Features } from '.';
import { Converter } from 'packages/geojson-to-gml-3/src';
import { AttValueStr, NameStr } from 'packages/minimxml/src/parse';

/**
Returns a wfs:Insert tag wrapping a translated feature
@function
@param f One or more features to pass to @see translateFeatures
@param options to be passed to @see translateFeatures, with optional
inputFormat, srsName, handle for the wfs:Insert tag.
@return a `wfs:Insert` string.
@example
```ts @import.meta.vitest
const { Namespaces } = await import("minimxml/src");
// const {} = await import("geojson-to-gml-3/src");
const namespaces = new Namespaces();
const ns = "topp";
const layer = "tasmania_roads";
const features = [{id: 13, properties: {TYPE: "rainbow"}, geometry: null}];
const actual = insert(
  features,
  {ns: "topp", nsUri: "http://www.openplans.org/topp", namespaces, },
  {layer},
);
expect(actual).toBe(""
  + `<wfs:Insert>`
  +   `<topp:tasmania_roads gml:id="tasmania_roads.13">`
  +     `<topp:TYPE>rainbow</topp:TYPE>`
  +   `</topp:tasmania_roads>`
  + `</wfs:Insert>`
)
```
*/
export function insert<
  N extends string,
  SchemaUri extends string,
  G extends Geometry | null = Geometry,
  P extends GeoJsonProperties = GeoJsonProperties,
  Extensions extends Record<any, any> = {},
>(
  f: Features<G, P, Extensions>,
  params: {
    nsUri: AttrValue | AttValueStr<SchemaUri>;
    namespaces: Namespaces;
    convertGeom: G extends Geometry ? Converter<G> : undefined;
  },
  options: Partial<
    InputFormatOpt &
      SrsNameOpt &
      HandleOpt &
      LayerParam &
      GetLayerCallback<P, Extensions> & { ns: Name | NameStr<N> }
  > = {},
): string {
  const { nsUri, namespaces, convertGeom } = params;
  const { inputFormat, srsName, handle } = options;
  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
  f = asArray(f);
  let toInsert = translateFeatures<N, SchemaUri, G, P, Extensions>(
    f,
    { nsUri, namespaces, convertGeom },
    options,
  );
  return tag(
    wfs.qualify('Insert' as Name),
    attrs({ inputFormat, srsName, handle }),
    ...toInsert,
  );
}

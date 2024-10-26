import type {
  FeatureCollection,
  Feature,
  Geometry,
  GeoJsonProperties,
} from 'geojson';
import { attrs, AttrValue, type Name, Namespaces, tag } from 'minimxml/src';
import { WFS } from './xml';
import { HandleOpt, InputFormatOpt, SrsNameOpt } from './typeDefs';
import { asArray, translateFeatures } from './utils';
import { type Features } from '.';
import { Converter } from 'packages/geojson-to-gml-3/src';
import { AttValueStr, NameStr } from 'packages/minimxml/src/parse';

/**
Returns a wfs:Insert tag wrapping a translated feature
@function
@param f One or more features to pass to @see translateFeatures
@param opts to be passed to @see translateFeatures, with optional
inputFormat, srsName, handle for the wfs:Insert tag.
@return a `wfs:Insert` string.
@example
```ts @import.meta.vitest
const { Namespaces } = await import("minimxml/src");
// const {} = await import("geojson-to-gml-3/src");
const ns = new Namespaces();
const features = [{id: 13, properties: {layer: "tasmania_roads"}, geometry: null}];
const actual = insert(features, "topp", "http://www.openplans.org/topp", ns, null);
expect(actual).toBe(""
  + `<wfs:Insert>`
  +   `<topp:tasmania_roads gml:id="tasmania_roads.13">`
  +     `<topp:the_geom/>`
  +   `</topp:tasmania_roads>`
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

  ns: Name | NameStr<N>,
  nsUri: AttrValue | AttValueStr<SchemaUri>,
  namespaces: Namespaces,
  convertGeom: G extends Geometry ?
    G extends null ?
      never
    : Converter<G>
  : null,

  opts: Partial<InputFormatOpt & SrsNameOpt & HandleOpt> = {},
): string {
  let { inputFormat = null, srsName = null, handle = null } = opts;
  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
  f = asArray(f);
  let toInsert = translateFeatures<N, SchemaUri, G, P, Extensions>(
    f,
    { ns, nsUri, namespaces, convertGeom },
    opts,
  );
  return tag(
    wfs.qualify('Insert' as Name),
    attrs({ inputFormat, srsName, handle }),
    ...toInsert,
  );
}

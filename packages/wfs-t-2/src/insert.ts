import type { Geometry, GeoJsonProperties } from 'geojson';
import {
  attrs,
  AttrValue,
  type Name,
  NsRegistry,
  tag,
  ToXml,
  Xml,
} from 'minimxml';
import { WFS } from './xml.js';
import {
  GetLayerCallback,
  HandleOpt,
  InputFormatOpt,
  LayerParam,
  SrsNameOpt,
} from './typeDefs.js';
import { asArray, translateFeatures } from './utils.js';
import { type Features } from './index.js';
import { type Converter } from 'geojson-to-gml-3';
import { type AttValueStr, type NameStr } from 'minimxml';

/**
Returns a wfs:Insert tag wrapping a translated feature
@function
@param f One or more features to pass to @see translateFeatures
@param options to be passed to @see translateFeatures, with optional
inputFormat, srsName, handle for the wfs:Insert tag.
@return a `wfs:Insert` string.
@example
```ts
const { NsRegistry } = await import("minimxml/src");
// const {} = await import("geojson-to-gml-3/src");
const namespaces = new NsRegistry();
const ns = "topp";
const layer = "tasmania_roads";
const features = [{id: 13, properties: {TYPE: "rainbow"}, geometry: null}];
const actual = insert(
  features,
  { ns: "topp", nsUri: "http://www.openplans.org/topp", },
  {layer},
)(namespaces);

expect(actual).toBe(""
  + `<wfs:Insert>`
  +   `<topp:tasmania_roads gml:id="tasmania_roads.13">`
  +     `<topp:TYPE>rainbow</topp:TYPE>`
  +   `</topp:tasmania_roads>`
  + `</wfs:Insert>`
)
```
*/
export const insert =
  <
    N extends string,
    SchemaUri extends string,
    G extends Geometry | null = Geometry,
    P extends GeoJsonProperties = GeoJsonProperties,
    Extensions extends Record<any, any> = {},
  >(
    f: Features<G, P, Extensions>,
    params: {
      nsUri: AttrValue | AttValueStr<SchemaUri>;
      convertGeom: G extends Geometry ? Converter<G> : undefined;
    },
    options: Partial<
      InputFormatOpt &
        SrsNameOpt &
        HandleOpt &
        LayerParam &
        GetLayerCallback<P, Extensions> & { ns: Name | NameStr<N> }
    > = {},
  ): ToXml<typeof WFS> =>
  (namespaces: NsRegistry): Xml<typeof WFS> => {
    const { nsUri, convertGeom } = params;
    const { inputFormat, srsName, handle } = options;
    const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
    f = asArray(f);
    let toInsert = translateFeatures<N, SchemaUri, G, P, Extensions>(
      f,
      { nsUri, convertGeom },
      options,
    );
    return tag(
      wfs.qualify('Insert' as Name),
      attrs({ inputFormat, srsName, handle }),
      ...toInsert(namespaces),
    )(namespaces);
  };

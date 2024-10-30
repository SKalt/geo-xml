import type { Features } from '.';
import { InputFormatOpt, NsOpt, SrsNameOpt } from './typeDefs';
import { asArray, translateFeatures } from './utils';
import {
  attrs,
  type Name,
  NsRegistry,
  type Xml,
  tag,
  AttrValue,
  ToXml,
} from 'minimxml/src';
import type { GeoJsonProperties, Geometry } from 'geojson';
import { WFS } from './xml';
import { type Converter } from 'packages/gml-3/src';
import type { AttValueStr, NameStr } from 'packages/minimxml/src/parse';
import { FES } from 'geojson-to-fes-2/src';

/**
Returns a string wfs:Replace action. a `wfs:Replace` action is a request to
replace one or more entire features.
@see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#290 | OGC 09-025r2 § 15.6.2}
@param features feature(s) to replace
@param  options with optional filter, inputFormat, srsName
@return a string wfs:Replace action.

@example
```ts @import.meta.vitest
const { NsRegistry } = await import("minimxml/src");
const { translateFeatures } = await import("./utils");
const { filter, idFilter } = await import("geojson-to-fes-2/src");
const ns = new NsRegistry();
const features = [{id: 13, properties: {TYPE: "rainbow"}, geometry: null}];
const layer = "tasmania_roads";
const actual = replace(
  features,
  {
    filter: filter(
      features.map(f => idFilter(`tasmania_roads.${f.id}`, ns)),
      ns,
    ),
    nsUri: "http://www.openplans.org/topp"
  },
  {layer},
)(ns);

expect(actual).toBe(""
  + `<wfs:Replace>`
  +   `<topp:tasmania_roads gml:id="tasmania_roads.13">`
  +     `<topp:TYPE>rainbow</topp:TYPE>`
  +   `</topp:tasmania_roads>`
  +   `<fes:Filter><fes:ResourceId rid="tasmania_roads.13"/></fes:Filter>`
  + `</wfs:Replace>`
)

```

*/
export const replace =
  <
    Schema extends string,
    Ns extends string,
    G extends Geometry | null = Geometry,
    P extends GeoJsonProperties = GeoJsonProperties,
    Extensions extends Record<any, any> = {},
  >(
    features: Features<G, P, Extensions>, // TODO: pass as XmlElements?
    params: {
      filter: ToXml<typeof FES>;
      nsUri: AttValueStr<Schema> | AttrValue;
      convertGeom: G extends Geometry ? Converter<G> : undefined;
    },
    options: Partial<SrsNameOpt & InputFormatOpt & NsOpt<Ns>> = {},
    // TODO: optional convertProps
  ): ToXml<typeof WFS> =>
  (namespaces: NsRegistry): Xml<typeof WFS> => {
    const { filter, nsUri, convertGeom } = params;
    features = asArray(features);
    if (!features.length) throw new Error('missing features');

    let { srsName, inputFormat, ...remainingOptions } = options;
    return tag<typeof WFS, any>(
      namespaces.getOrInsert('wfs' as Name, WFS).qualify('Replace' as Name),
      attrs({ inputFormat, srsName }),
      ...(translateFeatures(
        features,
        { nsUri, convertGeom },
        remainingOptions,
      )(namespaces) as Xml<any>[]),
      filter,
    )(namespaces);
  };

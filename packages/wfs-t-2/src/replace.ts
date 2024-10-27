import type { Features } from '.';
import { InputFormatOpt, NsOpt, SrsNameOpt } from './typeDefs';
import { asArray, translateFeatures } from './utils';
import {
  attrs,
  type Name,
  Namespaces,
  type Xml,
  tag,
  AttrValue,
} from 'minimxml/src';
import type { GeoJsonProperties, Geometry } from 'geojson';
import { WFS } from './xml';
import { type Converter } from 'packages/gml-3/src';
import type { AttValueStr, NameStr } from 'packages/minimxml/src/parse';
import { FES } from './filter';

/**
Returns a string wfs:Replace action. a `wfs:Replace` action is a request to
replace one or more entire features.
@see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#290 | OGC 09-025r2 § 15.6.2}
@param features feature(s) to replace
@param  options with optional filter, inputFormat, srsName
@return a string wfs:Replace action.

@example
```ts @import.meta.vitest
const { Namespaces } = await import("minimxml/src");
const { translateFeatures } = await import("./utils");
const { filter } = await import("./filter");
const namespaces = new Namespaces();
const features = [{id: 13, properties: {TYPE: "rainbow"}, geometry: null}];
const layer = "tasmania_roads";
const actual = replace(
  features,
  {
    namespaces,
    filter: filter(features, namespaces, {layer}),
    nsUri: "http://www.openplans.org/topp"
  },
  {layer},
);

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
export function replace<
  Schema extends string,
  Ns extends string,
  G extends Geometry | null = Geometry,
  P extends GeoJsonProperties = GeoJsonProperties,
  Extensions extends Record<any, any> = {},
>(
  features: Features<G, P, Extensions>, // TODO: pass as XmlElements?
  params: {
    filter: Xml<typeof FES>;
    namespaces: Namespaces;
    nsUri: AttValueStr<Schema> | AttrValue;
    convertGeom: G extends Geometry ? Converter<G> : undefined;
  },
  options: Partial<SrsNameOpt & InputFormatOpt & NsOpt<Ns>> = {},
  // TODO: optional convertProps
): string {
  const { filter, namespaces, nsUri, convertGeom } = params;
  features = asArray(features);
  if (!features.length) throw new Error('missing features');
  if (typeof filter !== 'string') throw new Error('filter must be a string');
  if (!filter) throw new Error('missing filter');
  if (!features.length) throw new Error('missing features');

  let { srsName, inputFormat, ...remainingOptions } = options;
  return tag<typeof WFS, any>(
    namespaces.getOrInsert('wfs' as Name, WFS).qualify('Replace' as Name),
    attrs({ inputFormat, srsName }),
    ...(translateFeatures(
      features,
      { nsUri, namespaces, convertGeom },
      remainingOptions,
    ) as Xml<any>[]),
    filter as Xml<any>,
  );
}

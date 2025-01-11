// ©️ Steven Kalt
// Spdx-License-Identifier: PolyForm-Noncommercial-1.0.0 OR PolyForm-Free-Trial-1.0.0

import type { Features } from './index.js';
import { InputFormatOpt, NsOpt, SrsNameOpt } from './typeDefs.js';
import { asArray, translateFeatures } from './utils.js';
import {
  attrs,
  type Name,
  NsRegistry,
  type Xml,
  tag,
  AttrValue,
  ToXml,
} from 'minimxml';
import type { GeoJsonProperties, Geometry } from 'geojson';
import { WFS } from './xml.js';
import { type Converter } from 'geojson-to-gml-3';
import type { AttValueStr } from 'minimxml';
import { FES } from '@geo-xml/fes-2';

/*!! use-example file://./../tests/replace.example.ts */
/**
Returns a string wfs:Replace action. a `wfs:Replace` action is a request to
replace one or more entire features.
@see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#290 | OGC 09-025r2 § 15.6.2}
@param features feature(s) to replace
@param  options with optional filter, inputFormat, srsName
@return a string wfs:Replace action.

@example
```ts
import { NsRegistry } from 'minimxml';
import { filter, idFilter } from '@geo-xml/fes-2';
import { replace } from '@geo-xml/wfs-t-2';
import { Feature } from 'geojson';
import { test, expect } from 'vitest';

test('replacing a feature by id', () => {
  const ns = new NsRegistry();
  const f: Feature<null> = {
    type: 'Feature',
    id: 13,
    properties: { TYPE: 'rainbow' },
    geometry: null,
  };
  const layer = 'tasmania_roads';
  const nsUri = 'http://www.openplans.org/topp' as const;
  const actual = replace([f], {
    filter: filter(idFilter(`${layer}.${f.id}`)),
    nsUri,
    convertGeom: null,
  })(ns);

  expect(actual).toBe(''
    + `<wfs:Replace>`
    +   `<topp:topp gml:id="topp.13">`
    +     `<topp:TYPE>`
    +       `rainbow`
    +     `</topp:TYPE>`
    +   `</topp:topp>`
    +   `<fes:Filter>`
    +     `<fes:ResourceId rid="tasmania_roads.13"/>`
    +   `</fes:Filter>`
    + `</wfs:Replace>`
  );
});
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
      convertGeom: G extends Geometry ? Converter<G> : null | undefined;
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

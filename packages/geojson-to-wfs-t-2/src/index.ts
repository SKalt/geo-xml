/* eslint-disable camelCase, new-cap */
// some snake_case variables are used to imitate gml's notation.
/**
 * A library of functions to turn geojson into WFS transactions.
 * @module geojsonToWfst
 */
import {
  tag as xmlTag,
  Name,
  Namespaces,
  attrs,
  escapeStr,
  XmlElements,
  attr,
  Attr,
} from 'minimxml/src';
import { WFS, XSI } from './xml';
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from 'geojson';

export type Features<
  G extends Geometry | null = Geometry,
  P = GeoJsonProperties,
  Extensions extends Record<string, any> = {},
> =
  | (Feature<G, P> & Extensions)
  | Array<Feature<G, P> & Extensions>
  | (FeatureCollection<G, P> &
      Extensions & { features: Array<Feature<G, P> & Extensions> });

export type ScalarValue = string | number | boolean | null;

export { delete_ } from './delete';
export { insert } from './insert';
export { bulkUpdate, update } from './update';
export { filter } from './filter';

/**
Wraps the input actions in a wfs:Transaction.
@see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#273 | OGC 09-025r2 § 15.2.2 }
@param actions xml wfs:Insert, wfs:Update, wfs:Replace, or wfs:Delete
element strings to wrap in a transaction.
@param params optional srsName, lockId, releaseAction,
 handle, inputFormat, version, and required nsAssignments, schemaLocations.
@return A wfs:transaction wrapping the input actions.
```ts @~import.meta.vitest
const { Namespaces } = await import("minimxml/src");
const ns = new Namespaces();
```
*/
export function Transaction(
  actions: XmlElements<typeof WFS>[],
  namespaces: Namespaces,
  params: {
    schemaLocations?: Record<string, string>; // TODO: refine?
    lockId?: string;
    /** @see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#278| OGC 09-025r2 § 15.2.3.2: `releaseAction` parameter} */
    releaseAction?: 'ALL' | 'SOME';
    srsName?: string;
  } = {},
) {
  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
  const { lockId = null, releaseAction = null, srsName = null } = params;
  let txnAttrs = namespaces
    .xmlnsAttrs()
    .concat(...attrs({ lockId, releaseAction, srsName }))
    .concat(
      `service="WFS"` as Attr, // required since Transaction extends BaseRequest
      `version="2.0.2"` as Attr, // version should be 2.0.2 https://docs.ogc.org/is/09-025r2/09-025r2.html#14
    );
  // generate schemaLocation, xmlns's
  if (params.schemaLocations) {
    const key = namespaces
      .getOrInsert('xsi' as Name, XSI)
      .qualify('schemaLocation' as Name);
    const value =
      '\n  ' +
      Object.entries(params.schemaLocations)
        .map(([ns, loc]) => `${ns} ${loc}`)
        .join('\n  ');
    txnAttrs.push(attr(key, escapeStr(value)));
  }

  return xmlTag(
    wfs.qualify('Transaction' as Name),
    txnAttrs.sort(),
    ...actions,
  );
}

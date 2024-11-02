/* eslint-disable camelCase, new-cap */
// some snake_case variables are used to imitate gml's notation.
/**
 * A library of functions to turn geojson into WFS transactions.
 */
import {
  tag,
  type Name,
  NsRegistry,
  attrs,
  escapeStr,
  type Xml,
  attr,
  Attr,
  ToXml,
  concat,
} from 'minimxml';
import { WFS, XSI } from './xml.js';
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from 'geojson';
import { SrsNameOpt, TransactionOpts } from './typeDefs.js';

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

export { delete_ } from './delete.js';
export { insert } from './insert.js';
export { bulkUpdate, update } from './update.js';

/*!! use-example file://./../tests/txn.example.ts */
/**
Wraps the input actions in a wfs:Transaction.
@see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#273 | OGC 09-025r2 § 15.2.2 }
@param actions xml wfs:Insert, wfs:Update, wfs:Replace, or wfs:Delete
element strings to wrap in a transaction.
@param options optional srsName, lockId, releaseAction,
 handle, inputFormat, version, and required nsAssignments, schemaLocations.
@return A wfs:transaction wrapping the input actions.
@example
```ts
```
*/
export const transaction =
  (
    actions: ToXml<typeof WFS>[], // require callbacks to ensure all namespaces are registered
    options: TransactionOpts &
      Partial<SrsNameOpt> & {
        schemaLocations?: Record<string, string>; // TODO: refine?
      } = {},
  ) =>
  (namespaces?: NsRegistry): Xml<typeof WFS> => {
    namespaces = namespaces ?? new NsRegistry();
    const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
    const { lockId = null, releaseAction = null, srsName = null } = options;
    // make sure that all xml generation callbacks register their namespaces
    const inner = concat(...actions.map((f) => f(namespaces)));
    const txnAttrs = namespaces
      .xmlnsAttrs()
      .concat(...attrs({ lockId, releaseAction, srsName }))
      .concat(
        `service="WFS"` as Attr, // required since Transaction extends BaseRequest
        `version="2.0.2"` as Attr, // version should be 2.0.2 https://docs.ogc.org/is/09-025r2/09-025r2.html#14
      );
    // generate schemaLocation, xmlns's
    if (options.schemaLocations) {
      const key = namespaces
        .getOrInsert('xsi' as Name, XSI)
        .qualify('schemaLocation' as Name);
      const value =
        '\n  ' +
        Object.entries(options.schemaLocations)
          .filter(([ns, loc]) => ns && loc) // silently ignore empty values
          .map(([ns, loc]) => `${escapeStr(ns)} ${escapeStr(loc)}`)
          .join('\n  ');
      txnAttrs.push(attr(key, escapeStr(value)));
    }

    return tag(
      wfs.qualify('Transaction' as Name),
      txnAttrs.sort(),
      inner,
    )(namespaces);
  };

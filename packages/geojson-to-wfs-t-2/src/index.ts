/* eslint-disable camelcase, new-cap */
// some snake_case variables are used to imitate gml's notation.
/**
 * A library of functions to turn geojson into WFS transactions.
 * @module geojsonToWfst
 */
import gml3 from 'geojson-to-gml-3/src/index';
import {
  tag as xmlTag,
  Name,
  Namespaces,
  attrs,
  escape,
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
> = Feature<G, P> | Feature<G, P>[] | FeatureCollection<G, P>;

export type ScalarValue = string | number | boolean | null;

export { Delete } from './delete';
export { Insert } from './insert';
export { bulkUpdate, update } from './update';
export { filter } from './filter';

/**
 * Wraps the input actions in a wfs:Transaction.
 * @see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#273 | OGC 09-025r2 § 15.2.2 }
 * @param actions xml wfs:Insert, wfs:Update, wfs:Replace, or wfs:Delete
 * element strings to wrap in a transaction.
 * @param params optional srsName, lockId, releaseAction,
 *  handle, inputFormat, version, and required nsAssignments, schemaLocations.
 * @return A wfs:transaction wrapping the input actions.
 */
export function Transaction(
  actions: XmlElements,
  namespaces: Namespaces,
  params: {
    schemaLocations?: Record<string, string>;
    lockId?: string;
    /** @see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#278| OGC 09-025r2 § 15.2.3.2: `releaseAction` parameter} */
    releaseAction?: 'ALL' | 'SOME';
    srsName?: string;
  } = {},
) {
  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);

  // generate schemaLocation, xmlns's
  let txnAttrs = namespaces.xmlnsAttrs().concat(
    `service="WFS"` as Attr, // required since Transaction extends BaseRequest
    `version="2.0.2"` as Attr, // version should be 2.0.2 https://docs.ogc.org/is/09-025r2/09-025r2.html#14
  );
  if (params.schemaLocations) {
    let key = namespaces
      .getOrInsert('xsi' as Name, XSI)
      .qualify('schemaLocation' as Name);
    let value =
      '\n  ' +
      Object.entries(params.schemaLocations)
        .map(([ns, loc]) => `${ns} ${loc}`)
        .join('\n  ');
    txnAttrs.push(attr(key, escape(value)));
  }
  const allowedParams = new Set(['lockId', 'releaseAction', 'srsName']);
  txnAttrs.push(
    ...attrs(
      Object.entries(params)
        .filter(([k]) => allowedParams.has(k))
        .reduce((a, [k, v]) => Object.assign(a, { [k]: v }), {}),
    ),
  );

  return xmlTag(wfs.qualify('Transaction' as Name), txnAttrs.sort(), actions);
}

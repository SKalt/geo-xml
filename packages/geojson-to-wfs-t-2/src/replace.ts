import type { Features } from '.';
import { InputFormatOpt, SrsNameOpt } from './typeDefs';
import { asArray, translateFeatures } from './utils';
import {
  attrs,
  Name,
  Namespaces,
  XmlElements,
  tag as tag,
  concat,
  AttrValue,
} from 'minimxml/src';
import type { GeoJsonProperties, Geometry } from 'geojson';
import { WFS } from './xml';
import { Converter } from 'packages/geojson-to-gml-3/src';
import { AttValueStr, NameStr } from 'packages/minimxml/src/parse';
import { FES } from './filter';

/**
 * Returns a string wfs:Replace action. a `wfs:Replace` action is a request to
 * replace one or more entire features.
 * @see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#290 | OGC 09-025r2 § 15.6.2}
 * @param features feature(s) to replace
 * @param  opts with optional filter, inputFormat, srsName
 * @return a string wfs:Replace action.
 */
export function replace<
  Schema extends string,
  Ns extends string,
  G extends Geometry | null = Geometry,
  P extends GeoJsonProperties = GeoJsonProperties,
  Extensions extends Record<any, any> = {},
>(
  features: Features<G, P, Extensions>, // TODO: pass as XmlElements?

  filter: XmlElements<typeof FES>,
  namespaces: Namespaces,
  nsUri: AttValueStr<Schema> | AttrValue,
  nsName: NameStr<Ns> | Name,
  convertGeom: G extends Geometry ? Converter<G> : null,
  // TODO: optional convertProps
  opts: Partial<SrsNameOpt & InputFormatOpt> = {},
): string {
  features = asArray(features);
  if (!features.length) throw new Error('missing features');
  if (typeof filter !== 'string') throw new Error('filter must be a string');
  if (!filter) throw new Error('missing filter');
  if (!features.length) throw new Error('missing features');

  let { srsName = null, inputFormat = null } = opts;
  const ns = namespaces.getOrInsert(nsName, nsUri);
  return tag<typeof WFS, any>(
    namespaces.getOrInsert('wfs' as Name, WFS).qualify('Replace' as Name),
    attrs({ inputFormat, srsName }),
    ...(translateFeatures(
      features,
      { ns: nsName, nsUri, namespaces, convertGeom },
      opts,
    ) as XmlElements<any>[]),
    filter as XmlElements<any>,
  );
}

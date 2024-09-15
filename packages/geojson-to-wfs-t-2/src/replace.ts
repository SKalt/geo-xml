import { Features } from '.';
import { InputFormatParam, Params, SrsNameParam } from './typeDefs';
import { asArray, translateFeatures } from './utils';
import { attrs, Name, Namespaces, XmlElements, tag as tag } from 'minimxml/src';
import { filter as ensureFilter } from './filter';
import { GeoJsonProperties, Geometry } from 'geojson';
import { WFS } from './xml';

/**
 * Returns a string wfs:Replace action. a `wfs:Replace` action is a request to
 * replace one or more entire features.
 * @see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#290 | OGC 09-025r2 § 15.6.2}
 * @param features feature(s) to replace
 * @param  params with optional filter, inputFormat, srsName
 * @return a string wfs:Replace action.
 */
export function replace<
  G extends Geometry | null = Geometry,
  P = GeoJsonProperties,
>(
  features: Features<G, P>,
  filter: XmlElements,
  namespaces: Namespaces,
  params: Params & SrsNameParam & InputFormatParam = {},
): string {
  features = asArray(features);

  if (typeof filter !== 'string') throw new Error('filter must be a string');
  if (!filter) throw new Error('missing filter');
  if (!features.length) throw new Error('missing features');

  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
  let { srsName = null, inputFormat = null } = params;

  let replacements = translateFeatures(features, namespaces, params);
  return tag(
    wfs.qualify('Replace' as Name),
    attrs({ inputFormat, srsName }),
    replacements,
    filter,
  );
}

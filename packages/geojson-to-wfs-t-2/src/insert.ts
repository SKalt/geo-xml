import type {
  FeatureCollection,
  Feature,
  Geometry,
  GeoJsonProperties,
} from 'geojson';
import { attrs, type Name, Namespaces, tag as xmlTag } from 'minimxml/src';
import { WFS } from './xml';
import { HandleParam, InputFormatParam, SrsNameParam } from './typeDefs';
import { asArray, translateFeatures } from './utils';
import { type Features } from '.';

/**
 * Returns a wfs:Insert tag wrapping a translated feature
 * @function
 * @param f One or more features to pass to @see translateFeatures
 * @param params to be passed to @see translateFeatures, with optional
 * inputFormat, srsName, handle for the wfs:Insert tag.
 * @return a `wfs:Insert` string.
 */
export function Insert<
  G extends Geometry | null = Geometry,
  P = GeoJsonProperties,
>(
  f: Features<G, P>,
  namespaces: Namespaces,
  params: InputFormatParam & SrsNameParam & HandleParam = {},
): string {
  let { inputFormat = null, srsName = null, handle = null } = params;
  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);

  let toInsert = translateFeatures(asArray(f), namespaces, params); // FIXME: avoid translateFeatures?
  return xmlTag(
    wfs.qualify('Insert' as Name),
    attrs({ inputFormat, srsName, handle }),
    toInsert,
  );
}

/**
 * Common utilities for handling parameters for creation of WFS transactions.
 * @module utils
 */

import { geometry as gml3 } from 'geojson-to-gml-3/src';
import {
  tag as xmlTag,
  escape as xmlEscape,
  type XmlElements,
  Namespaces,
  empty,
  Namespace,
} from 'minimxml/src';
import { makeId as ensureId } from './ensure';
import type { Feature, GeoJsonProperties, Geometry } from 'geojson';
import {
  GeometryNamesParam,
  LayerParam,
  SrsNameParam,
  type Params,
} from './typeDefs.js';
import { type Features } from './index';

export const asArray = <
  G extends Geometry | null = Geometry,
  P = GeoJsonProperties,
>(
  f: Features<G, P>,
): Feature<G, P>[] =>
  Array.isArray(f) ? f : f.type === 'FeatureCollection' ? f.features : [f];

// function translateGeometry<G extends Geometry | null = Geometry>(g: G, params: SrsNameParam): string {
//   return gml3(g, params);
// }

function translateFeature<
  G extends Geometry | null = Geometry,
  P = GeoJsonProperties,
>(
  f: Feature<G, P>,
  ns: Namespace,
  params: Params & SrsNameParam & LayerParam = {},
): XmlElements {
  return empty;
}

/**
 * Turns an array of geojson features into `gml:_feature` strings describing them.
 * @function
 * @param features features to translate to `gml:_feature` XML elements.
 * @param params an object of backup / override parameters
 * @return a `gml:_feature` string.
 */
export function translateFeatures<
  G extends Geometry | null = Geometry,
  P = GeoJsonProperties,
>(
  features: Feature<G, P>[],
  namespaces: Namespaces,
  params: SrsNameParam & GeometryNamesParam & LayerParam = {},
): XmlElements {
  let results = [];
  let { srsName } = params;
  // TODO: srsDimension?
  for (let feature of features) {
    let { id = null } = feature;
    let { ns, layer } = params;
    let fields = '';
    geometryNames.forEach((geometryName) => {
      fields += xmlTag(
        ns,
        geometryName,
        {},
        gml3(feature.geometry, { srsName, srsDimension }),
      );
    });

    result += xmlTag(ns, layer, { 'gml:id': ensureId(layer, id) }, fields);
  }
  return result;
}

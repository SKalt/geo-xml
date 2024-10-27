/**
 * Common utilities for handling parameters for creation of WFS transactions.
 * @module utils
 */

import { GML, type Converter } from 'geojson-to-gml-3/src';

import {
  type Xml,
  Namespaces,
  Namespace,
  type Name,
  tag,
  type AttrValue,
  isName,
  type Attr,
  escape,
  attr,
} from 'minimxml/src';
import type { Feature, Geometry, GeoJsonProperties } from 'geojson';
import type {
  GeometryNameOpt as GeometryNameParam,
  LayerParam,
  SrsNameOpt,
  GetLayerCallback,
} from './typeDefs.js';
import type { Features } from './index.js';
import { AttValueStr, NameStr } from 'packages/minimxml/src/parse';
import { XSI } from './xml.js';

export const asArray = <
  G extends Geometry | null = Geometry,
  P = GeoJsonProperties,
  Extensions extends Record<any, any> = {},
>(
  f: Features<G, P, Extensions>,
): Array<Feature<G, P> & Extensions> =>
  Array.isArray(f) ? f
  : f.type === 'FeatureCollection' ? f.features
  : [f];

const mustBeName = (n: string, id = ''): Name => {
  if (isName(n)) return n;
  else throw new Error(`${id} is not a valid XML name: '${n}'`);
};
const layerToName = (layer: string): Name => mustBeName(layer, 'layer');

const getGeomName = ({
  geometryName = 'geometry' as Name,
}: Partial<GeometryNameParam>): Name =>
  mustBeName(geometryName, 'geometryName');

export const convertProperty = <
  Schema extends string = any,
  P extends GeoJsonProperties = GeoJsonProperties,
>(
  key: keyof P,
  val: any,
  ns: Namespace<any, Schema>,
  namespaces: Namespaces,
): Xml<Schema> => {
  const el = ns.qualify(mustBeName(String(key), 'property'));
  if (val === null) {
    const nil = namespaces.getOrInsert('xsi', XSI).qualify('nil');
    return tag(el, [`${nil}="true"` as Attr]);
  } else {
    return tag(el, [], escape(val));
  }
};

function translateFeature<
  Schema extends string = any,
  G extends Geometry | null = Geometry,
  P extends GeoJsonProperties = GeoJsonProperties,
  Extensions extends Record<any, any> = {},
>(
  f: Feature<G, P> & Extensions,
  params: {
    ns: Namespace<any, Schema>;
    namespaces: Namespaces;
    convertGeom: G extends Geometry ? Converter<G> : undefined;
  },
  options: Partial<
    SrsNameOpt &
      LayerParam &
      GetLayerCallback<P, Extensions> &
      GeometryNameParam & { convertProperty: typeof convertProperty<Schema, P> }
  >,
): Xml<Schema> {
  const { ns, namespaces, convertGeom } = params;
  const { srsName, getLayer } = options;
  let { layer } = options;
  if (!layer && !getLayer)
    throw new Error('layer or getLayer must be provided');
  layer = layer ?? getLayer!(f);
  const geometryName = getGeomName(options);
  const kvp = []; // necessary since we man have neither geometry nor properties
  if (f.geometry !== null) {
    kvp.push(
      tag(
        ns.qualify(geometryName),
        [],
        convertGeom!(f.geometry as any, { srsName }, namespaces),
        // FIXME:    ^^^^^^^^^^^^^^^^^ fix TypeScript inference of G
        // since G can be a **union** of Geometry or null, inferring that G is a
        // subtype of Geometry seems to get messed up here.
      ),
    );
  }
  kvp.push(
    ...Object.entries(f.properties ?? {}).map(([key, val]) =>
      convertProperty(key as keyof P, val, ns, namespaces),
    ),
  );
  const _attrs: Attr[] =
    f.id === undefined ?
      []
    : [
        attr(
          namespaces.getOrInsert('gml', GML).qualify('id'),
          escape(`${layer}.${f.id}`),
        ),
      ];

  return tag(ns.qualify(layerToName(String(layer))), _attrs, ...kvp);
}

/**
Serializes an array of geojson features as `gml:_feature` strings.
@function
@private
@param features features to translate to `gml:_feature` XML elements.
@param params TODO: describe
@param params.ns the XML name representing the features' schema.
@param params.namespaces TODO: describe asdf
@param options TODO: describe
@param options.nsUri the namespace URI for the features' schema.
@return a `gml:_feature` string.
*/
export function translateFeatures<
  N extends string,
  SchemaUri extends string = any,
  G extends Geometry | null = Geometry,
  P extends GeoJsonProperties = GeoJsonProperties,
  Extensions extends Record<any, any> = {},
>(
  features: Array<Feature<G, P> & Extensions>,
  params: {
    namespaces: Namespaces;
    // TODO: demote to option, fall back to parsing nsUri
    nsUri: AttrValue | AttValueStr<SchemaUri>;
    convertGeom: G extends Geometry ? Converter<G> : undefined;
  },
  options: Partial<
    SrsNameOpt &
      LayerParam &
      GetLayerCallback<P, Extensions> &
      GeometryNameParam & {
        convertProperty: typeof convertProperty<SchemaUri, P>;
      } & { ns: Name | NameStr<N> }
  > = {
    convertProperty,
    geometryName: 'geometry' as Name,
  },
): Xml<SchemaUri>[] {
  const { namespaces, convertGeom, nsUri } = params;
  let _ns: Name;
  if (options.ns) {
    _ns = options.ns as Name;
  } else {
    const lastSegment = (nsUri as string).split('/').pop() ?? '';
    if (isName(lastSegment)) _ns = lastSegment;
    else throw new Error(`Cannot infer namespace name from URI: ${nsUri}`);
  }
  const ns = namespaces.getOrInsert(_ns, params.nsUri);
  return features.map(
    (feature): Xml<SchemaUri> =>
      translateFeature<SchemaUri, G, P, Extensions>(
        feature,
        { ns, namespaces, convertGeom },
        options,
      ),
  );
}

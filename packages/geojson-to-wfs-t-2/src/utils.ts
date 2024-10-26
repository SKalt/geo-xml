/**
 * Common utilities for handling parameters for creation of WFS transactions.
 * @module utils
 */

import { GML, type Converter } from 'geojson-to-gml-3/src';

import {
  type XmlElements,
  Namespaces,
  empty,
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
  GeometryNamesOpt as GeometryNameParam,
  LayerParam,
  SrsNameOpt,
  Params,
} from './typeDefs.js';
import type { Features } from '.';
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
): XmlElements<Schema> => {
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
  Extensions = {},
>(
  f: Feature<G, P> & Extensions,
  params: {
    ns: Namespace<any, Schema>;
    namespaces: Namespaces;
    convertGeom: G extends Geometry ? Converter<G> : null;
  },
  opts: Partial<
    SrsNameOpt &
      LayerParam &
      GeometryNameParam & { convertProperty: typeof convertProperty<Schema, P> }
  > = { convertProperty, geometryName: 'geometry' as Name },
): XmlElements<Schema> {
  const { ns, namespaces, convertGeom } = params;
  const { srsName, layer = f.properties?.layer ?? null } = opts;
  if (!layer) throw new Error('missing layer');
  const geometryName = getGeomName(opts);
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
          escape(`${layer}:${f.id}`),
        ),
      ];

  return tag(ns.qualify(layerToName(layer)), _attrs, ...kvp);
}

/**
Serializes an array of geojson features as `gml:_feature` strings.
@function
@private
@param features features to translate to `gml:_feature` XML elements.
@param opts an object of backup / override parameters
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
    ns: Name | NameStr<N>;
    nsUri: AttrValue | AttValueStr<SchemaUri>;
    convertGeom: G extends Geometry ? Converter<G> : null;
  },
  opts: Partial<
    SrsNameOpt &
      GeometryNameParam &
      LayerParam & { convertProperty: typeof convertProperty<SchemaUri, P> }
  > = {
    convertProperty,
  },
): XmlElements<SchemaUri>[] {
  const { namespaces, convertGeom } = params;
  const ns = namespaces.getOrInsert(params.ns, params.nsUri);
  return features.map(
    (feature): XmlElements<SchemaUri> =>
      translateFeature<SchemaUri, G, P, Extensions>(
        feature,
        { ns, namespaces, convertGeom },
        opts,
      ),
  );
}

import {
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from 'geojson';
import {
  attrs,
  AttrValue,
  Name,
  Namespace,
  NsRegistry,
  tag,
  tagFn,
  ToXml,
  Xml,
} from 'packages/minimxml/src';
import {
  type Converter,
  CoordinateOrder,
  GML,
  type Gml,
  type MultiGeometry,
  type Params,
  ToGml,
} from '.';

export type NsParam = {
  /** the qualified name that points to the xmlns with the value of "http://www.opengis.net/gml/3.2" */
  ns: Name;
};
export type IdParam = {
  /** the gml:id */
  gmlId: string | number | bigint | null;
};
export type CoordOrderParam = {
  /** defaults to longitude, latitude */
  order: CoordinateOrder;
};
export type SrsNameParam = {
  /** a string specifying SRS, e.g. 'EPSG:4326'. Only applies to multigeometries. */
  srsName: string;
};
export type GmlIdsParam = {
  /** an array of number/string `gml:ids` of member geometries, if any. */
  gmlIds: Array<IdParam['gmlId']>;
};

export type SrsDimensionParam = {
  /** the dimensionality of each coordinate, i.e. 2 or 3. */
  srsDimension: number; // used to be |string
};

/** @private  */
export type CoordinateConverter<
  Geom extends Exclude<Geometry, GeometryCollection>,
> = (
  gml: Namespace,
  geom: Geom['coordinates'],
  params: Params,
) => ToXml<typeof GML>;

/** @private conversion interface */
type _Converter<Geom extends Geometry = Geometry> = (
  gml: Namespace,
  geom: Geom,
  params: Params,
) => ToXml<typeof GML>;

/**
 * As an optimization, generate a function to reorder coordinates.
 * @see https://macwright.com/lonlat/
 * @private
 * @param  coords An array of coordinates,  [lng, lat, ...etc]
 * @return An array of coordinates in the correct order.
 */
export const coordOrder = (
  order: CoordinateOrder,
): ((input: number[]) => number[]) => {
  switch (order) {
    case CoordinateOrder.LON_LAT:
      return ([lon, lat, ...rest]: number[]) => [lon, lat, ...rest];
    case CoordinateOrder.LAT_LON:
      return ([lon, lat, ...rest]: number[]) => [lat, lon, ...rest];
    default:
      throw new Error('invalid order: ' + order);
  }
};

/**
 * convert a (gml: Namespace, ...) => Gml function to a
 * (...) => (r?: NamespaceRegistry) => Gml function
 */
export const withGmlNamespace = <Geom extends Geometry>(
  fn: _Converter<Geom>,
): Converter<Geom> => {
  return (geom: Geom, params: Params = {}): ToGml =>
    (namespaces?: NsRegistry) => {
      namespaces = namespaces ?? new NsRegistry();
      const { ns = 'gml' as Name } = params;
      const gml = namespaces.getOrInsert(ns, GML as AttrValue);
      return fn(gml, geom, params)(namespaces);
    };
};

export const useCoords =
  <Geom extends Exclude<Geometry, GeometryCollection>>(
    fn: CoordinateConverter<Geom>,
  ): _Converter<Geom> =>
  (gml, geom: Geom, params) =>
    fn(gml, geom.coordinates, params);

export const gmlPoint: CoordinateConverter<Point> = (
  gml: Namespace,
  coordinates: Point['coordinates'],
  params: Partial<
    IdParam & SrsDimensionParam & SrsNameParam & CoordOrderParam
  > = {},
): ToXml<typeof GML> => {
  let {
    order = CoordinateOrder.LON_LAT,
    srsName = null,
    srsDimension = null,
    gmlId = null,
  } = params;
  return tag(
    gml.qualify('Point' as Name),
    attrs({ srsName, srsDimension, [gml.qualify('id' as Name)]: gmlId }),

    tag(
      gml.qualify('pos' as Name),
      attrs({ srsDimension }),
      coordOrder(order)(coordinates).join(' ') as Xml<'text'>,
    ),
  );
};

export const gmlGeometry = (
  gml: Namespace,
  geom: Geometry,
  params: Params = {},
): ToXml<typeof GML> => {
  switch (geom.type) {
    case 'Point':
      return gmlPoint(gml, geom.coordinates, params);
    case 'LineString':
      return gmlLineString(gml, geom.coordinates, params);
    case 'Polygon':
      return gmlPolygon(gml, geom.coordinates, params);
    case 'MultiPoint':
      return gmlMultiPoint(gml, geom, params);
    case 'MultiLineString':
      return gmlMultiLineString(gml, geom, params);
    case 'MultiPolygon':
      return gmlMultiPolygon(gml, geom, params);
    case 'GeometryCollection':
      return gmlGeometryCollection(gml, geom, params);
    default:
      throw new Error(`unknown geometry type: ${(geom as any)?.type}`);
  }
};

export const gmlGeometryCollection: _Converter<GeometryCollection> =
  multi<GeometryCollection>(
    'MultiGeometry',
    'geometryMembers',
    'geometries',
    gmlGeometry,
  );

export const gmlLineString: CoordinateConverter<LineString> = (
  gml: Namespace<any, typeof GML>,
  coordinates: LineString['coordinates'],
  params: Partial<
    SrsDimensionParam & SrsNameParam & IdParam & CoordOrderParam
  > = {},
): ToXml<typeof GML> => {
  let {
    srsName = null,
    srsDimension = null,
    gmlId = null,
    order = CoordinateOrder.LON_LAT,
  } = params;

  return tag(
    gml.qualify('LineString' as Name),
    attrs({ srsName, [gml.qualify('id' as Name)]: gmlId }),

    tag(
      gml.qualify('posList' as Name),
      attrs({ srsDimension }),
      gmlLineStringCoords(coordinates, order),
    ),
  );
};
const gmlLineStringCoords = (
  coordinates: LineString['coordinates'],
  order: CoordinateOrder = CoordinateOrder.LON_LAT,
): Xml<'text'> => {
  let result = '';
  const _order = coordOrder(order);
  for (let pos of coordinates) {
    for (let n of _order(pos)) {
      result += `${n} `;
    }
  }
  return result.trim() as Xml<'text'>;
};

/**
Construct a gml:LinearRing from an array of coordinates
@function
@param coords the coordinates member of the geojson geometry
@param params optional parameters
@returns a string containing gml representing the input geometry
*/
export const gmlLinearRing: CoordinateConverter<LineString> = (
  gml: Namespace<any, typeof GML>,
  coords: LineString['coordinates'],
  params: Partial<
    IdParam & SrsNameParam & SrsDimensionParam & CoordOrderParam
  > = {},
): ToXml<typeof GML> => {
  let {
    srsName = null,
    srsDimension = null,
    gmlId = null,
    order = CoordinateOrder.LON_LAT,
  } = params;
  const _order = coordOrder(order);
  return tag(
    gml.qualify('LinearRing' as Name),
    attrs({ srsName, [gml.qualify('id' as Name)]: gmlId }),

    tag(
      gml.qualify('posList' as Name),
      attrs({ srsDimension }),
      coords.map((e) => _order(e).join(' ')).join(' ') as Xml<''>,
    ),
  );
};

export const gmlPolygon: CoordinateConverter<Polygon> = (
  gml: Namespace<any, typeof GML>,
  coordinates: Polygon['coordinates'],
  params: Partial<IdParam & SrsNameParam> & Params = {},
): ToXml<typeof GML> => {
  let { srsName = null, gmlId = null, ...rest } = params;
  // geom.coordinates are arrays of LinearRings
  let [poly, ...rings] = coordinates;
  const _interior = tagFn(gml.qualify('interior' as Name));

  return tag(
    gml.qualify('Polygon' as Name),
    attrs({ srsName, [gml.qualify('id' as Name)]: gmlId }),

    tag(gml.qualify('exterior' as Name), [], gmlLinearRing(gml, poly, rest)),
    ...rings.map((ring) => _interior([], gmlLinearRing(gml, ring, rest))),
  );
};

export const gmlMultiPoint: _Converter<MultiPoint> = multi<MultiPoint>(
  'MultiPoint',
  'pointMembers', // see file://./../spec/geometryAggregates.xsd#pointMembers
  'coordinates',
  gmlPoint,
);

export const gmlMultiLineString: _Converter<MultiLineString> =
  multi<MultiLineString>(
    'MultiCurve', // see file://./../spec/geometryAggregates.xsd#MultiCurveType
    'curveMembers', // see file://./../spec/geometryBasic0d1d.xsd#CurveArrayPropertyType
    'coordinates',
    gmlLineString,
  );

export const gmlMultiPolygon: _Converter<MultiPolygon> = multi<MultiPolygon>(
  'MultiSurface', // see file://./../spec/geometryAggregates.xsd#MultiSurface
  'surfaceMembers',
  'coordinates',
  gmlPolygon,
);

type ElementOf<T> = T extends Array<infer U> ? U : never;

type Associate<G extends Geometry, Kind, Value> =
  G extends Kind ? Value : never;

type GmlName<G extends MultiGeometry> =
  | Associate<G, MultiPoint, 'MultiPoint'>
  | Associate<G, MultiLineString, 'MultiCurve'>
  | Associate<G, MultiPolygon, 'MultiSurface'>
  | Associate<G, GeometryCollection, 'MultiGeometry'>;

type MemberName<G extends MultiGeometry> =
  | Associate<G, MultiPoint, 'pointMembers'>
  | Associate<G, MultiLineString, 'curveMembers'>
  | Associate<G, MultiPolygon, 'surfaceMembers'>
  | Associate<G, GeometryCollection, 'geometryMembers'>;

type MemberKey<G extends MultiGeometry> = keyof G &
  (G extends GeometryCollection ? 'geometries' : 'coordinates');
type MemberKind<G extends MultiGeometry> = ElementOf<G[MemberKey<G>]>;

type ConverterFn<Collection extends MultiGeometry> = (
  gml: Namespace,
  geom: MemberKind<Collection>,
  params: Params,
) => ToXml<typeof GML>;

/**
 * A handler to compile geometries to multigeometries
 * @function
 * @param elementName the name of the GML element corresponding to the input json {@link MultiGeometry}
 * @param memberElementName the inner element holding the member geometries.
 * @param key the key of the geojson object that points to the array of member
 * geometries or coordinates
 * @param renderMember a callback to render each member geometry to GML
 * @returns a function to render the specified multigeometry collection kind into GML
 * @throws if a member geometry cannot be converted to GML
 */
export function multi<Collection extends MultiGeometry>(
  elementName: GmlName<Collection>,
  memberElementName: MemberName<Collection>,
  key: MemberKey<Collection>,
  renderMember: ConverterFn<Collection>,
): _Converter<Collection> {
  return (
    gml: Namespace<any, typeof GML>,
    geom: Collection,
    params: Params & Partial<GmlIdsParam> = {},
  ) => {
    let { srsName = null, gmlId = null, gmlIds = [], ...rest } = params;

    return tag(
      gml.qualify(elementName as string as Name),
      attrs({ srsName, [gml.qualify('id' as Name)]: gmlId }),
      tag(
        gml.qualify(memberElementName as string as Name),
        [],

        ...(geom[key] as MemberKind<Collection>[]).map((member, i) =>
          renderMember(gml, member, {
            gmlId: gmlIds[i] ?? null,
            ...rest,
          }),
        ),
      ),
    );
  };
}

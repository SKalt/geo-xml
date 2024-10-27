// ©️ Steven Kalt
// Spdx-License-Identifier: PolyForm-Noncommercial-1.0.0 OR PolyForm-Free-Trial-1.0.0

/**
 * A library of functions to convert geojson to GML.
 * @module geojson-to-gml-3
 */

import type {
  BBox,
  Geometry,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson';

import {
  type AttrValue,
  type Name,
  Namespaces,
  tag,
  attrs,
  Namespace,
  tagFn,
  type Xml,
  Text,
} from 'minimxml/src';

export const GML = 'http://www.opengis.net/gml/3.2' as const;

// TODO: document
export type Gml = Xml<typeof GML>;

export const bbox = (
  bbox: BBox,
  params: Params,
  namespaces?: Namespaces | null,
): Gml => {
  namespaces = namespaces ?? new Namespaces();
  const { ns = 'gml' as Name, srsDimension, srsName } = params;
  const gml = namespaces.getOrInsert(ns, GML);

  return tag(
    gml.qualify('Envelope' as Name),
    attrs({
      srsDimension,
      srsName,
    }),
    tag(
      gml.qualify('lowerCorner'),
      [],
      bbox
        .slice(0, bbox.length / 2) // safe since `BBox["length"]` must be either 4 or 6
        .join(' ') as Text, // safe since `BBox` is composed entirely of numbers
    ),
    tag(
      gml.qualify('upperCorner'),
      [],
      bbox.slice(bbox.length / 2).join(' ') as Text,
    ),
  );
};
/**
 The signature of all public geojson-to-gml conversion functions.

 Note this can only convert what geojson can store: simple feature types, not GML
 coverage, topology, etc.
 */
export type Converter<Geom extends Geometry = Geometry> = (
  geom: Geom,
  params: Params,
  namespaces?: Namespaces | null,
) => Gml;

/** @private conversion interface */
type _Converter<Geom extends Geometry = Geometry> = (
  gml: Namespace,
  geom: Geom,
  params: Params,
) => Gml;

/**
 * convert a (gml: Namespace, ...) => XmlElements function to a
 * (...,  Namespace) => XmlElements function
 */
const withGmlNamespace = <Geom extends Geometry>(
  fn: _Converter<Geom>,
): Converter<Geom> => {
  return (
    geom: Geom,
    params: Params = {},
    namespaces: Namespaces | null = null,
  ) => {
    namespaces = namespaces ?? new Namespaces();
    const { ns = 'gml' as Name } = params;
    const gml = namespaces.getOrInsert(ns, GML as AttrValue);
    return fn(gml, geom, params);
  };
};

/** @private  */
type CoordinateConverter<Geom extends Exclude<Geometry, GeometryCollection>> = (
  gml: Namespace,
  geom: Geom['coordinates'],
  params: Params,
) => Gml;

const useCoords =
  <Geom extends Exclude<Geometry, GeometryCollection>>(
    fn: CoordinateConverter<Geom>,
  ): _Converter<Geom> =>
  (gml, geom: Geom, params) =>
    fn(gml, geom.coordinates, params);

type NsParam = {
  /** the qualified name that points to the xmlns with the value of "http://www.opengis.net/gml/3.2" */
  ns: Name;
};
type IdParam = {
  /** the gml:id */
  gmlId: string | number | bigint | null;
};
type CoordOrderParam = {
  /** defaults to longitude, latitude */
  order: CoordinateOrder;
};
type SrsNameParam = {
  /** a string specifying SRS, e.g. 'EPSG:4326'. Only applies to multigeometries. */
  srsName: string;
};
type GmlIdsParam = {
  /** an array of number/string `gml:ids` of member geometries, if any. */
  gmlIds: Array<IdParam['gmlId']>;
};

type SrsDimensionParam = {
  /** the dimensionality of each coordinate, i.e. 2 or 3. */
  srsDimension?: number; // used to be |string
};
/** Optional parameters for conversion of geojson to gml geometries */
export type Params = Partial<
  NsParam & IdParam & CoordOrderParam & SrsNameParam & SrsDimensionParam
> & {};

/**
 * geojson coordinates are in longitude/easting, latitude/northing [,elevation]
 * order by [RFC-7946 § 3.1.1]{@link https://tools.ietf.org/html/rfc7946#section-3.1.1}.
 * however, you may use a CRS that follows a latitude/easting,
 * longitude/northing, [,elevation, [...etc]] order.
 * @see https://macwright.com/lonlat/
 */
export const enum CoordinateOrder {
  /** Geojson's default order */
  LON_LAT = 'lon,lat',
  LAT_LON = 'lat,lon',
}

/**
 * As an optimization, generate a function to reorder coordinates.
 * @see https://macwright.com/lonlat/
 * @param  coords An array of coordinates,  [lng, lat, ...etc]
 * @return An array of coordinates in the correct order.
 */
const coordOrder = (
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

type ElementOf<T> = T extends Array<infer U> ? U : never;

export type MultiGeometry =
  | MultiPoint
  | MultiLineString
  | MultiPolygon
  | GeometryCollection;

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
) => Gml;

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
function multi<Collection extends MultiGeometry>(
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
    ) as Gml;
  };
}

const gmlPoint: CoordinateConverter<Point> = (
  gml: Namespace,
  coordinates: Point['coordinates'],
  params: Partial<
    IdParam & SrsDimensionParam & SrsNameParam & CoordOrderParam
  > = {},
) => {
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
      coordOrder(order)(coordinates).join(' ') as Xml<''>,
    ),
  ) as Gml;
};

/**
Converts an input geojson Point geometry to GML
@function
@param geom the {@link Point} to render to GML
@param params @see Params
@returns a GML string representing the input Point
 @example
```ts @import.meta.vitest
const pt: Point = { type: 'Point', coordinates: [102.0, 0.5] };
expect(point(pt)).toBe(
  `<gml:Point>`
  +`<gml:pos>102 0.5</gml:pos>`
  +`</gml:Point>`
);
```
*/
export const point: Converter<Point> = withGmlNamespace<Point>(
  useCoords(gmlPoint),
);

const gmlLineStringCoords = (
  coordinates: LineString['coordinates'],
  order: CoordinateOrder = CoordinateOrder.LON_LAT,
): Xml<''> => {
  let result = '';
  const _order = coordOrder(order);
  for (let pos of coordinates) {
    for (let n of _order(pos)) {
      result += `${n} `;
    }
  }
  return result.trim() as Xml<''>;
};

const gmlLineString: CoordinateConverter<LineString> = (
  gml: Namespace<any, typeof GML>,
  coordinates: LineString['coordinates'],
  params: Partial<
    SrsDimensionParam & SrsNameParam & IdParam & CoordOrderParam
  > = {},
): Gml => {
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
      gmlLineStringCoords(coordinates, order) as Xml<''>,
    ),
  ) as Gml;
};

/**
Convert an input geojson LineString geometry to gml
@function
@param line the coordinates member of the geojson geometry
@param gmlId the gml:id
@param params optional parameters; @see {@link Params}
@returns a string containing gml representing the input geometry
@example
```ts @import.meta.vitest
const line: LineString = {
  type: 'LineString',
  coordinates: [
    [102.0, 0.0],
    [103.0, 1.0],
    [104.0, 0.0],
    [105.0, 1.0],
  ],
};
expect(lineString(line)).toBe(''
  + `<gml:LineString>`
  +   `<gml:posList>`
  +    `102 0 103 1 104 0 105 1`
  +   `</gml:posList>`
  + `</gml:LineString>`
);
```
*/
export const lineString: Converter<LineString> = withGmlNamespace<LineString>(
  useCoords(gmlLineString),
);

/**
Construct a gml:LinearRing from an array of coordinates
@function
@param coords the coordinates member of the geojson geometry
@param params optional parameters
@returns a string containing gml representing the input geometry
*/
const gmlLinearRing: CoordinateConverter<LineString> = (
  gml: Namespace<any, typeof GML>,
  coords: LineString['coordinates'],
  params: Partial<
    IdParam & SrsNameParam & SrsDimensionParam & CoordOrderParam
  > = {},
): Gml => {
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
  ) as Gml;
};

const gmlPolygon: CoordinateConverter<Polygon> = (
  gml: Namespace<any, typeof GML>,
  coordinates: Polygon['coordinates'],
  params: Partial<IdParam & SrsNameParam> & Params = {},
): Gml => {
  let { srsName = null, gmlId = null, ...rest } = params;
  // geom.coordinates are arrays of LinearRings
  let [poly, ...rings] = coordinates;
  const _interior = tagFn(gml.qualify('interior' as Name));

  return tag(
    gml.qualify('Polygon' as Name),
    attrs({ srsName, [gml.qualify('id' as Name)]: gmlId }),

    tag(gml.qualify('exterior' as Name), [], gmlLinearRing(gml, poly, rest)),
    ...rings.map((ring) => _interior([], gmlLinearRing(gml, ring, rest))),
  ) as Gml;
};

/**
Converts an input geojson Polygon geometry to gml
@function
@param geom the {@link Polygon} to convert to gml
@param params @see Params
@returns a string containing gml representing the input geometry

@example
```ts @import.meta.vitest
const poly: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [100.0, 0.0],
      [101.0, 0.0],
      [101.0, 1.0],
      [100.0, 1.0],
      [100.0, 0.0],
    ],
  ],
};
expect(polygon(poly)).toBe(
    `<gml:Polygon>`
  +   `<gml:exterior>`
  +     `<gml:LinearRing>`
  +       `<gml:posList>`
  +          `100 0`
  +         ` 101 0`
  +         ` 101 1`
  +         ` 100 1`
  +          ` 100 0`
  +       `</gml:posList>`
  +      `</gml:LinearRing>`
  +   `</gml:exterior>`
  + `</gml:Polygon>`
)
```
 */
export const polygon: Converter<Polygon> = withGmlNamespace<Polygon>(
  useCoords(gmlPolygon),
);

const gmlMultiPoint: _Converter<MultiPoint> = multi<MultiPoint>(
  'MultiPoint',
  'pointMembers', // see file://./../spec/geometryAggregates.xsd#pointMembers
  'coordinates',
  gmlPoint,
);
/**
Converts an input geojson MultiPoint geometry to gml
@function
@param geom the {@link MultiPoint} to convert to gml
@param params @see Params
@returns a string containing gml representing the input geometry

@example
```ts @import.meta.vitest
const multiPt: MultiPoint = {
  type: 'MultiPoint',
  coordinates: [
    [100.0, 0.0],
    [101.0, 1.0],
  ],
};
expect(multiPoint(multiPt)).toBe(''
  + `<gml:MultiPoint>`
  +   `<gml:pointMembers>`
  +     `<gml:Point>`
  +`<gml:pos>100 0</gml:pos>`
  +`</gml:Point>`
  +     `<gml:Point>`
  +`<gml:pos>101 1</gml:pos>`
  +`</gml:Point>`
  +   `</gml:pointMembers>`
  + `</gml:MultiPoint>`
);
```
*/
export const multiPoint: Converter<MultiPoint> =
  withGmlNamespace<MultiPoint>(gmlMultiPoint);

const gmlMultiLineString: _Converter<MultiLineString> = multi<MultiLineString>(
  'MultiCurve', // see file://./../spec/geometryAggregates.xsd#MultiCurveType
  'curveMembers', // see file://./../spec/geometryBasic0d1d.xsd#CurveArrayPropertyType
  'coordinates',
  gmlLineString,
);

/**
Converts an input geojson MultiLineString geometry to gml
@function
@param coords the coordinates member of the geojson geometry
@param params @see Params
@returns a string containing gml representing the input geometry

@example
```ts @import.meta.vitest
const geom: MultiLineString = {
  type: 'MultiLineString',
  coordinates: [
    [[100.0, 0.0], [101.0, 1.0]],
    [[102.0, 2.0], [103.0, 3.0]],
  ],
};
expect(multiLineString(geom)).toBe(''
  + `<gml:MultiCurve>`
  +   `<gml:curveMembers>`
  +     `<gml:LineString>`
  +       `<gml:posList>100 0 101 1</gml:posList>`
  +     `</gml:LineString>`
  +     `<gml:LineString>`
  +       `<gml:posList>102 2 103 3</gml:posList>`
  +     `</gml:LineString>`
  +   `</gml:curveMembers>`
  + `</gml:MultiCurve>`
);
```
*/
export const multiLineString: Converter<MultiLineString> =
  withGmlNamespace<MultiLineString>(gmlMultiLineString);

const gmlMultiPolygon: _Converter<MultiPolygon> = multi<MultiPolygon>(
  'MultiSurface', // see file://./../spec/geometryAggregates.xsd#MultiSurface
  'surfaceMembers',
  'coordinates',
  gmlPolygon,
);

/**
Converts an input geojson `MultiPolygon` geometry to GML
@function
@param geom the {@link MultiPolygon} to convert to GML
@param params @see Params
@returns a string containing GML representing the input geometry

@example
```ts @import.meta.vitest
const geom: MultiPolygon = {type: 'MultiPolygon',
  coordinates: [
    [
      [
        [102.0, 2.0],
        [103.0, 2.0],
        [103.0, 3.0],
        [102.0, 3.0],
        [102.0, 2.0],
      ],
    ],
    [
      [
        [100.0, 0.0],
        [101.0, 0.0],
        [101.0, 1.0],
        [100.0, 1.0],
        [100.0, 0.0],
      ],
      [
        [100.2, 0.2],
        [100.8, 0.2],
        [100.8, 0.8],
        [100.2, 0.8],
        [100.2, 0.2],
      ],
    ],
  ],
};
expect(multiPolygon(geom)).toBe(''
  + `<gml:MultiSurface>`
  +   `<gml:surfaceMembers>`
  +     `<gml:Polygon>`
  +      `<gml:exterior>`
  +        `<gml:LinearRing>`
  +           `<gml:posList>102 2 103 2 103 3 102 3 102 2</gml:posList>`
  +         `</gml:LinearRing>`
  +       `</gml:exterior>`
  +     `</gml:Polygon>`
  +     `<gml:Polygon>`
  +       `<gml:exterior>`
  +         `<gml:LinearRing>`
  +           `<gml:posList>100 0 101 0 101 1 100 1 100 0</gml:posList>`
  +          `</gml:LinearRing>`
  +         `</gml:exterior>`
  +       `<gml:interior>`
  +        `<gml:LinearRing>`
  +         `<gml:posList>`
  +           `100.2 0.2 100.8 0.2 100.8 0.8 100.2 0.8 100.2 0.2`
  +          `</gml:posList>`
  +         `</gml:LinearRing>`
  +        `</gml:interior>`
  +     `</gml:Polygon>`
  +   `</gml:surfaceMembers>`
  + `</gml:MultiSurface>`
)
```
*/
export const multiPolygon = withGmlNamespace<MultiPolygon>(gmlMultiPolygon);

const gmlGeometry = (
  gml: Namespace,
  geom: Geometry,
  params: Params = {},
): Gml => {
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
// TODO: document
export const geometry = withGmlNamespace<Geometry>(gmlGeometry);

const gmlGeometryCollection: _Converter<GeometryCollection> =
  multi<GeometryCollection>(
    'MultiGeometry',
    'geometryMembers',
    'geometries',
    gmlGeometry,
  );
// see file://./../spec/geometryAggregates.xsd#MultiGeometry
// see file://./../spec/geometryAggregates.xsd#GeometryArrayPropertyType
// see file://./../spec/geometryBasic0d1d.xsd#GeometryArrayPropertyType

/**
Converts an input geojson GeometryCollection geometry to GML
@function
@param geom the {@link GeometryCollection} to convert to GML
@param params @see Params
@returns a string containing GML representing the input geometry\
@example
```ts @import.meta.vitest
const geom: GeometryCollection = {
  type: 'GeometryCollection',
  geometries: [
    { type: 'Point', coordinates: [100.0, 0.0] },
    {
      type: 'LineString',
      coordinates: [
        [101.0, 0.0],
        [102.0, 1.0],
      ],
    },
  ],
};

expect(geometryCollection(geom)).toBe(''
  + `<gml:MultiGeometry>`
  +  `<gml:geometryMembers>`
  +    `<gml:Point><gml:pos>100 0</gml:pos></gml:Point>`
  +    `<gml:LineString>`
  +     `<gml:posList>101 0 102 1</gml:posList>`
  +    `</gml:LineString>`
  +   `</gml:geometryMembers>`
  + `</gml:MultiGeometry>`
)
```
*/
export const geometryCollection: Converter<GeometryCollection> =
  withGmlNamespace<GeometryCollection>(gmlGeometryCollection);

export default geometry;

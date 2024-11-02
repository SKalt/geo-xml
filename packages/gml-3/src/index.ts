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
  type Name,
  NsRegistry,
  tag,
  attrs,
  type Xml,
  type Text,
} from 'minimxml/src';
import {
  type CoordOrderParam,
  gmlGeometry,
  gmlGeometryCollection,
  gmlLineString,
  gmlMultiLineString,
  gmlMultiPoint,
  gmlMultiPolygon,
  gmlPoint,
  gmlPolygon,
  type IdParam,
  type NsParam,
  type SrsDimensionParam,
  type SrsNameParam,
  useCoords,
  withGmlNamespace,
} from './internal';

export const GML = 'http://www.opengis.net/gml/3.2' as const;

export type Gml = Xml<typeof GML>;

export type ToGml = (r?: NsRegistry) => Gml;
// TODO: document
export const bbox =
  (bbox: BBox, params: Params): ToGml =>
  (namespaces?: NsRegistry): Gml => {
    namespaces = namespaces ?? new NsRegistry();
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
    )(namespaces);
  };
/**
 The signature of all public geojson-to-gml conversion functions.

 Note this can only convert what geojson can store: simple feature types, not GML
 coverage, topology, etc.
 */
export type Converter<Geom extends Geometry = Geometry> = (
  geom: Geom,
  params?: Params,
) => ToGml;

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

export type MultiGeometry =
  | MultiPoint
  | MultiLineString
  | MultiPolygon
  | GeometryCollection;

/*!! use-example file://./../tests/point.example.ts */
/**
Converts an input geojson Point geometry to GML
@function
@param geom the {@link Point} to render to GML
@param params @see Params
@returns a GML string representing the input Point
@example
```ts @import.meta.vitest
const pt: Point = { type: 'Point', coordinates: [102.0, 0.5] };
expect(point(pt)()).toBe(""
  + `<gml:Point>`
  +   `<gml:pos>102 0.5</gml:pos>`
  + `</gml:Point>`
);
```
*/
export const point: Converter<Point> = withGmlNamespace<Point>(
  useCoords(gmlPoint),
);

/*!! use-example file://./../tests/lineString.example.ts */
/**
Convert an input geojson LineString geometry to gml
@function
@param line the coordinates member of the geojson geometry
@param gmlId the gml:id
@param params optional parameters; @see {@link Params}
@returns a string containing gml representing the input geometry
@example
```ts
const { NsRegistry } = await import('minimxml/src');
const line: LineString = {
  type: 'LineString',
  coordinates: [
    [102.0, 0.0],
    [103.0, 1.0],
    [104.0, 0.0],
    [105.0, 1.0],
  ],
};
expect(lineString(line)(new NsRegistry())).toBe(''
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

/*!! use-example file://./../tests/polygon.example.ts */
/**
Converts an input geojson Polygon geometry to gml
@function
@param geom the {@link Polygon} to convert to gml
@param params @see Params
@returns a string containing gml representing the input geometry

@example
```ts
const { NsRegistry } = await import("minimxml/src")
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
expect(polygon(poly)(new NsRegistry())).toBe(
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

/*!! use-example file://./../tests/multiPoint.example.ts */
/**
Converts an input geojson MultiPoint geometry to gml
@function
@param geom the {@link MultiPoint} to convert to gml
@param params @see Params
@returns a string containing gml representing the input geometry

@example
```ts
const { NsRegistry } = await import('minimxml/src');
const multiPt: MultiPoint = {
  type: 'MultiPoint',
  coordinates: [
    [100.0, 0.0],
    [101.0, 1.0],
  ],
};
expect(multiPoint(multiPt)(new NsRegistry())).toBe(''
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

/*!! use-example file://./../tests/multiLineString.example.ts */
/**
Converts an input geojson MultiLineString geometry to gml
@function
@param coords the coordinates member of the geojson geometry
@param params @see Params
@returns a string containing gml representing the input geometry

@example
```ts
const { NsRegistry } = await import('minimxml/src');
const geom: MultiLineString = {
  type: 'MultiLineString',
  coordinates: [
    [[100.0, 0.0], [101.0, 1.0]],
    [[102.0, 2.0], [103.0, 3.0]],
  ],
};
expect(multiLineString(geom)(new NsRegistry())).toBe(''
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

/**
Converts an input geojson `MultiPolygon` geometry to GML
@function
@param geom the {@link MultiPolygon} to convert to GML
@param params @see Params
@returns a string containing GML representing the input geometry

@example
```ts @import.meta.vitest
const { NsRegistry } = await import('minimxml/src');
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
expect(multiPolygon(geom)(new NsRegistry())).toBe(''
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

// TODO: document
export const geometry: Converter<Geometry> =
  withGmlNamespace<Geometry>(gmlGeometry);

/**
Converts an input geojson GeometryCollection geometry to GML
@function
@param geom the {@link GeometryCollection} to convert to GML
@param params @see Params
@returns a string containing GML representing the input geometry\
@example
```ts @import.meta.vitest
const { NsRegistry } = await import('minimxml/src');
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

expect(geometryCollection(geom)(new NsRegistry())).toBe(''
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

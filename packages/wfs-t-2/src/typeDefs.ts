// ©️ Steven Kalt
// Spdx-License-Identifier: PolyForm-Noncommercial-1.0.0 OR PolyForm-Free-Trial-1.0.0

// TODO: rename to params.ts
import { GeoJsonProperties, type Feature } from 'geojson';
import type { Name, Xml, NameStr } from 'minimxml';
import { FES } from 'geojson-to-fes-2';

export type SrsNameOpt = {
  /** srsName, as specified at
   * {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#66 | OGC 09-025r2 § 7.6.5.5}.
   * If undefined, the implicit default is `urn:ogc:def:crs:OGC::CRS84`, which is
   * the projection of all GeoJSON (see {@link https://datatracker.ietf.org/doc/html/rfc7946#section-4})
   */
  srsName: string;
};

export type InputFormatOpt = {
  /** inputFormat, as specified at
   * [OGC 09-025r2 § 7.6.5.4]{@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#65}. */
  inputFormat: string;
};

export type HandleOpt = {
  /** handle parameter, as specified at
   * {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#44 | OGC 09-025r2 § 7.6.2.6} */
  handle: string;
};
export type GeometryNameOpt = {
  /** the name of the feature geometry field. */
  geometryName: Name;
  // TODO: make Record<string, _>
};
export type LayerParam = {
  /** the name of the layer. Should be a valid XML name matching `[A-Za-z_:][A-Za-z_:0-9_.-]*`. */
  layer: string | number | bigint;
};
export type GetLayerCallback<
  P extends GeoJsonProperties,
  Extensions extends Record<any, any>,
> = { getLayer: (feature: Feature<any, P> & Extensions) => Name };

export type NsOpt<N extends string> = { ns: Name | NameStr<N> };

export type FilterParam = {
  filter: Xml<typeof FES>;
};

/**  An object containing optional named parameters. */
export type Params = {
  // TODO: either formalize a shared convertProperty() option or this hack
  // /** an object mapping feature field names to
  //  * feature properties */
  // properties?: Feature['properties'];
};

export type TypeNameOpt = {
  /** feature type within
   * its namespace. See {@link  https://docs.ogc.org/is/09-025r2/09-025r2.html#288 | 09-025r2 § 15.2.5.2.3}
   * or {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#298 | 09-025r2 § 15.2.7.2.1 }.
   */
  typeName: string;
};

/**
 * An object containing optional named parameters for a transaction in addition
 * to parameters used elsewhere.
 */
export type TransactionOpts = {
  /**
   * lockId parameter, as specified at
   * {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#277 | OGC 09-025r2 § 15.2.3.1.2}
   */
  lockId?: string;
  /**
   * releaseAction parameter, as specified
   * at {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#278 | OGC 09-025r2 § 15.2.3.2: `releaseAction` parameter} */
  releaseAction?: 'ALL' | 'SOME';
};

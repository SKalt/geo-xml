// TODO: rename to params.ts
import { type Feature } from "geojson";

export type SrsNameParam = {
  /** srsName, as specified at
   * {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#66 | OGC 09-025r2 § 7.6.5.5}.
   * If undefined, the implicit default is `urn:ogc:def:crs:OGC::CRS84`, which is
   * the projection of all GeoJSON (see {@link https://datatracker.ietf.org/doc/html/rfc7946#section-4})
   */
  srsName?: string;
};

export type InputFormatParam = {
  /** inputFormat, as specified at
   * [OGC 09-025r2 § 7.6.5.4]{@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#65}. */
  inputFormat?: string;
};

export type HandleParam = {
  /** handle parameter, as specified at
   * {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#44 | OGC 09-025r2 § 7.6.2.6} */
  handle?: string;
};
export type GeometryNamesParam = {
  /** the name of the feature geometry field. */
  geometryNames?: string[];
  // TODO: make Record<string, _>
};
export type LayerParam = {
  /** a string layer name */
  layer?: string;
};

/**  An object containing optional named parameters. */
export type Params = {
  /** an xml namespace alias. */
  ns?: string;

  /** an object mapping feature field names to
   * feature properties */
  properties?: Feature["properties"];
  /** feature id */
  id?: string;
  // TODO: deprecate in favor of Params.properties

  /** a fes:Filter. */
  filter?: string;
};
export type TypeNameParam = {
  /** feature type within
   * its namespace. See {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#90 | 09-025r2 § 7.9.2.4.1} */
  typeName?: string;
};

/**
 * An object containing optional named parameters for a transaction in addition
 * to parameters used elsewhere.
 */
export type TransactionParams = Params & {
  /**
   * lockId parameter, as specified at
   * {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#277 | OGC 09-025r2 § 15.2.3.1.2}
   */
  lockId?: string;
  /**
   * releaseAction parameter, as specified
   * at {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#278 | OGC 09-025r2 § 15.2.3.2} */
  releaseAction?: string;
};

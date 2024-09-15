import type { Feature } from 'geojson';
import {
  type Name,
  type Tag,
  tag,
  Namespaces,
  XmlElements,
  tagFn,
  attr,
  escape,
} from 'minimxml/src';
import { FES } from './xml';
import { makeId as ensureId } from './ensure';

/** construct a `<fes:ResourceId rid=??/>` element */
const idFilter = (
  lyr: string, // TODO: mark as AttrValue?
  id: string,
  resourceIdTag: ReturnType<typeof tagFn>,
): XmlElements => {
  return resourceIdTag([attr('rid' as Name, escape(ensureId(lyr, id)))]);
};

/**
 * Builds a filter from feature ids if one is not already input.
 * @function
 * @param filter a possible string filter
 * @param features an array of geojson feature objects
 * @param params an object of backup / override parameters
 * @return A filter, or the input filter if it was a string.
 *
 * @example
 * ```ts
 * import { filter } from "./filter";
 * const features = [{
 *   type: "Feature", id: "id",
 *   geometry: null,
 *   properties: {},
 * }];
 * const myFilter = filter(features, "myLayer");
 * console.log(myFilter); // <fes:Filter><fes:ResourceId rid="myLayer.id"/><fes:ResourceId rid="myLayer.2"/></fes:Filter>
 * ```
 */
export function filter(
  features: Feature[],
  layer: string | null = null,
  namespaces: Namespaces,
): string {
  const fes = namespaces.getOrInsert('fes' as Name, FES);
  const resourceIdTag = tagFn(fes.qualify('ResourceId' as Name));
  let result = [];
  for (let feature of features) {
    let id = feature.id;
    let lyr = feature.properties?.layer ?? layer;
    if (id === null || id === undefined || id === '') continue;
    if (!lyr) continue; // FIXME: is this the correct behavior?

    switch (typeof lyr) {
      case 'string':
      case 'number':
        lyr = String(lyr);
        break;
      default:
        throw new Error(
          `invalid layer '${lyr}' for resource '${id}': must be a string or number`,
        );
    }

    result.push(
      resourceIdTag([attr('rid' as Name, escape(ensureId(lyr, String(id))))]),
    );
  }
  return tag(fes.qualify('Filter' as Name), [], ...result);
}

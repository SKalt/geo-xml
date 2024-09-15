import { LayerParam, Params, TypeNameParam } from './typeDefs';
import {
  Name,
  Namespaces,
  tag as xmlTag,
  type XmlElements,
  attrs,
} from 'minimxml/src';
import { WFS } from './xml';

/**
 * Creates a wfs:Delete action, creating a filter and typeName from feature ids
 * if none are supplied.
 * @see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#295 | OGC 09-025r2 § 15.2.7}
 * @return
 */
export function Delete(
  filter: XmlElements,
  namespaces: Namespaces,
  params: LayerParam & TypeNameParam = {},
): string {
  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
  let { layer, typeName = layer } = params;
  if (!typeName) throw new Error('typeName or layer must be provided');

  return xmlTag(wfs.qualify('Delete' as Name), attrs({ typeName }), filter);
}

import { ScalarValue } from '.';
import { LayerParam, Params, TypeNameOpt } from './typeDefs';
import {
  attrs,
  type Name,
  Namespaces,
  tagFn,
  escapeStr,
  empty,
  XmlElements,
  Attr,
} from 'minimxml/src';

import { WFS, XSI } from './xml';
import { GML } from 'packages/geojson-to-gml-3/src';
import { FES } from './filter';

/**
See {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#286 | OGC 09-025r2 § 15.2.5.2.1}.
*/
type Action = 'replace' | 'insertBefore' | 'insertAfter' | 'remove';

const _handlePropertyValue = (
  // TODO: rename
  value: ScalarValue,
  action: Action,
  valueTag: ReturnType<typeof tagFn<typeof WFS>>,
  namespaces: Namespaces,
): XmlElements<typeof WFS> => {
  if (action === 'remove') return empty;
  if (value !== null) return valueTag([], escapeStr(value.toString()));
  else {
    const nil = namespaces
      .getOrInsert('xsi' as Name, XSI)
      .qualify('nil' as Name);
    return valueTag(attrs({ [nil]: true }), empty);
  }
};

const getTags = (namespaces: Namespaces) => {
  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
  const valueTag = tagFn(wfs.qualify('Value' as Name));
  const keyTag = tagFn(wfs.qualify('ValueReference' as Name));
  const propertyTag = tagFn(wfs.qualify('Property' as Name));
  const updateTag = tagFn(wfs.qualify('Update' as Name));
  return { valueTag, keyTag, propertyTag, updateTag };
};

// Note: <wfs:Update typeName="topp:tasmania_roads">
//   <wfs:Property></> // unbounded number
// THEN
//   <fes:Filter></> // optional

// <wfs:Update typeName="topp:tasmania_roads">
//   <wfs:Property>
//     <wfs:ValueReference>NAME</wfs:ValueReference>
//     <wfs:Value>new name</wfs:Value>
//   </wfs:Property>
//   <fes:Filter>
//     <fes:PropertyIsEqualTo>

type Input = {
  selectors: XmlElements<typeof FES>;
  properties: Record<
    string, // the property name
    ScalarValue // the property value
  >;
  geometry?: Record<
    string, // the property name containing the geometry
    XmlElements<typeof GML> // the geometry value as GML
  >;
  action?: Action;
};

const _update = (
  input: Input,
  typeName: string,
  tags: ReturnType<typeof getTags>,
  namespaces: Namespaces,
): XmlElements<typeof WFS> => {
  const { selectors, properties, action = 'replace', geometry } = input;
  const { keyTag, valueTag, propertyTag, updateTag } = tags;
  const actionAttr = [`action=${action}` as Attr];
  let propertyUpdates: XmlElements<typeof WFS>[] = Object.entries(properties)
    .map(
      ([key, value]): XmlElements<typeof WFS> =>
        propertyTag(
          [],
          keyTag(actionAttr, escapeStr(key)),
          _handlePropertyValue(value, action, valueTag, namespaces),
        ),
    )
    .concat(
      Object.entries(geometry ?? {}).map(
        ([key, value]): XmlElements<typeof WFS> =>
          propertyTag(
            [],
            keyTag(actionAttr, escapeStr(key)),
            action === 'remove' ? empty : value,
          ),
      ),
    );
  return updateTag(attrs({ typeName }), ...propertyUpdates, selectors);
};

export function update(
  input: Input,
  namespaces: Namespaces,
  params: Params & LayerParam & TypeNameOpt,
): XmlElements<typeof WFS> {
  let { layer, typeName } = params;
  typeName = typeName ?? layer;
  if (!typeName) throw new Error('typeName or layer must be provided');

  const tags = getTags(namespaces);

  return _update(input, typeName, tags, namespaces);
}

/**
Updates the input features in bulk with params.properties or by id.
@param inputs // TODO
@param params // TODO
@return a string `wfs:Update` action for every input.
*/
export function bulkUpdate(
  inputs: Input[],
  namespaces: Namespaces,
  params: LayerParam & TypeNameOpt,
): XmlElements<typeof WFS>[] {
  let { layer, typeName } = params;
  typeName = typeName ?? layer;
  if (!typeName) throw new Error('typeName or layer must be provided');

  const tags = getTags(namespaces);

  return inputs.map((input) => _update(input, typeName, tags, namespaces));
}

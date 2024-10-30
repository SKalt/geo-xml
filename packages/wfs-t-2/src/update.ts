import { type ScalarValue } from '.';
import { type LayerParam } from './typeDefs';
import {
  attrs,
  type Name,
  NsRegistry,
  tagFn,
  escapeStr,
  empty,
  type Xml,
  type Attr,
  ToXml,
  concat,
} from 'minimxml/src';

import { WFS, XSI } from './xml';
import { GML } from 'packages/gml-3/src';
import { FES } from 'geojson-to-fes-2/src';

/**
See {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#286 | OGC 09-025r2 § 15.2.5.2.1}.
*/
type Action = 'replace' | 'insertBefore' | 'insertAfter' | 'remove';

const _handlePropertyValue =
  (
    // TODO: rename
    value: ScalarValue,
    action: Action,
    valueTag: ReturnType<typeof tagFn<typeof WFS>>,
  ): ToXml<typeof WFS> =>
  (namespaces: NsRegistry): Xml<typeof WFS> => {
    if (action === 'remove') return empty;
    if (value !== null)
      return valueTag([], (_) => escapeStr(value.toString()))(namespaces);
    else {
      const nil = namespaces
        .getOrInsert('xsi' as Name, XSI)
        .qualify('nil' as Name);
      return valueTag(attrs({ [nil]: true }), (_) => empty)(namespaces);
    }
  };

const getTags = (namespaces: NsRegistry) => {
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
  selectors: ToXml<typeof FES>;
  properties: Record<
    string, // the property name
    ScalarValue // the property value
  >;
  geometry?: Record<
    string, // the property name containing the geometry
    ToXml<typeof GML> // the geometry value as GML
  >;
  action?: Action;
};

export const update =
  (input: Input, layer: string | number | bigint): ToXml<typeof WFS> =>
  (namespaces: NsRegistry): Xml<typeof WFS> => {
    const { selectors, properties, action = 'replace', geometry } = input;
    const { keyTag, valueTag, propertyTag, updateTag } = getTags(namespaces);
    let propertyUpdates: ToXml<typeof WFS>[] = Object.entries(properties)
      .map(
        ([key, value]): ToXml<typeof WFS> =>
          propertyTag(
            [],
            keyTag(attrs({ action }), (_) => escapeStr(key)),
            _handlePropertyValue(value, action, valueTag),
          ),
      )
      .concat(
        Object.entries(geometry ?? {}).map(
          ([key, value]): ToXml<typeof WFS> =>
            propertyTag(
              [],
              keyTag(attrs({ action }), (_) => escapeStr(key)),
              action === 'remove' ? (_) => empty : value,
            ),
        ),
      );
    return updateTag(
      attrs({ typeName: layer }),
      ...propertyUpdates,
      selectors,
    )(namespaces);
  };

/**
Updates the input features in bulk with params.properties or by id.
@see {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#283 | OGC 09-025r2 § 15.2.5}
@param inputs // TODO
@param params // TODO
@return a string `wfs:Update` action for every input.

@example
```ts @import.meta.vitest
const { NsRegistry } = await import("minimxml/src");
const { filter, idFilter } = await import("geojson-to-fes-2/src");
const namespaces = new NsRegistry();
const features = [{
  id: 13,
  properties: { TYPE: "dirt" },
  geometry: null,
}]
const layer = "tasmania_roads";
const actual = bulkUpdate([{
  selectors: filter(features.map(f => idFilter(`${layer}.${f.id}`))),
  properties: { TYPE: "rainbow" },
  action: "replace",
}], layer)(namespaces);

expect(actual).toBe(""
  + `<wfs:Update typeName="tasmania_roads">`
  +   `<wfs:Property>`
  +     `<wfs:ValueReference action="replace">TYPE</wfs:ValueReference>`
  +     `<wfs:Value>rainbow</wfs:Value>`
  +   `</wfs:Property>`
  +   `<fes:Filter>`
  +     `<fes:ResourceId rid="tasmania_roads.13"/>`
  +   `</fes:Filter>`
  + `</wfs:Update>`
);
```
*/
export const bulkUpdate =
  (inputs: Input[], layer: string | number | bigint): ToXml<typeof WFS> =>
  (namespaces: NsRegistry): Xml<typeof WFS> =>
    concat(...inputs.map((input) => update(input, layer)(namespaces)));

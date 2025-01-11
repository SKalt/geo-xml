// ©️ Steven Kalt
// Spdx-License-Identifier: PolyForm-Noncommercial-1.0.0 OR PolyForm-Free-Trial-1.0.0

import { type ScalarValue } from './index.js';
import {
  attrs,
  type Name,
  NsRegistry,
  tagFn,
  escapeStr,
  empty,
  type Xml,
  type ToXml,
  concat,
  type NameStr,
} from 'minimxml';

import { WFS, XSI } from './xml.js';
import { GML } from 'geojson-to-gml-3';
import { FES } from '@geo-xml/fes-2';

/**
See {@link http://docs.opengeospatial.org/is/09-025r2/09-025r2.html#286 | OGC 09-025r2 § 15.2.5.2.1}.
*/
type Action = 'replace' | 'insertBefore' | 'insertAfter' | 'remove';

// TODO: rename
const _handlePropertyValue =
  (action: Action) =>
  (
    value: ScalarValue,
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

type Input = {
  /** a `fes:Filter` query that matches each feature to update */
  filter: ToXml<typeof FES>;
  properties?: Record<
    string, // the property name
    ScalarValue // the property value
  >;
  geometry?: Record<
    string, // the property name containing the geometry
    ToXml<typeof GML> // the geometry value as GML
  >;
  action?: Action;
  /** should be a valid XML name */
  layer: string | number | bigint;
};

/*!! use-example file://./../tests/update.example.ts */
/**
@param input the `fes:Filter` to select the features to update, along with the property values to replace.
@param layer which layer to update. Must be a valid XML name matching `[A-Za-z_:][A-Za-z_:0-9_.-]*`.
@returns a closure that takes a `NsRegistry` tp produce a final string `wfs:Update` action.
@example
```ts
import { filter, idFilter } from '@geo-xml/fes-2';
import { update } from '@geo-xml/wfs-t-2';
import { test, expect } from 'vitest';
import { NsRegistry } from 'minimxml';

test('simple update', () => {
  const layer = 'tasmania_roads' as const;
  const actual = update({
    filter: filter(idFilter(`${layer}.id`)),
    properties: { TYPE: 'rainbow' },
    action: 'replace', // this is the default
    layer,
  })(new NsRegistry());
  expect(actual).toBe(''
    + `<wfs:Update typeName="tasmania_roads">`
    +   `<wfs:Property>`
    +     `<wfs:ValueReference action="replace">`
    +       `TYPE`
    +     `</wfs:ValueReference>`
    +     `<wfs:Value>`
    +       `rainbow`
    +     `</wfs:Value>`
    +   `</wfs:Property>`
    +   `<fes:Filter>`
    +     `<fes:ResourceId rid="tasmania_roads.id"/>`
    +   `</fes:Filter>`
    + `</wfs:Update>`
  );
});
```
 */
export const update =
  (input: Input): ToXml<typeof WFS> =>
  (namespaces: NsRegistry): Xml<typeof WFS> => {
    const {
      filter: selectors,
      properties,
      action = 'replace',
      geometry,
      layer,
    } = input;
    const { keyTag, valueTag, propertyTag, updateTag } = getTags(namespaces);
    let propertyUpdates: ToXml<typeof WFS>[] = Object.entries(properties ?? {})
      .map(
        ([key, value]): ToXml<typeof WFS> =>
          propertyTag(
            [],
            keyTag(attrs({ action }), (_) => escapeStr(key)),
            _handlePropertyValue(action)(value, valueTag),
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

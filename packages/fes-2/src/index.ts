// ©️ Steven Kalt
// Spdx-License-Identifier: PolyForm-Noncommercial-1.0.0 OR PolyForm-Free-Trial-1.0.0

import { type Name, tag, NsRegistry, type Xml, type ToXml } from 'minimxml';
// https://docs.ogc.org/is/09-026r2/09-026r2.html
export const FES = 'http://www.opengis.net/fes/2.0';

export * from './simple.js';
/*!! use-example file://./../tests/idFilter.example.ts */
/**
Builds a filter from feature ids if one is not already input.
@function
@param features an array of geojson feature objects
@param namespaces a mutable object collecting XML namespace declarations
@param layer the layer to filter on. If not provided, the layer is taken from the first feature's properties.
@return A `fes:Filter` element, or the input filter if it was a string.

@example
```ts
import { test, expect } from 'vitest';
import { NsRegistry } from 'minimxml';
import { filter, idFilter } from '@geo-xml/fes-2';

test('simple ID filter', () => {
  expect(filter(idFilter('my_layer.id'))(new NsRegistry())).toBe(''
    + `<fes:Filter>`
    +   `<fes:ResourceId rid="my_layer.id"/>`
    + `</fes:Filter>`
  );
});
```
 */
export const filter =
  /* @__PURE__ */


    (
      predicate: ToXml<typeof FES>,
      ...predicates: ToXml<typeof FES>[]
    ): ToXml<typeof FES> =>
    (namespaces: NsRegistry): Xml<typeof FES> => {
      return tag(
        namespaces.getOrInsert('fes' as Name, FES).qualify('Filter' as Name),
        [],
        predicate,
        ...predicates,
      )(namespaces);
    };

// TODO: add spatial, temporal filters

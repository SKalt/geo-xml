// ©️ Steven Kalt
// Spdx-License-Identifier: PolyForm-Noncommercial-1.0.0 OR PolyForm-Free-Trial-1.0.0

import {
  attrs,
  NsRegistry,
  tag,
  type Name,
  type Xml,
  type ToXml,
} from 'minimxml';
import { WFS } from './xml.js';
import { FES } from '@geo-xml/fes-2';

/*!! use-example file://./../tests/delete.example.ts */
/**
Creates a `wfs:Delete` action using a `fes:Filter`.
The `_` suffix is added to avoid conflict with the `delete` keyword.

@see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#295 | OGC 09-025r2 § 15.2.7}

@param layer the name of the layer to delete from. See {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#298 | 09-025r2 § 15.2.7.2.1}
@param namespaces a mutable object collecting XML namespace declarations.
@example
```ts
import { delete_, transaction } from '@geo-xml/wfs-t-2';
import { filter, idFilter } from '@geo-xml/fes-2';
import { test, expect } from 'vitest';

const layer: string = 'myLayer';
test('deleting a feature by id', () => {
  const del = delete_(layer, filter(idFilter('myLayer.id')));
  const actual = transaction([del])();
  expect(actual).toBe(''
    + `<wfs:Transaction service="WFS" version="2.0.2" xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:wfs="http://www.opengis.net/wfs/2.0">`
    +   `<wfs:Delete typeName="myLayer">`
    +     `<fes:Filter>`
    +       `<fes:ResourceId rid="myLayer.id"/>`
    +     `</fes:Filter>`
    +   `</wfs:Delete>`
    + `</wfs:Transaction>`
  );
});
```
*/
export const delete_ =
  (
    // TODO: allow passing Features<G, P, Extensions> instead of filter?
    layer: string | number | bigint,
    ...filters: ToXml<typeof FES>[]
  ): ToXml<typeof WFS> =>
  (namespaces: NsRegistry): Xml<typeof WFS> => {
    if (!layer) throw new Error('typeName or layer must be provided');

    return tag(
      namespaces.getOrInsert('wfs' as Name, WFS).qualify('Delete' as Name),
      attrs({ typeName: layer }),
      ...filters,
    )(namespaces);
  };

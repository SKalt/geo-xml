import {
  attrs,
  NsRegistry,
  tag,
  type Name,
  type Xml,
  type ToXml,
} from 'minimxml';
import { WFS } from './xml.js';
import { FES } from 'geojson-to-fes-2';

/**
Creates a `wfs:Delete` action using a `fes:Filter`.
The `_` suffix is added to avoid conflict with the `delete` keyword.

@see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#295 | OGC 09-025r2 § 15.2.7}

@param layer the name of the layer to delete from. See {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#298 | 09-025r2 § 15.2.7.2.1}
@param namespaces a mutable object collecting XML namespace declarations.
@example
```ts
const { NsRegistry } = await import('minimxml/src');
const namespaces = new NsRegistry();
const layer = 'myLayer';
const filter = `<fes:Filter><fes:ResourceId rid="${layer}.id"/></fes:Filter>`;

expect(delete_(filter, layer)(namespaces)).toBe(
  `<wfs:Delete typeName="myLayer">${filter}</wfs:Delete>`
);
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

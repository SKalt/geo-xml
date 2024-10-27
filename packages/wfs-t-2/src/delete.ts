import { LayerParam } from './typeDefs';
import { Name, Namespaces, tag, type Xml, attrs } from 'minimxml/src';
import { WFS } from './xml';
import { FES } from './filter';

/**
Creates a `wfs:Delete` action using a `fes:Filter`.
The `_` suffix is added to avoid conflict with the `delete` keyword.

@see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#295 | OGC 09-025r2 § 15.2.7}

@param layer the name of the layer to delete from. See {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#298 | 09-025r2 § 15.2.7.2.1}
@param namespaces a mutable object collecting XML namespace declarations.
@example
```ts @import.meta.vitest
const { Namespaces } = await import('minimxml/src');
const namespaces = new Namespaces();
const layer = 'myLayer';
const filter = `<fes:Filter><fes:ResourceId rid="${layer}.id"/></fes:Filter>`;

expect(delete_(filter, { namespaces, layer })).toBe(
  `<wfs:Delete typeName="myLayer">${filter}</wfs:Delete>`
);
```
*/
export function delete_(
  // TODO: allow passing Features<G, P, Extensions> instead of filter
  filter: Xml<typeof FES>,
  { layer, namespaces }: LayerParam & { namespaces: Namespaces },
): Xml<typeof WFS> {
  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
  if (!layer) throw new Error('typeName or layer must be provided');

  return tag(wfs.qualify('Delete' as Name), attrs({ typeName: layer }), filter);
}

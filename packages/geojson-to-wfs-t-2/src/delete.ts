import { LayerParam, TypeNameOpt } from './typeDefs';
import { Name, Namespaces, tag, type XmlElements, attrs } from 'minimxml/src';
import { WFS } from './xml';
import { FES } from './filter';

/**
Creates a `wfs:Delete` action using a `fes:Filter`.
@see {@link https://docs.ogc.org/is/09-025r2/09-025r2.html#295 | OGC 09-025r2 § 15.2.7}

@example
```ts @import.meta.vitest
const { Namespaces } = await import('minimxml/src');
const ns = new Namespaces();
const filter = `<fes:Filter><fes:ResourceId rid="myLayer.id"/></fes:Filter>`;

expect(Delete(filter, ns, { typeName: 'myType' })).toBe(
  `<wfs:Delete typeName="myType">${filter}</wfs:Delete>`
);
```
*/
export function delete_(
  filter: XmlElements<typeof FES>,
  namespaces: Namespaces,
  params: LayerParam & TypeNameOpt = {}, // TODO: dependent type to ensure typeName or layer is provided
): XmlElements<typeof WFS> {
  const wfs = namespaces.getOrInsert('wfs' as Name, WFS);
  let { layer, typeName = layer } = params;
  if (!typeName) throw new Error('typeName or layer must be provided');

  return tag(wfs.qualify('Delete' as Name), attrs({ typeName }), filter);
}

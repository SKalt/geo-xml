import { type Name, tag, NsRegistry, type Xml, ToXml } from 'minimxml/src';
// https://docs.ogc.org/is/09-026r2/09-026r2.html
export const FES = 'http://www.opengis.net/fes/2.0';

export * from './simple';
/**
Builds a filter from feature ids if one is not already input.
@function
@param features an array of geojson feature objects
@param namespaces a mutable object collecting XML namespace declarations
@param layer the layer to filter on. If not provided, the layer is taken from the first feature's properties.
@return A `fes:Filter` element, or the input filter if it was a string.

@example
```ts @import.meta.vitest
const { NsRegistry } = await import("minimxml/src");
const ns = new NsRegistry();

expect(filter(idFilter("my_layer.id"))(ns)).toBe(""
  + `<fes:Filter>`
  +   `<fes:ResourceId rid="my_layer.id"/>`
  + `</fes:Filter>`
);
```
 */
export const filter =
  (predicates: Xml<typeof FES>[] | Xml<typeof FES>): ToXml<typeof FES> =>
  (namespaces: NsRegistry): Xml<typeof FES> => {
    return tag(
      namespaces.getOrInsert('fes' as Name, FES).qualify('Filter' as Name),
      [],
      ...(typeof predicates === 'string' ? [predicates] : predicates),
    )(namespaces);
  };

// TODO: add spatial, temporal filters

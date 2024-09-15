/**
 * xml utilities.
 * @module xml
 */

type NonEmpty<T extends string> = '' extends T ? never : T;

const _Attr: unique symbol = Symbol('Attr');
const _Name: unique symbol = Symbol('Tag');
const _Safe: unique symbol = Symbol('SafeXML');
// nominal typing
/** a key-value pair per https://www.w3.org/TR/REC-xml/#NT-Attribute */
export type Attr = string & { readonly __brand: typeof _Attr };
export type Name = NonEmpty<string & { readonly __Name: typeof _Name }>;
export type AttrValue = string & { readonly __AttrValue: unique symbol };
type AttrKey = Name;
export type Tag = Name;
/** a string that must be a valid XML element or a concatenation of valid XML
 * documents separated only by spaces. */
export type XmlElements = string & { readonly __XmlElements: typeof _Safe };
// TODO: cdata type?
// TODO: specific FesFilter type

// restrict names to ASCII for simplicity
const asciiNameStartChar = /[A-Za-z_:]/; // see https://www.w3.org/TR/REC-xml/#NT-NameStartChar
const asciiNameChar = /**/ /[A-Za-z_:0-9-_]/; // see https://www.w3.org/TR/REC-xml/#NT-NameChar
const asciiName = new RegExp(
  `^${asciiNameStartChar.source}${asciiNameChar.source}*$`,
);
const isName = (val: string): val is Name => asciiName.test(val);

/** @throws if `val` is not a valid name */
export const name = (val: string): Name => {
  if (isName(val)) return val;
  throw new Error(`invalid name: '${val}'`);
};

const qualifyName = (ns: Name, tag: Name): Tag => `${ns}:${tag}` as Tag;

export class Namespace {
  name: Name;
  uri: AttrValue;
  constructor(ns: Name, uri: AttrValue) {
    this.name = ns;
    this.uri = uri;
  }
  qualify(tag: Name): Tag {
    return qualifyName(this.name, tag);
  }
  attr(): Attr {
    return `xmlns:${this.name}="${this.uri}"` as Attr;
  }
}

const value = (val: any): AttrValue => {
  switch (typeof val) {
    case 'string':
      return escape(val);
    case 'number':
    case 'bigint':
      return val.toString() as AttrValue;
    case 'boolean':
      return (val ? 'true' : 'false') as AttrValue; // FIXME: check acceptability values
    default:
      throw new Error(`unexpected attribute value: ${val}`);
  }
};

const replacements = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&apos;',
  '"': '&quot;',
};

/** Escape XML attribute values.
 * XML attribute values must match /"([^<&"]|&\w+;)*"/
 * Thus, escape `&`, `<`, ` and just to be sure, `'` and `>`
 * @see https://www.w3.org/TR/REC-xml/#NT-Attribute
 * @see https://www.w3.org/TR/REC-xml/#NT-AttValue
 */
export const escape = (str: string): AttrValue & XmlElements => {
  return str.replace(
    /[<>&'"]/g,
    (c) => (replacements as Record<string, string>)[c] ?? '',
  ) as AttrValue & XmlElements;
};

export const attr = (key: AttrKey, val: AttrValue): Attr =>
  `${key}="${val}"` as Attr;

/** Turn an object into a string of xml attribute key-value pairs.
 * @param attrs an object mapping attribute names to attribute values
 * @return a string of xml attribute key-value pairs
 */
export function attrs(
  attrs: Record<string, string | number | null | boolean>,
): Attr[] {
  return Object.entries(attrs)
    .map(([key, val]): Attr | null => {
      if (val === null || val === undefined) return null;
      return attr(name(key), value(val));
    })
    .filter((attr) => attr !== null);
}
export const empty = '' as XmlElements;
export const concat = (...x: XmlElements[]): XmlElements =>
  x.join(empty) as XmlElements;

export const tagFn =
  (tagName: Name) =>
  (attrs: Attr[], ...inner: XmlElements[]) =>
    tag(tagName, attrs, ...inner);

export function tag(
  tag: Tag,
  attrs: Attr[],
  ...inner: XmlElements[]
): XmlElements {
  let _attrs = attrs.sort().join(' ');
  if (_attrs) _attrs = ' ' + _attrs;
  let result = inner.length
    ? `<${tag}${_attrs}>${concat(...inner)}</${tag}>`
    : `<${tag}${_attrs}/>`;
  return result as XmlElements;
}

/** cache validated uris, names, xmlns declarations, tag constructors. */
export class Namespaces {
  private uriToName: Record<AttrValue, Name>;
  private nameToUri: Record<Name, AttrValue>;
  private nameToCache: Record<Name, Namespace>; // and this could be omitted

  constructor(nameToUriMap?: Record<string, string>) {
    this.uriToName = {};
    this.nameToUri = {};
    this.nameToCache = {};
    if (nameToUriMap) {
      this.bulkUpdate(nameToUriMap);
    }
  }

  private set(name: Name, uri: AttrValue): Namespace {
    const ns = new Namespace(name, uri);
    this.uriToName[uri] = ns.name;
    this.nameToUri[name] = ns.uri;
    this.nameToCache[name] = ns;
    return ns;
  }
  get(uri: AttrValue): Namespace | null {
    let name = this.getName(uri);
    if (!name) return null;
    return this.nameToCache[name] ?? null;
  }
  private getName(uri: AttrValue): Name | null {
    return this.uriToName[uri] || null;
  }

  private clone(): Namespaces {
    let clone = new Namespaces();
    Object.assign(clone.uriToName, this.uriToName); // make sure to break object references
    Object.assign(clone.nameToUri, this.nameToUri);
    return clone;
  }

  getOrInsert(name: Name, uri: AttrValue): Namespace {
    return this.get(uri) ?? this.set(name, uri);
  }
  /**
   * update the namespace in-place.
   * @param nameToUriMap a map of names to URIs, e.g. `{ "wfs": "http://www.opengis.net/wfs/2.0"}`
   * @returns a new Namespaces instance with the given namespaces added
   * @throws if a name is already registered with a different URI
   * @throws if a key isn't a valid XML name
   */
  bulkUpdate(nameToUriMap: Record<string, string>): Namespaces {
    for (let [_ns, _uri] of Object.entries(nameToUriMap)) {
      let ns = name(_ns);
      let uri = value(_uri);
      switch (this.nameToUri[ns]) {
        case uri:
          continue; // already registered as the same URI
        case undefined: // not yet registered
          this.set(ns, uri);
          continue;
        default:
          throw new Error(`namespace ${ns} already registered`);
      }
    }
    return this;
  }
  extend(nameToUriMap: Record<string, string>): Namespaces {
    return this.clone().bulkUpdate(nameToUriMap);
  }
  xmlnsAttrs(): Attr[] {
    return Object.values(this.nameToCache)
      .map((ns) => ns.attr())
      .sort();
  }
}

export const spliceXmlns = (xml: XmlElements, ns: Namespaces): XmlElements => {
  return xml.replace('>', ` ${ns.xmlnsAttrs().join(' ')}>`) as XmlElements;
};

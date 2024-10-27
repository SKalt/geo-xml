/**
 * xml utilities.
 * @module xml
 */

import { AttValueStr, NameStr } from './parse';

type NonEmpty<T extends string> = '' extends T ? never : T;

// nominal typing
/** a key-value pair per https://www.w3.org/TR/REC-xml/#NT-Attribute */
export type Attr = string & { readonly _Attr: unique symbol };
export type Name = NonEmpty<string & { readonly _Name: unique symbol }>;
export type AttrValue = string & { readonly _AttrValue: unique symbol };
type AttrKey = Name;
export type Tag<Schema extends string> =
  string extends Schema ? never
  : [Schema] extends [never] ? never
  : Name & { _Schema: Schema };
/** a string that must be a valid XML element or a concatenation of valid XML
 * documents separated only by spaces. */
export type Xml<Schema extends string> =
  string extends Schema ? never
  : [Schema] extends [never] ? never
  : string & { readonly _Xml: unique symbol; readonly _Schema: Schema };

export type Text = Xml<'text'>;
// TODO: specific FesFilter type

// restrict names to ASCII for simplicity
const asciiNameStartChar = /[A-Za-z_:]/; // see https://www.w3.org/TR/REC-xml/#NT-NameStartChar
const asciiNameChar = /**/ /[A-Za-z_:0-9_.-]/; // see https://www.w3.org/TR/REC-xml/#NT-NameChar
const asciiNamePattern = new RegExp(
  `^${asciiNameStartChar.source}${asciiNameChar.source}*$`,
);
export const isName = (val: string): val is Name => asciiNamePattern.test(val);

/** @throws if `val` is not a valid name */
export const name = (val: string): Name => {
  if (isName(val)) return val;
  throw new Error(`invalid name: '${val}'`);
};

const qualifyName = <Schema extends string = any>(
  ns: Name,
  tag: Name,
): Tag<Schema> => // FIXME: figure out schema
  `${ns}:${tag}` as Tag<Schema>;

export class Namespace<N extends string = string, Uri extends string = any> {
  name: Name;
  uri: AttrValue;
  constructor(ns: NameStr<N> | Name, uri: AttValueStr<Uri> | AttrValue) {
    this.name = ns as Name;
    this.uri = uri as AttrValue;
  }
  qualify<S extends string>(tag: NameStr<S> | Name): Tag<Uri> {
    return qualifyName<Uri>(this.name, tag as Name);
  }
  attr(): Attr {
    return `xmlns:${this.name}="${this.uri}"` as Attr;
  }
}

export const escape = (
  val: any,
  fallback: (obj: any) => Xml<'text'> & AttrValue = (_) => {
    throw new Error(`unable to escape ${typeof val}: '${String(val)}'`);
  },
): Xml<'text'> & AttrValue => {
  switch (typeof val) {
    case 'string':
      return escapeStr(val);
    case 'number':
    case 'bigint':
      return val.toString() as Xml<'text'> & AttrValue;
    case 'boolean':
      return (val ? 'true' : 'false') as Xml<'text'> & AttrValue; // FIXME: check acceptability values
    default: // object, function, symbol, undefined
      return fallback(val);
  }
};

const value = (val: any): AttrValue => escape(val);

const replacements = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&apos;',
  '"': '&quot;',
};

/** Escape XML attribute values.
 * XML attribute values must match `/"([^<&"]|&\w+;)*"/` or `/'([^<&']|&\w+;)*'/`.
 * Thus, escape `&`, `<`, `"`, `'` and `>`
 * @see https://www.w3.org/TR/REC-xml/#NT-Attribute
 * @see https://www.w3.org/TR/REC-xml/#NT-AttValue
 */
export const escapeStr = (str: string): AttrValue & Xml<'text'> => {
  return str.replace(
    /[<>&'"]/g,
    (c) => (replacements as Record<string, string>)[c] ?? '',
  ) as AttrValue & Xml<'text'>;
};

export const attr = <K extends string = string, V extends string = string>(
  key: NameStr<K> | AttrKey,
  val: AttValueStr<V> | AttrValue,
): Attr => `${key}="${val}"` as Attr;

/** Turn an object into a string of xml attribute key-value pairs.
 * @param attrs an object mapping attribute names to attribute values
 * @return a string of xml attribute key-value pairs
 */
export function attrs(
  attrs: Record<string, string | number | bigint | boolean | null | undefined>,
): Attr[] {
  return Object.entries(attrs)
    .map(([key, val]): Attr | null => {
      if (val === null || val === undefined) return null;
      return attr(name(key), value(val));
    })
    .filter((attr) => attr !== null);
}
export const empty = '' as Xml<any>;
export const concat = <Schema extends string = any>(
  ...x: Xml<Schema>[]
): Xml<Schema> => x.join(empty) as Xml<Schema>;

export const tagFn =
  <Schema extends string>(tagName: Tag<Schema>) =>
  <Inner extends string>(attrs: Attr[], ...inner: Xml<Inner>[]) =>
    tag<Schema, Inner>(tagName, attrs, ...inner);

export function tag<Schema extends string, InnerSchemata extends string = any>(
  tag: Tag<Schema>,
  attrs: Attr[],
  ...inner: Xml<InnerSchemata>[]
): Xml<Schema> {
  let _attrs = attrs.sort().join(' ');
  if (_attrs) _attrs = ' ' + _attrs;
  let result =
    inner.length ?
      `<${tag}${_attrs}>${concat(...inner)}</${tag}>`
    : `<${tag}${_attrs}/>`;
  return result as Xml<Schema>;
}

/** cache validated uris, names, xmlns declarations, tag constructors. */
export class Namespaces {
  private uriToName: Record<AttrValue, Name>;
  private nameToUri: Record<Name, AttrValue>;
  private nameToCache: Record<Name, Namespace<string>>; // and this could be omitted

  constructor(nameToUriMap?: Record<string, string>) {
    this.uriToName = {};
    this.nameToUri = {};
    this.nameToCache = {};
    if (nameToUriMap) {
      this.bulkUpdate(nameToUriMap);
    }
  }

  private set<N extends string = string, Uri extends string = string>(
    name: NameStr<N> | Name,
    uri: AttValueStr<Uri> | AttrValue,
  ): Namespace {
    const ns = new Namespace<N, Uri>(name, uri);
    this.uriToName[ns.uri] = ns.name;
    this.nameToUri[ns.name] = ns.uri;
    this.nameToCache[ns.name] = ns;
    return ns;
  }
  get<Uri extends string>(uri: AttValueStr<Uri> | AttrValue): Namespace | null {
    let name = this.getName(uri);
    if (!name) return null;
    return this.nameToCache[name] ?? null;
  }
  private getName<Uri extends string>(
    uri: AttValueStr<Uri> | AttrValue,
  ): Name | null {
    return this.uriToName[uri as AttrValue] || null;
  }

  private clone(): Namespaces {
    let clone = new Namespaces();
    Object.assign(clone.uriToName, this.uriToName); // make sure to break object references
    Object.assign(clone.nameToUri, this.nameToUri);
    return clone;
  }

  getOrInsert<N extends string = string, Uri extends string = string>(
    name: NameStr<N> | Name,
    uri: AttValueStr<Uri> | AttrValue,
  ): Namespace<any, Uri> {
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

// export const spliceXmlns = <Schema extends string>(
//   xml: Xml<Schema>,
//   ns: Namespaces,
// ): Xml<Schema> => {
//   return xml.replace('>', ` ${ns.xmlnsAttrs().join(' ')}>`) as Xml<Schema>;
// };

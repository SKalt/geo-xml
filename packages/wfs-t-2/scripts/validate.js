// @ts-check
import {
  XmlDocument,
  xmlRegisterInputProvider,
  XmlXPath,
  XsdValidator,
} from 'libxml2-wasm';
import {
  xmlRegisterFsInputProviders,
  fsInputProviders,
} from 'libxml2-wasm/lib/nodejs.mjs';
import {
  readdir,
  readFileSync,
  readSync,
  promises,
  openSync,
  closeSync,
} from 'node:fs';
import path, { resolve } from 'node:path';
import { NsRegistry } from 'minimxml';

const xmlnsDeclarations = new NsRegistry().bulkUpdate({
  wfs: 'http://www.opengis.net/wfs/2.0',
  gml: 'http://www.opengis.net/gml/3.2',
  fes: 'http://www.opengis.net/fes/2.0',
});

class UrlMapper {
  /**
   *
   * @param {Record<string, string>} mapping url prefixes to file paths
   */
  constructor(mapping) {
    /** @type Map<URL, URL> */
    this.mapping = new Map();
    for (let prefix in mapping) {
      if (prefix.startsWith('.')) prefix = 'file://' + prefix;
      const prefixUrl = new URL(prefix);
      let mapped = mapping[prefix];
      if (mapped.startsWith('.')) {
        mapped = path.resolve(mapped);
      }
      if (!mapped.startsWith('file://')) mapped = 'file://' + mapped;
      const u = new URL(mapped);
      this.mapping.set(prefixUrl, u);
    }
  }
  /**
   *
   * @param {string} _url
   */
  mapUrl(_url) {
    if (_url.startsWith('.')) _url = 'file://' + _url;
    const url = new URL(_url);
    for (const [prefix, replacement] of this.mapping) {
      if (prefix.origin !== url.origin) continue;
      if (!url.pathname.startsWith(prefix.pathname)) continue;
      let _rest = url.pathname.slice(prefix.pathname.length);
      if (_rest.startsWith('/')) _rest = _rest.slice(1);
      const resolved =
        'file://' +
        path.resolve(path.join(replacement.host + replacement.pathname, _rest));
      return resolved;
    }
  }
  /**
   *
   * @param {string} url
   * @returns {boolean} whether the url can be handled by this mapper
   */
  match(url) {
    let _url = this.mapUrl(url);
    if (!_url) return false;
    const result = fsInputProviders.match(_url);
    return result;
  }
  /**
   *
   * @param {string} url
   * @returns {number|undefined}
   */
  open(url) {
    const fileName = this.mapUrl(url);
    if (!fileName) return undefined;
    return fsInputProviders.open(fileName);
  }
  /**
   * Read from a file
   * @param {number} fd File descriptor
   * @param {Uint8Array} buf Buffer to read into, no more than its byteLength shall be read into.
   * @returns number of bytes actually read, -1 on error
   */
  read(fd, buf) {
    return fsInputProviders.read(fd, buf);
  }
  /**
   *
   * @param {number} fd
   * @returns
   */
  close(fd) {
    return fsInputProviders.close(fd);
  }
}

const urlToFs = new UrlMapper({
  'http://www.w3.org/2001/xml.xsd': '../../spec/xml.xsd',
  'http://www.w3.org/1999/xlink.xsd': '../../spec/xlink.xsd',
  'http://schemas.opengis.net/ows/1.1.0/': '../../spec/ows-1/',
  'http://schemas.opengis.net/filter/2.0/': '../../spec/fes-2/',
});

/** @type XmlDocument | undefined */
let wfsSchema;
/** @type XsdValidator | undefined */
let wfsValidator;
async function boot() {
  const [xsd] = await Promise.all([
    promises.readFile('../../spec/wfs-2/wfs.xsd', 'utf-8'),
  ]);
  const wfsSchema = XmlDocument.fromString(xsd);
  xmlRegisterInputProvider(urlToFs);
  wfsValidator = XsdValidator.fromDoc(wfsSchema);
  return wfsValidator;
}

async function validate(file) {
  if (!wfsValidator) throw new Error('Validator not initialized');
  let text = await promises.readFile(file, 'utf-8');
  if (text.includes('<wfs:') && !text.includes('xmlns:wfs')) {
    text = text.replace(/>/, ' xmlns:wfs="http://www.opengis.net/wfs/2.0">');
  }
  if (text.includes('<gml:') && !text.includes('xmlns:gml')) {
    text = text.replace(/>/, ' xmlns:gml="http://www.opengis.net/gml/3.2">');
  }
  if (text.includes('<fes:') && !text.includes('xmlns:fes')) {
    text = text.replace(/>/, ' xmlns:fes="http://www.opengis.net/fes/2.0">');
  }
  const doc = XmlDocument.fromString(text);
  try {
    wfsValidator.validate(doc);
    console.log(`${file} is valid`);
  } catch (err) {
    console.error(`Error validating ${file}: ${err.message}`);
  }
  doc.dispose();
}

async function main() {
  const [files, validator] = await Promise.all([
    promises
      .readdir('tests/snapshots')
      .then((files) => files.filter((f) => f.endsWith('.xml'))),
    boot(),
  ]);
  await Promise.all(files.map((f) => validate('./tests/snapshots/' + f)));
}

main().finally(() => {
  if (wfsValidator) wfsValidator.dispose();
  if (wfsSchema) wfsSchema.dispose();
});

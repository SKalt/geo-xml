// @ts-check

/** include snapshot tests in tsdoc comments */
import { readFile, stat } from 'node:fs/promises';
import { resolve, parse, join } from 'node:path';
async function exists(file) {
  try {
    const f = await stat(file);
    return f.isFile();
  } catch (err) {
    return false;
  }
}
/**
 * @param {string} file
 */
async function getPackageName(file) {
  // walk up the directory tree until we find a package.json
  const dir = parse(file).dir;
  if (dir === '/') throw new Error('Cannot find package.json');

  const pkg = resolve(join(dir, 'package.json'));
  if (!(await exists(pkg))) {
    return await getPackageName(dir);
  }
  /** @type string */
  const text = await readFile(pkg, 'utf8');
  if (!text) throw new Error(`${pkg} is empty`);

  try {
    return JSON.parse(text)['name'];
  } catch (err) {
    console.error('Error parsing package.json', { text });
    throw err;
  }
}

const markerPattern =
  /^(([/][*])|(<!--))!! use-example file:[/][/](?<file>[^ *]+)\s*(([*][/])|-->)/;
const startExample = /^```ts/;
const endExample = /^```/;
/**
 *
 * @param {string} file
 */
async function getMarkers(file) {
  const pkgName = await getPackageName(file);
  const dir = parse(file).dir;
  const text = await readFile(file, 'utf8');
  /** @type { "seek-marker" | "seek-example" | "replace" } */
  let mode = 'seek-marker';
  let output = '';
  let currentExample = '';
  const lines = text.trimEnd().split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i] + '\n';
    if (mode === 'seek-marker') {
      output += line;
      const match = line.match(markerPattern);
      if (match) {
        // read the example from disk
        mode = 'seek-example';
        currentExample = resolve(join(dir, (match.groups ?? {}).file));
      }
    } else if (mode === 'seek-example') {
      output += line;
      const match = line.match(startExample);
      if (match) mode = 'replace';
    } else if (mode === 'replace') {
      if (endExample.test(line)) {
        output += await transformExample(currentExample, pkgName); // TODO: transform
        output += line;
        mode = 'seek-marker';
      }
    }
  }

  return output;
}

/**
 *
 * @param {string} file an absolute path to a file
 * @param {string} pkgName
 */
const transformExample = async (file, pkgName) => {
  // assume the directory structure is src/*.ts, tests/*.ts, tests/snapshots/*
  const text = await readFile(file, 'utf8');
  const expected = [...text.matchAll(/toMatchFileSnapshot/g)];
  const snap = /[.]toMatchFileSnapshot[(][^'"]*['"]([^'"]+)['"][^)]*[)]/gm;
  const matches = [...text.matchAll(snap)];
  if (matches.length !== expected.length) {
    throw new Error(
      `Expected ${expected.length} toMatchFileSnapshot, found ${matches.length}`,
    );
  }
  const files = {};
  await Promise.all(
    matches.map(async (match) => {
      const snapshot = resolve(join(parse(file).dir, match[1]));
      const xml = await readFile(snapshot, 'utf8');
      files[match[1]] = xml;
    }),
  );
  const result = text
    .replaceAll(snap, (_, snapshotPath) => {
      const xml = files[snapshotPath];
      return '.toBe(' + prettyString(xml, '  ', 0, 2) + '\n  )';
    })
    .replaceAll('../src/index.js', pkgName);
  return result;
};

/**
 *
 * @param {string} xml
 * @returns
 */
function prettyString(xml, indent = '  ', level = 0, baseLevel = 0) {
  const p = /([/]>)|(>)|(<[/])|(<)/g;
  const pretty = xml.replace(
    p,
    (match, selfClose, endOpenTag, startCloseTag, startTag) => {
      if (selfClose) return match + '`\n' + indent.repeat(--level) + '`';
      if (endOpenTag) return match + '`\n' + indent.repeat(level) + '`';
      if (startCloseTag) {
        level--;
        return '`\n' + indent.repeat(level) + '`' + match;
      }
      if (startTag) {
        level++;
        return match;
      }
      throw new Error('unreachable');
    },
  );
  const baseJoin = '\n' + indent.repeat(baseLevel) + '+ ';
  return (
    "''" +
    baseJoin +
    '`' +
    pretty
      .split('\n')
      .filter((line) => line.replaceAll('`', '').trim() !== '')
      .join(baseJoin)
  );
}
/**
 * @param {string} file
 */
async function main(file) {
  if (!file) {
    console.error('Usage: include.js <file>');
    process.exit(1);
  }
  // TODO: search, sort src/*.ts files
  const output = await getMarkers(file);
  console.log(output.trimEnd()); // console.log re-adds the trailing newline
}

main(process.argv[2]);

// @ts-check
// check that each of the passed files has a valid SPDX header
import { readFile, writeFile } from 'node:fs/promises';

const c = `// ©️ Steven Kalt`;
const id = `// Spdx-License-Identifier: PolyForm-Noncommercial-1.0.0 OR PolyForm-Free-Trial-1.0.0`;
/**
 *
 * @param {string} file
 * @returns
 */
async function checkHeader(file) {
  const text = await readFile(file, 'utf-8');
  const lines = text.split('\n');
  const [a, b] = [lines[0] === c, lines[1] === id];
  if (process.env.DEBUG) console.log({ file, 0: a, 1: b });
  if (lines[0] === c && lines[1] === id) return true;
  if (text.includes('Spdx-License-Identifier'))
    throw new Error(`Unexpected SPDX header in ${file}`);
  else return false;
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Usage: node checkHeader.js <files>...');
    process.exit(1);
  }
  const results = await Promise.all(files.map((f) => checkHeader(f)));
  const invalid = results.map((x, i) => (x ? '' : files[i])).filter(Boolean);
  if (invalid.length && !!process.env.FIX) {
    await Promise.all(
      invalid.map(async (file) => {
        const text = await readFile(file, 'utf-8');
        await writeFile(file, `${c}\n${id}\n${text}`);
        console.error(`Fixed SPDX header in ${file}`);
      }),
    );
  } else if (invalid.length) {
    console.error(`Missing SPDX headers in\n  - ${invalid.join('\n  - ')}`);
    process.exit(1);
  }
}

await main();

/**
 * Check that all tags on the current commit are named like `package/vN.N.N`, and
 * that `N.N.N` corresponds to the version in that package's `package.json`.
 */
import fs from 'node:fs/promises';
import { promisify } from 'util';
import { exec as _exec } from 'node:child_process';
const exec = promisify(_exec);

await exec('git --no-pager pull --tags')
  .catch(console.error)
  .then(({ stdout }) => console.log(stdout));
const tags = await exec('git --no-pager tag --points-at HEAD')
  .catch(console.error)
  .then(({ stdout }) =>
    stdout
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean),
  );
const tagMap = {
  gml: 'gml-3',
  // TODO: handle GML-2?
  wfs: 'wfs-t-2',
  xml: 'minimxml',
  fes: 'fes-2',
};
const errors = [];
const pattern = /(?<prefix>[a-z-]{3,})\/v\d+.\d+.\d+(-.+)?/;
for (let tag of tags) {
  const match = pattern.exec(tag);
  if (!match) {
    errors.push(new Error(`tag does not match pattern: ${pattern.source}`));
    continue;
  }
  const prefix = match.groups['prefix'];
  const pkgName = tagMap[prefix];
  if (!pkgName) {
    errors.push(new Error(`${prefix}`));
    continue;
  }
  const path = `./packages/${pkgName}/package.json`;
  const { version } = JSON.parse(fs.readFileSync(path, { encoding: 'utf8' }));
  if (version != tag.split('/v')[1]) {
    errors.push(
      new Error(`tag ${tag} does not match version ${version} in ${path}`),
    );
  }
}
if (tags.length && process.env.GITHUB_OUTPUT) {
  console.log(`should_release=true`);
}
errors.forEach(console.error);
if (errors.length) {
  throw 'fail';
}

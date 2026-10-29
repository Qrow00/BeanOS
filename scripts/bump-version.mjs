import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : fileURLToPath(new URL('../app.json', import.meta.url));

const raw = readFileSync(file, 'utf8');

let bumped = false;
const next = raw
  .replace(/"version":\s*"(\d+)\.(\d+)\.(\d+)"/, (_, major, minor, patch) => {
    bumped = true;
    return `"version": "${major}.${minor}.${Number(patch) + 1}"`;
  })
  .replace(/"versionCode":\s*(\d+)/, (_, code) => `"versionCode": ${Number(code) + 1}`);

if (!bumped) {
  console.error(`No expo.version found in ${file}`);
  process.exit(1);
}

JSON.parse(next);
writeFileSync(file, next);

const version = next.match(/"version": "([^"]+)"/)?.[1];
const versionCode = next.match(/"versionCode": (\d+)/)?.[1];
console.log(`version ${version}, versionCode ${versionCode}`);

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'app', '(app)', 'pos', 'history.tsx'), 'utf8');

const block = src.match(/saleCard:\s*\{[\s\S]*?\n {2}\},/);
const failures = [];

if (!block) {
  failures.push('history.tsx saleCard style not found');
} else {
  const body = block[0];
  for (const rule of ['borderWidth: 0', 'elevation: 0', 'shadowOpacity: 0']) {
    if (!body.includes(rule)) failures.push(`saleCard is missing ${rule}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('sale card chrome verification passed');

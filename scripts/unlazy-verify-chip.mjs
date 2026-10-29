import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'src', 'components', 'ui', 'glass', 'GlassChip.tsx');
const src = readFileSync(file, 'utf8');

const failures = [];

if (/borderWidth/.test(src)) failures.push('GlassChip still declares borderWidth');
if (/borderColor/.test(src)) failures.push('GlassChip still declares borderColor');
if (!/extrapolate:\s*'clamp'/.test(src)) failures.push('GlassChip press scale is not clamped');
if (!/transform:\s*\[\{\s*scale:\s*clampedScale\s*\}\]/.test(src)) {
  failures.push('GlassChip transform does not use clampedScale');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('chip border verification passed');

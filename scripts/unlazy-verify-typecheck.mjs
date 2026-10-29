import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');

const result = spawnSync(process.execPath, [tsc, '--noEmit'], {
  cwd: root,
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error(`typecheck failed (exit ${result.status ?? 'no-status'})`);
  process.exit(1);
}

console.log('typecheck passed');

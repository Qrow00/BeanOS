import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'app', '(app)', 'finance', 'index.tsx'), 'utf8');

const failures = [];

if (!/getAllSales/.test(src)) failures.push('Finance does not read sales');
if (!/category: 'Sales'/.test(src)) failures.push('Sale entries are not categorised as Sales');
if (!/source: 'sale'/.test(src)) failures.push('Sale entries are not tagged as sale-sourced');
if (!/source: 'manual'/.test(src)) failures.push('Manual entries are not tagged as manual');
if (!/item\.source === 'manual'/.test(src)) failures.push('Delete is not restricted to manual entries');
if (!/saleEntries/.test(src)) failures.push('Sale entries are not merged into the finance list');
if (!/useFocusEffect/.test(src)) failures.push('Finance does not refresh sales on focus');

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('sales income verification passed');

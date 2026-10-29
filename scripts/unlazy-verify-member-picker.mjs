import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src', 'components', 'pos', 'LoyaltyScanModal.tsx'), 'utf8');

const failures = [];

if (!/getAllCustomers/.test(src)) failures.push('LoyaltyScanModal does not load all members');
if (!/searchCustomers/.test(src)) failures.push('LoyaltyScanModal does not search members');
if (!/nestedScrollEnabled/.test(src)) failures.push('Member list is not a nested scrollable list');
if (!/memberRow/.test(src)) failures.push('Member rows are not rendered');
if (!/is_active/.test(src)) failures.push('Inactive members are not distinguished');
if (/setManualCode\(text\.toUpperCase\(\)\)/.test(src)) failures.push('Search input still forces uppercase, breaking name search');
if (!/Search name or code/.test(src)) failures.push('Search placeholder does not mention name search');

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('member picker verification passed');

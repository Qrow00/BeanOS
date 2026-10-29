import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const history = readFileSync(join(root, 'app', '(app)', 'pos', 'history.tsx'), 'utf8');
const receipt = readFileSync(join(root, 'src', 'components', 'pos', 'ReceiptScreen.tsx'), 'utf8');

const failures = [];

if (!/<View style=\{styles\.detailPane\}>/.test(history)) {
  failures.push('history.tsx detail pane is not a plain View');
}
if (/<GlassPanel[^>]*styles\.detailPane/.test(history)) {
  failures.push('history.tsx still wraps detailPane in GlassPanel (nested glass)');
}

const infoSection = receipt.match(/infoSection:\s*\{[\s\S]*?\n {2}\},/);
if (!infoSection) {
  failures.push('ReceiptScreen infoSection style not found');
} else {
  if (/borderWidth/.test(infoSection[0])) failures.push('ReceiptScreen infoSection still declares borderWidth');
  if (/borderColor/.test(infoSection[0])) failures.push('ReceiptScreen infoSection still declares borderColor');
}
if (/styles\.infoSection,\s*\{[^}]*borderColor/.test(receipt)) {
  failures.push('ReceiptScreen infoSection still receives inline borderColor');
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('receipt pane border verification passed');

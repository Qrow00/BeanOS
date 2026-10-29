import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');

const modal = read('src/components/ui/Modal.tsx');
const payment = read('src/components/pos/PaymentMethodModal.tsx');
const qr = read('src/components/pos/QRPaymentModal.tsx');

const failures = [];

if (/KeyboardAvoidingView/.test(modal)) failures.push('Modal still uses KeyboardAvoidingView');
if (!/keyboardDidShow/.test(modal)) failures.push('Modal does not track keyboard height');
if (!/panelMax/.test(modal)) failures.push('Modal does not compute a numeric panel max height');
if (!/bodyMax/.test(modal)) failures.push('Modal does not bound its scroll body');
if (!/<ScrollView/.test(modal)) failures.push('Modal does not provide a scroll body');
if (!/maxHeight:\s*panelMax/.test(modal)) failures.push('Modal panel max height is not numeric');

if (/<ScrollView/.test(payment)) failures.push('PaymentMethodModal still nests its own ScrollView');
if (/autoFocus/.test(payment)) failures.push('PaymentMethodModal still autoFocuses on open');
if (/scrollToEnd/.test(payment)) failures.push('PaymentMethodModal still scrolls to end on keyboard');

if (/maxHeight:\s*'120%'/.test(qr)) failures.push("QRPaymentModal still overrides maxHeight to 120%");

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('modal bounds verification passed');

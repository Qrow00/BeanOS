import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
const failures = [];

let splash = '';
try {
  splash = read('src/components/intro/BeanOSSplash.tsx');
} catch {
  failures.push('BeanOSSplash component is missing');
}

if (splash) {
  if (!/onFinish/.test(splash)) failures.push('BeanOSSplash has no onFinish contract');
  if (!/bean-logo\.png/.test(splash)) failures.push('BeanOSSplash does not use bean-logo.png');
  if (!/RadialGradient/.test(splash)) failures.push('BeanOSSplash has no radial glow');
  if (!/useSafeAreaInsets/.test(splash)) failures.push('BeanOSSplash ignores safe-area insets');
  if (!/isReduceMotionEnabled/.test(splash)) failures.push('BeanOSSplash ignores reduced motion');
  if (!/Brew · Sell · Grow/.test(splash)) failures.push('BeanOSSplash is missing the tagline');
}

const layout = read('app/_layout.tsx');
if (!/<BeanOSSplash/.test(layout)) failures.push('Root layout does not render BeanOSSplash');
if (!/introDone/.test(layout)) failures.push('Root layout has no intro completion state');
if (!/splashFade/.test(layout)) failures.push('Root layout does not fade the splash out');
if (!/overlayGone/.test(layout)) failures.push('Root layout never unmounts the splash overlay');
if (!/__beanIntroPlayed/.test(layout)) failures.push('Root layout does not play the intro once per launch');

const appJson = JSON.parse(read('app.json'));
const native = appJson.expo?.splash ?? {};
if (native.image !== './assets/intro/splash-logo.png') failures.push('Native splash does not use bean-logo.png');
if (native.backgroundColor !== '#FAF7F2') failures.push('Native splash background is not #FAF7F2');

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('intro verification passed');

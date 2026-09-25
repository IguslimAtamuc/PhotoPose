// End-to-end smoke test: walks the main flows in Chromium with a fake camera
// at iPhone 16 Pro Max size and saves screenshots to e2e-output/.
// Usage: npm run build && npx vite preview --port 4173 & node scripts/e2e-smoke.mjs [baseUrl]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const OUT = 'e2e-output';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
const context = await browser.newContext({
  viewport: { width: 440, height: 956 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  permissions: ['camera'],
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));

let n = 0;
const shot = async (name) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-${name}.png` });
  console.log('✓', name);
};
const click = (sel) => page.locator(sel).first().click();

await page.goto(BASE);
await page.waitForSelector('.onboarding');
await page.waitForTimeout(900);
await shot('onboarding-1');
for (let i = 0; i < 3; i++) {
  await click('button:has-text("Continue")');
  await page.waitForTimeout(600);
  if (i === 0) await shot('onboarding-2');
}
await shot('onboarding-4');
await click('button:has-text("Get started")');
await page.waitForSelector('.home');
await shot('home');
await page.locator('.screen').evaluate((el) => el.scrollTo(0, 900));
await shot('home-scrolled');

await click('.tabbar a[href="#/explore"]');
await page.waitForSelector('.explore');
await shot('explore');
await page.fill('input[type="search"]', 'couple');
await shot('explore-search');
await page.fill('input[type="search"]', '');
await click('.search__filter');
await shot('explore-filters');
await click('.sheet button[aria-label="Close"]');

await click('.pose-grid .pose-card__link');
await page.waitForSelector('.pose-detail');
await shot('pose-detail');
await click('.pose-detail__hero button[aria-label="Save to favorites"]');
await page.locator('.screen').evaluate((el) => el.scrollTo(0, 700));
await shot('pose-detail-scrolled');

await click('button:has-text("Try This Pose")');
await page.waitForSelector('.camera');
await page.waitForSelector('.camera__video.is-live', { timeout: 15000 });
await shot('camera');
// timer defaults to 3 s
await click('.shutter');
await page.waitForTimeout(1200);
await shot('camera-countdown');
await page.waitForSelector('.camera__preview', { timeout: 8000 });
await shot('camera-review');
await click('button:has-text("Use Photo")');
await page.waitForURL(/analyze/);
await shot('analysis-running');
// The model URL may be blocked in CI sandboxes → exercise the error state + fallback.
const outcome = await Promise.race([
  page.waitForSelector('.result', { timeout: 30000 }).then(() => 'result'),
  page.waitForSelector('.state-view--error', { timeout: 30000 }).then(() => 'error'),
]);
if (outcome === 'error') {
  await shot('analysis-error');
  await click('button:has-text("Use basic analysis")');
  await page.waitForSelector('.result', { timeout: 15000 });
}
await page.waitForTimeout(1000);
await shot('result');
await page.locator('.screen').evaluate((el) => el.scrollTo(0, 800));
await shot('result-scrolled');

await page.goto(`${BASE}#/favorites`);
await page.waitForSelector('.favorites');
await shot('favorites');
await page.goto(`${BASE}#/history`);
await page.waitForSelector('.history-row');
await shot('history');
await page.goto(`${BASE}#/profile`);
await page.waitForSelector('.profile');
await shot('profile');
await page.goto(`${BASE}#/premium`);
await page.waitForSelector('.paywall');
await shot('paywall');
await page.goto(`${BASE}#/settings`);
await page.waitForSelector('.settings');
await shot('settings');
await click('button[role="radio"]:has-text("Light")');
await page.goto(`${BASE}#/`);
await page.waitForSelector('.home');
await shot('home-light');

// Reload: favorites + history must persist.
await page.reload();
await page.goto(`${BASE}#/favorites`);
await page.waitForSelector('.fav-card', { timeout: 5000 });
await page.goto(`${BASE}#/history`);
await page.waitForSelector('.history-row', { timeout: 5000 });
console.log('✓ persistence after reload');

// Camera permission denied state
const denied = await browser.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p2 = await denied.newPage();
await p2.addInitScript(() => {
  localStorage.setItem('photopose.v1:settings', JSON.stringify({ state: { hasOnboarded: true, cameraPrimed: true }, version: 1 }));
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
});
await p2.goto(`${BASE}#/camera`);
await p2.click('button:has-text("Enable camera")').catch(() => {});
await p2.waitForTimeout(1500);
await p2.screenshot({ path: `${OUT}/${String(++n).padStart(2, '0')}-camera-state.png` });
console.log('✓ camera-state');

await browser.close();
if (errors.length) {
  console.log('\nConsole/page errors:');
  for (const e of [...new Set(errors)]) console.log(' -', e);
}

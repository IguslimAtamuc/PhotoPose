// Generates PWA / iOS icons from public/icons/logo.svg (run: npm run icons).
import sharp from 'sharp';
const src = 'public/icons/logo.svg';
const out = 'public/icons';
await sharp(src).resize(180, 180).png().toFile(`${out}/apple-touch-icon.png`);
await sharp(src).resize(192, 192).png().toFile(`${out}/icon-192.png`);
await sharp(src).resize(512, 512).png().toFile(`${out}/icon-512.png`);
await sharp(src).resize(64, 64).png().toFile(`${out}/favicon-64.png`);
// Maskable: full-bleed background with the mark in the safe zone.
const svg = (await import('node:fs')).readFileSync(src, 'utf8').replace('rx="116"', 'rx="0"');
await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(`${out}/icon-maskable-512.png`);
console.log('icons generated');

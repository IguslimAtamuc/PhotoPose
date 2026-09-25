// Copies the MediaPipe WASM runtime into public/ so the app self-hosts it
// (no third-party CDN needed at runtime). Runs automatically before dev/build.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
const src = 'node_modules/@mediapipe/tasks-vision/wasm';
const dest = 'public/mediapipe/wasm';
if (!existsSync(src)) {
  console.warn('[copy-mediapipe] @mediapipe/tasks-vision not installed, skipping');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  cpSync(`${src}/${f}`, `${dest}/${f}`);
}
console.log('[copy-mediapipe] runtime copied to', dest);

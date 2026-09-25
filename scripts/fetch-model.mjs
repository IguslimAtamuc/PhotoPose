// Downloads the MediaPipe pose landmarker model into public/models so it is
// served from the same origin as the app. Used by CI. If it fails, the app
// falls back to the official Google-hosted URL at runtime (see app.config.ts).
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
const url = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const dest = 'public/models/pose_landmarker_lite.task';
if (existsSync(dest)) { console.log('[fetch-model] already present'); process.exit(0); }
try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  mkdirSync('public/models', { recursive: true });
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log('[fetch-model] saved', dest);
} catch (e) {
  console.warn('[fetch-model] could not download model (runtime fallback will be used):', e.message);
}

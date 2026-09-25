import type { KeypointName, Skeleton } from '@/models';
import { decodeImage, meanBrightness } from '@/utils/image';
import { scorePose } from './poseScoring';
import { AnalysisError, type PoseAnalysisInput, type PoseAnalysisOutput, type PoseAnalysisService } from './PoseAnalysisService';

/**
 * Mock provider for development, demos and as an explicit offline fallback.
 * It does NOT look at the body: it simulates a detection by perturbing the
 * reference skeleton (seeded by the photo) and runs the real scoring
 * pipeline, so results are structured exactly like real ones and are
 * labelled with provider = "mock" in the UI.
 */
export class MockPoseAnalysisService implements PoseAnalysisService {
  readonly id = 'mock';
  constructor(private latencyMs = 1400) {}

  async analyze(input: PoseAnalysisInput, signal?: AbortSignal): Promise<PoseAnalysisOutput> {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, this.latencyMs);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new AnalysisError('aborted', 'Analysis cancelled'));
      });
    });
    let brightness: number | undefined;
    try {
      const img = await decodeImage(input.image);
      brightness = meanBrightness(img.source);
      img.close();
    } catch {
      throw new AnalysisError('image_invalid', 'We couldn’t read this photo.');
    }
    const rand = seeded(input.image.size + input.width * 31 + input.height * 17);
    const intensity = 0.02 + rand() * 0.06;
    const detected = input.pose.figures.map((f) => withMistake(jitter(f, rand, intensity), rand));
    return scorePose(input.pose, detected, {
      imageAspect: 3 / 4, // simulated detections live in the reference frame
      brightness,
      advanced: input.advanced,
      provider: this.id,
    });
  }
}

function jitter(s: Skeleton, rand: () => number, k: number): Skeleton {
  const out = {} as Skeleton;
  for (const key of Object.keys(s) as KeypointName[]) {
    const limb = /Wrist|Elbow|Knee|Ankle/.test(key) ? 1.8 : 1;
    out[key] = { x: s[key].x + (rand() - 0.5) * k * limb, y: s[key].y + (rand() - 0.5) * k * limb, visibility: 0.95 };
  }
  return out;
}

/** Simulates a typical error: one arm rotated around the shoulder, or a head tilt. */
function withMistake(s: Skeleton, rand: () => number): Skeleton {
  const out = { ...s };
  const side = rand() < 0.5 ? 'left' : 'right';
  const deg = (18 + rand() * 30) * (rand() < 0.5 ? -1 : 1) * (Math.PI / 180);
  const pivot = s[`${side}Shoulder` as KeypointName];
  const rot = (k: KeypointName) => {
    const p = s[k];
    const dx = p.x - pivot.x;
    const dy = p.y - pivot.y;
    out[k] = { ...p, x: pivot.x + dx * Math.cos(deg) - dy * Math.sin(deg), y: pivot.y + dx * Math.sin(deg) + dy * Math.cos(deg) };
  };
  rot(`${side}Elbow` as KeypointName);
  rot(`${side}Wrist` as KeypointName);
  out.nose = { ...s.nose, x: s.nose.x + (rand() < 0.5 ? -1 : 1) * (0.045 + rand() * 0.05) };
  return out;
}

/** Small deterministic PRNG (mulberry32). */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

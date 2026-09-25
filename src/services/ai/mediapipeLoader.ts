/**
 * Lazily loads the MediaPipe PoseLandmarker (WASM + model) on first use.
 * The ~10 MB runtime is only downloaded when the user actually analyses a
 * photo or enables live tracking, and is cached by the service worker.
 */
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { appConfig } from '@/config/app.config';
import { AnalysisError } from './PoseAnalysisService';

type Mode = 'IMAGE' | 'VIDEO';
const cache = new Map<string, Promise<PoseLandmarker>>();

export function loadPoseLandmarker(mode: Mode, numPoses = 1): Promise<PoseLandmarker> {
  const key = `${mode}:${numPoses}`;
  let p = cache.get(key);
  if (!p) {
    p = create(mode, numPoses).catch((e) => {
      cache.delete(key);
      throw e;
    });
    cache.set(key, p);
  }
  return p;
}

async function create(mode: Mode, numPoses: number): Promise<PoseLandmarker> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false && !(await isCached())) {
    throw new AnalysisError('network', 'The AI model needs an internet connection the first time.');
  }
  let vision;
  try {
    vision = await import('@mediapipe/tasks-vision');
  } catch {
    throw new AnalysisError('model_unavailable', 'Could not load the AI engine.');
  }
  const fileset = await vision.FilesetResolver.forVisionTasks(appConfig.ai.mediapipe.wasmBaseUrl);
  let lastError: unknown;
  for (const modelAssetPath of appConfig.ai.mediapipe.modelUrls) {
    for (const delegate of ['GPU', 'CPU'] as const) {
      try {
        return await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath, delegate },
          runningMode: mode,
          numPoses,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (e) {
        lastError = e;
      }
    }
  }
  console.error('[mediapipe] failed to create landmarker', lastError);
  throw new AnalysisError(
    typeof navigator !== 'undefined' && navigator.onLine === false ? 'network' : 'model_unavailable',
    'The AI model could not be loaded.',
  );
}

async function isCached() {
  try {
    return (await caches.keys()).includes('photopose-ai-runtime');
  } catch {
    return false;
  }
}

/** MediaPipe BlazePose (33 landmarks) → PhotoPose 17 keypoints. */
export const BLAZEPOSE_TO_KEYPOINTS = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

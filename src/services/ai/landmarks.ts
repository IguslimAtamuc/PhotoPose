import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { KeypointName, Skeleton } from '@/models';
import { BLAZEPOSE_TO_KEYPOINTS } from './mediapipeLoader';

/** Converts BlazePose landmarks to a PhotoPose skeleton. */
export function landmarksToSkeleton(lms: NormalizedLandmark[]): Skeleton {
  const s = {} as Skeleton;
  for (const [name, idx] of Object.entries(BLAZEPOSE_TO_KEYPOINTS) as [KeypointName, number][]) {
    const l = lms[idx];
    s[name] = { x: l?.x ?? 0, y: l?.y ?? 0, visibility: l?.visibility ?? 0 };
  }
  return s;
}

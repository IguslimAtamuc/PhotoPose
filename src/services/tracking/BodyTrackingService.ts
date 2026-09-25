import type { Skeleton } from '@/models';

/**
 * Real-time body tracking on the live camera preview (skeleton overlay +
 * live match). Implementations: MediaPipe (web), MoveNet (TF.js), or native
 * Vision / ML Kit in a native wrapper.
 */
export interface BodyTrackingService {
  readonly id: string;
  /** Starts tracking; `onFrame` receives skeletons normalized to the video frame. */
  start(video: HTMLVideoElement, onFrame: (figures: Skeleton[]) => void, numPoses?: number): Promise<void>;
  stop(): void;
}

export class NoopBodyTrackingService implements BodyTrackingService {
  readonly id = 'noop';
  async start() {}
  stop() {}
}

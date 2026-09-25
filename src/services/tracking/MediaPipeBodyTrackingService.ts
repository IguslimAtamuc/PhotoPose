import { loadPoseLandmarker } from '@/services/ai/mediapipeLoader';
import { landmarksToSkeleton } from '@/services/ai/landmarks';
import type { Skeleton } from '@/models';
import type { BodyTrackingService } from './BodyTrackingService';

/** Live tracking at ~12 fps to keep the camera preview smooth and battery friendly. */
export class MediaPipeBodyTrackingService implements BodyTrackingService {
  readonly id = 'mediapipe';
  private running = false;
  private handle = 0;

  async start(video: HTMLVideoElement, onFrame: (figures: Skeleton[]) => void, numPoses = 1) {
    this.stop();
    const landmarker = await loadPoseLandmarker('VIDEO', numPoses);
    this.running = true;
    let last = 0;
    const loop = (now: number) => {
      if (!this.running) return;
      if (now - last > 80 && video.readyState >= 2 && video.videoWidth) {
        last = now;
        try {
          const res = landmarker.detectForVideo(video, now);
          onFrame(res.landmarks.map(landmarksToSkeleton));
        } catch (e) {
          console.warn('[tracking] frame failed', e);
        }
      }
      this.handle = requestAnimationFrame(loop);
    };
    this.handle = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.handle);
  }
}

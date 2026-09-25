import { mirrorSkeleton } from '@/data/skeletonBuilder';
import { decodeImage, meanBrightness } from '@/utils/image';
import { loadPoseLandmarker } from './mediapipeLoader';
import { landmarksToSkeleton } from './landmarks';
import { scorePose } from './poseScoring';
import { AnalysisError, type PoseAnalysisInput, type PoseAnalysisOutput, type PoseAnalysisService } from './PoseAnalysisService';

/**
 * On-device analysis: MediaPipe PoseLandmarker detects body keypoints, then
 * `scorePose` compares them with the reference pose. No photo leaves the
 * device. Works offline once the model is cached.
 */
export class MediaPipePoseAnalysisService implements PoseAnalysisService {
  readonly id = 'mediapipe';

  async prepare() {
    await loadPoseLandmarker('IMAGE', 1);
  }

  async analyze(input: PoseAnalysisInput, signal?: AbortSignal): Promise<PoseAnalysisOutput> {
    const numPoses = Math.max(1, Math.min(4, input.pose.figures.length));
    const landmarker = await loadPoseLandmarker('IMAGE', numPoses);
    if (signal?.aborted) throw new AnalysisError('aborted', 'Analysis cancelled');

    let img;
    try {
      img = await decodeImage(input.image);
    } catch {
      throw new AnalysisError('image_invalid', 'We couldn’t read this photo.');
    }
    try {
      const result = landmarker.detect(img.source);
      if (!result.landmarks.length) {
        throw new AnalysisError('no_person', 'We couldn’t find a person in this photo.');
      }
      let figures = result.landmarks.map(landmarksToSkeleton);
      if (input.mirrored) figures = figures.map(mirrorSkeleton);
      return scorePose(input.pose, figures, {
        imageAspect: img.width / img.height,
        brightness: meanBrightness(img.source),
        advanced: input.advanced,
        provider: this.id,
      });
    } catch (e) {
      if (e instanceof AnalysisError) throw e;
      console.error('[mediapipe] detect failed', e);
      throw new AnalysisError('unknown', 'Something went wrong while analysing your photo.');
    } finally {
      img.close();
    }
  }
}

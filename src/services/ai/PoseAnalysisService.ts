import type { AnalysisResult, Pose } from '@/models';

/**
 * AI abstraction layer.
 *
 * Every analysis provider (on-device MediaPipe, MoveNet, a remote endpoint
 * that calls OpenAI / Gemini / Claude / Google Vision, or your own ML model)
 * implements this interface. The UI and use-cases only ever talk to
 * `PoseAnalysisService`, so providers can be swapped in
 * `services/container.ts` without UI changes.
 */
export interface PoseAnalysisInput {
  pose: Pose;
  image: Blob;
  width: number;
  height: number;
  /** True when the image is horizontally mirrored (e.g. mirrored selfie). */
  mirrored: boolean;
  /** Premium users get extra detail (sub-scores, more recommendations). */
  advanced: boolean;
}

/** Everything except the persistence identifiers, which the caller assigns. */
export type PoseAnalysisOutput = Omit<AnalysisResult, 'id' | 'sessionId' | 'createdAt'>;

export interface PoseAnalysisService {
  readonly id: string;
  /** Optional warm-up (download model etc.). Safe to call multiple times. */
  prepare?(): Promise<void>;
  analyze(input: PoseAnalysisInput, signal?: AbortSignal): Promise<PoseAnalysisOutput>;
}

export type AnalysisErrorCode =
  | 'no_person'
  | 'model_unavailable'
  | 'network'
  | 'image_invalid'
  | 'aborted'
  | 'unknown';

export class AnalysisError extends Error {
  constructor(public code: AnalysisErrorCode, message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

/** Photo session + analysis domain models. */

export type FeedbackStatus = 'good' | 'adjust' | 'miss';

export type BodyPart =
  | 'head'
  | 'shoulders'
  | 'arms'
  | 'hands'
  | 'torso'
  | 'hips'
  | 'legs';

export type CompositionAspect = 'framing' | 'composition' | 'lighting' | 'similarity';

export interface Feedback {
  id: string;
  /** Body part or composition aspect this item talks about. */
  area: BodyPart | CompositionAspect;
  kind: 'body' | 'composition';
  status: FeedbackStatus;
  /** Short, human message, e.g. "Raise your right arm slightly". */
  message: string;
  /** 0..100 sub-score for this area, when available. */
  score?: number;
}

export interface AnalysisResult {
  id: string;
  sessionId: string;
  /** Overall pose match 0..100. */
  score: number;
  /** Raw pose similarity 0..100 (without framing/composition). */
  similarity: number;
  bodyFeedback: Feedback[];
  compositionFeedback: Feedback[];
  recommendations: string[];
  /** Which provider produced the result (e.g. "mediapipe", "mock", "openai"). */
  provider: string;
  /** Detected keypoints (normalized to the photo) for drawing, if available. */
  detectedFigures?: import('./pose').Skeleton[];
  createdAt: string;
}

export type SessionStatus = 'captured' | 'analyzing' | 'analyzed' | 'failed';

export interface PhotoSession {
  id: string;
  poseId: string;
  /** Key of the photo blob in the PhotoStore. */
  photoId: string;
  /** Small JPEG data URL for lists (avoids loading full blobs). */
  thumbnail: string;
  width: number;
  height: number;
  source: 'camera' | 'library';
  cameraFacing?: 'user' | 'environment';
  /** True when the stored image is horizontally mirrored. */
  mirrored?: boolean;
  status: SessionStatus;
  result?: AnalysisResult;
  errorCode?: string;
  createdAt: string;
}

/**
 * Pose domain models.
 *
 * A pose is described by one or more *figures* (one per person in the shot).
 * Every figure is a 2D skeleton of 17 keypoints in normalized frame
 * coordinates (0..1, origin top-left, portrait 3:4 frame). The same data is
 * used to draw the pose illustration, the camera overlay and as the reference
 * for AI pose comparison — so real photos can be added later via `imageUrl`
 * without changing anything else.
 */

export const KEYPOINTS = [
  'nose',
  'leftEye',
  'rightEye',
  'leftEar',
  'rightEar',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
] as const;

export type KeypointName = (typeof KEYPOINTS)[number];

export interface Point {
  x: number;
  y: number;
}

export interface Keypoint extends Point {
  /** 0..1 confidence (1 for authored reference poses). */
  visibility?: number;
}

/** Skeleton keypoints use the *subject's* anatomical left/right. */
export type Skeleton = Record<KeypointName, Keypoint>;

export type Difficulty = 'easy' | 'medium' | 'hard';

/** How much of the body the shot is meant to show. Drives overlay + framing feedback. */
export type Framing = 'full' | 'half' | 'closeup';

export type CameraAngle = 'eye-level' | 'low' | 'high' | 'overhead';

export interface Pose {
  id: string;
  title: string;
  categoryIds: string[];
  difficulty: Difficulty;
  /** Optional photo. When absent, the skeleton illustration is used. */
  imageUrl?: string;
  summary: string;
  instructions: string[];
  bodyTips: string[];
  cameraTips: string[];
  tags: string[];
  framing: Framing;
  cameraAngle: CameraAngle;
  figures: Skeleton[];
  /** Premium-only content (see SubscriptionService entitlements). */
  isPremium: boolean;
  /** Relative popularity used for "Popular" sorting (0..100). */
  popularity: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  /** Lucide icon name, resolved in the UI layer. */
  icon: string;
  /** Two-stop gradient used for cards when no image exists. */
  gradient: [string, string];
  imageUrl?: string;
  isPremium?: boolean;
  sortOrder: number;
}

/**
 * Builds reference skeletons from a compact, human-writable description
 * (torso lean, head tilt, limb angles) instead of hand-typed coordinates.
 *
 * Limb angles are absolute, in degrees, from the subject's point of view
 * facing the camera:
 *   0   = pointing straight down
 *   90  = pointing horizontally *outward* (away from the body's midline)
 *   180 = pointing straight up
 *   <0  = crossing inward, towards/over the body
 * "l" = subject's left (appears on the right of the image).
 */
import type { Framing, Keypoint, KeypointName, Point, Skeleton } from '@/models';
import { KEYPOINTS } from '@/models';
import { DEG } from '@/utils/geometry';

export interface LimbSpec {
  /** Upper segment (upper arm / thigh) angle. */
  a: number;
  /** Lower segment (forearm / shin) angle. */
  b: number;
  /** Length multipliers for foreshortening (limb pointing at camera). */
  s1?: number;
  s2?: number;
}

export interface FigureSpec {
  /** Hip-centre offset in body units (≈ torso = 0.3). Use to place several people. */
  x?: number;
  y?: number;
  scale?: number;
  /** Torso lean in degrees; positive leans the upper body to image-right. */
  lean?: number;
  /** 0 = facing camera, 1 = profile. Narrows shoulders/hips. */
  turn?: number;
  /** Head tilt relative to the torso, degrees; positive = towards image-right. */
  head?: number;
  /** -1..1 face turn (moves the nose/eyes sideways). */
  look?: number;
  /** Torso length multiplier (e.g. < 1 when bending towards the camera). */
  torso?: number;
  lArm: LimbSpec;
  rArm: LimbSpec;
  lLeg: LimbSpec;
  rLeg: LimbSpec;
}

const T = 0.3; // torso length
const SHOULDER = 0.105;
const HIP = 0.075;
const UPPER_ARM = 0.15;
const FOREARM = 0.14;
const THIGH = 0.23;
const SHIN = 0.22;
const HEAD = 0.12;

const dir = (angle: number, side: 1 | -1): Point => ({
  x: side * Math.sin(angle * DEG),
  y: Math.cos(angle * DEG),
});

const at = (p: Point, d: Point, len: number): Point => ({ x: p.x + d.x * len, y: p.y + d.y * len });

/** Figure in raw body units (hip centre ≈ origin, y down). */
export function buildRawFigure(spec: FigureSpec): Skeleton {
  const s = spec.scale ?? 1;
  const lean = spec.lean ?? 0;
  const turn = spec.turn ?? 0;
  const w = 1 - 0.55 * turn;
  const H: Point = { x: (spec.x ?? 0), y: (spec.y ?? 0) };

  const up: Point = { x: Math.sin(lean * DEG), y: -Math.cos(lean * DEG) };
  const perp: Point = { x: Math.cos(lean * DEG), y: Math.sin(lean * DEG) };
  const neck = at(H, up, T * (spec.torso ?? 1) * s);

  const headAngle = lean + (spec.head ?? 0);
  const hUp: Point = { x: Math.sin(headAngle * DEG), y: -Math.cos(headAngle * DEG) };
  const hPerp: Point = { x: Math.cos(headAngle * DEG), y: Math.sin(headAngle * DEG) };
  const look = spec.look ?? 0;
  const faceW = 1 - 0.4 * Math.abs(look);
  const nose = at(at(neck, hUp, HEAD * s), hPerp, 0.03 * look * s);
  const eyeBase = at(nose, hUp, 0.025 * s);
  const earBase = at(nose, hUp, 0.012 * s);
  const shift = (p: Point, k: number) => at(p, hPerp, k * s);

  const leftShoulder = at(neck, perp, SHOULDER * w * s);
  const rightShoulder = at(neck, perp, -SHOULDER * w * s);
  const leftHip = at(H, perp, HIP * w * s);
  const rightHip = at(H, perp, -HIP * w * s);

  const limb = (root: Point, l: LimbSpec, side: 1 | -1, len1: number, len2: number) => {
    const j = at(root, dir(l.a, side), len1 * (l.s1 ?? 1) * s);
    const e = at(j, dir(l.b, side), len2 * (l.s2 ?? 1) * s);
    return [j, e] as const;
  };

  const [leftElbow, leftWrist] = limb(leftShoulder, spec.lArm, 1, UPPER_ARM, FOREARM);
  const [rightElbow, rightWrist] = limb(rightShoulder, spec.rArm, -1, UPPER_ARM, FOREARM);
  const [leftKnee, leftAnkle] = limb(leftHip, spec.lLeg, 1, THIGH, SHIN);
  const [rightKnee, rightAnkle] = limb(rightHip, spec.rLeg, -1, THIGH, SHIN);

  return {
    nose,
    leftEye: shift(eyeBase, (0.028 + 0.012 * look) * faceW),
    rightEye: shift(eyeBase, (-0.028 + 0.012 * look) * faceW),
    leftEar: shift(earBase, 0.055 * faceW + 0.02 * look),
    rightEar: shift(earBase, -0.055 * faceW + 0.02 * look),
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
  };
}

/** Frame aspect (width / height) used for all pose illustrations and overlays. */
export const FRAME_ASPECT = 3 / 4;

/**
 * Normalizes one or more raw figures into 0..1 frame coordinates of a 3:4
 * portrait frame, cropping according to the framing.
 */
export function normalizeFigures(raw: Skeleton[], framing: Framing): Skeleton[] {
  const all = raw.flatMap((f) => KEYPOINTS.map((k) => f[k]));
  const headTop = Math.min(...raw.map((f) => f.nose.y - HEAD * 0.95));
  const minX = Math.min(...all.map((p) => p.x)) - 0.06;
  const maxX = Math.max(...all.map((p) => p.x)) + 0.06;
  let top = headTop - 0.02;
  let bottom: number;
  if (framing === 'full') {
    bottom = Math.max(...all.map((p) => p.y)) + 0.04;
  } else if (framing === 'half') {
    bottom = Math.max(...raw.map((f) => Math.max(f.leftHip.y, f.rightHip.y))) + 0.1;
  } else {
    bottom = Math.max(...raw.map((f) => Math.max(f.leftShoulder.y, f.rightShoulder.y))) + 0.14;
  }
  // For crops, only consider horizontal extent of points inside the crop.
  const inside = all.filter((p) => p.y <= bottom);
  const cMinX = framing === 'full' ? minX : Math.min(...inside.map((p) => p.x)) - 0.08;
  const cMaxX = framing === 'full' ? maxX : Math.max(...inside.map((p) => p.x)) + 0.08;

  const padding = framing === 'closeup' ? 0.04 : 0.08;
  const width = cMaxX - cMinX;
  const height = bottom - top;
  // frame units: width 1 ↔ FRAME_ASPECT * height 1
  const scaleF = Math.min(
    (1 - 2 * padding) / (width / FRAME_ASPECT),
    (1 - 2 * padding) / height,
  );
  const cx = (cMinX + cMaxX) / 2;
  // Anchor the crop: centre horizontally; for crops keep head near the top.
  const offsetY = framing === 'full' ? (1 - height * scaleF) / 2 : padding;
  const toFrame = (p: Keypoint): Keypoint => ({
    x: 0.5 + ((p.x - cx) * scaleF) / FRAME_ASPECT,
    y: offsetY + (p.y - top) * scaleF,
    visibility: 1,
  });
  return raw.map((f) => {
    const out = {} as Skeleton;
    for (const k of KEYPOINTS) out[k as KeypointName] = toFrame(f[k]);
    return out;
  });
}

export function buildFigures(specs: FigureSpec[], framing: Framing): Skeleton[] {
  return normalizeFigures(specs.map(buildRawFigure), framing);
}

/** Mirror a skeleton horizontally and swap left/right labels. */
export function mirrorSkeleton(s: Skeleton): Skeleton {
  const m = (p: Keypoint): Keypoint => ({ ...p, x: 1 - p.x });
  return {
    nose: m(s.nose),
    leftEye: m(s.rightEye),
    rightEye: m(s.leftEye),
    leftEar: m(s.rightEar),
    rightEar: m(s.leftEar),
    leftShoulder: m(s.rightShoulder),
    rightShoulder: m(s.leftShoulder),
    leftElbow: m(s.rightElbow),
    rightElbow: m(s.leftElbow),
    leftWrist: m(s.rightWrist),
    rightWrist: m(s.leftWrist),
    leftHip: m(s.rightHip),
    rightHip: m(s.leftHip),
    leftKnee: m(s.rightKnee),
    rightKnee: m(s.leftKnee),
    leftAnkle: m(s.rightAnkle),
    rightAnkle: m(s.leftAnkle),
  };
}

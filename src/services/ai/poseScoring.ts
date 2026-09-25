/**
 * Provider-independent pose comparison.
 *
 * Any provider that can produce 2D body keypoints (MediaPipe, MoveNet,
 * Apple Vision, a server model…) can reuse this to turn detected keypoints
 * into a score + human feedback. LLM-based providers can skip it and return
 * their own `PoseAnalysisOutput`.
 */
import type { BodyPart, Feedback, FeedbackStatus, Framing, KeypointName, Point, Pose, Skeleton } from '@/models';
import { FRAME_ASPECT, mirrorSkeleton } from '@/data/skeletonBuilder';
import { angleDiff, angleOf, clamp, dist, mid, sub } from '@/utils/geometry';
import type { PoseAnalysisOutput } from './PoseAnalysisService';

export interface ScoreContext {
  /** width / height of the analysed photo. */
  imageAspect: number;
  /** Mean luma 0..255, if known. */
  brightness?: number;
  advanced: boolean;
  provider: string;
}

const VIS = 0.5;
const visible = (s: Skeleton, k: KeypointName) => (s[k].visibility ?? 1) >= VIS && s[k].y <= 1.02 && s[k].y >= -0.02 && s[k].x >= -0.02 && s[k].x <= 1.02;

type Side = 'left' | 'right';
const SIDES: Side[] = ['left', 'right'];
const K = (side: Side, part: 'Shoulder' | 'Elbow' | 'Wrist' | 'Hip' | 'Knee' | 'Ankle') => `${side}${part}` as KeypointName;

/** Converts 0..1 coords into an isotropic space (x scaled by aspect). */
function toSpace(s: Skeleton, aspect: number): Skeleton {
  const out = {} as Skeleton;
  for (const k of Object.keys(s) as KeypointName[]) out[k] = { ...s[k], x: s[k].x * aspect };
  return out;
}

/** Angle from straight down (0) to straight up (180). */
const elevation = (a: Point, b: Point) => {
  const v = sub(b, a);
  const len = Math.hypot(v.x, v.y) || 1;
  return Math.acos(clamp(v.y / len, -1, 1)) * (180 / Math.PI);
};

/** Maps an angle error (deg) to 0..1 with a small tolerance. */
const angleScore = (diffDeg: number, tolerance = 10, range = 70) => clamp(1 - Math.max(0, Math.abs(diffDeg) - tolerance) / range);

interface PartEval {
  part: BodyPart;
  score: number; // 0..1
  issue?: string; // message when not good
  good: string;
}

const statusFor = (score: number): FeedbackStatus => (score >= 0.8 ? 'good' : score >= 0.5 ? 'adjust' : 'miss');
const amount = (deg: number) => (Math.abs(deg) < 25 ? 'slightly' : 'more');

/** Which parts a framing is expected to show. */
function expectedParts(framing: Framing): Set<BodyPart> {
  if (framing === 'closeup') return new Set<BodyPart>(['head', 'shoulders']);
  if (framing === 'half') return new Set<BodyPart>(['head', 'shoulders', 'arms', 'hands', 'torso']);
  return new Set<BodyPart>(['head', 'shoulders', 'arms', 'hands', 'torso', 'hips', 'legs']);
}

const WEIGHTS: Record<BodyPart, number> = { head: 1, shoulders: 1, arms: 1.6, hands: 1, torso: 1.2, hips: 0.8, legs: 1.4 };

/** Compares one detected figure with one reference figure (both in isotropic space). */
function evaluatePair(R: Skeleton, D: Skeleton, parts: Set<BodyPart>, prefix: string): PartEval[] {
  const out: PartEval[] = [];
  const has = (...ks: KeypointName[]) => ks.every((k) => visible(D, k));
  const refHas = (...ks: KeypointName[]) => ks.every((k) => visible(R, k));

  const rNeck = mid(R.leftShoulder, R.rightShoulder);
  const dNeck = mid(D.leftShoulder, D.rightShoulder);
  const rHip = mid(R.leftHip, R.rightHip);
  const dHip = mid(D.leftHip, D.rightHip);
  const torsoOk = has('leftShoulder', 'rightShoulder', 'leftHip', 'rightHip');
  const rTorso = dist(rNeck, rHip) || 0.3;
  // If hips are out of frame (closeups), estimate torso length from shoulder width.
  const dTorso = torsoOk ? dist(dNeck, dHip) : dist(D.leftShoulder, D.rightShoulder) * 1.4 || 0.3;
  const rTorsoAngle = angleOf(rHip, rNeck);
  const dTorsoAngle = torsoOk ? angleOf(dHip, dNeck) : -90;

  // HEAD — direction neck→nose relative to the torso.
  if (parts.has('head') && has('nose', 'leftShoulder', 'rightShoulder')) {
    const rTilt = angleDiff(angleOf(rNeck, R.nose), rTorsoAngle);
    const dTilt = angleDiff(angleOf(dNeck, D.nose), dTorsoAngle);
    const d = angleDiff(dTilt, rTilt);
    const score = angleScore(d, 8, 45);
    // d > 0 → head rotated towards image-right (= subject's left) too much.
    out.push({
      part: 'head', score, good: 'Head position looks good',
      issue: `${prefix}Tilt your head ${amount(d)} towards your ${d > 0 ? 'right' : 'left'} shoulder`,
    });
  }

  // SHOULDERS — shoulder line tilt.
  if (parts.has('shoulders') && has('leftShoulder', 'rightShoulder')) {
    const rA = angleOf(R.rightShoulder, R.leftShoulder);
    const dA = angleOf(D.rightShoulder, D.leftShoulder);
    const d = angleDiff(dA, rA); // >0 → left shoulder lower than it should be
    const score = angleScore(d, 5, 30);
    out.push({
      part: 'shoulders', score, good: 'Shoulder angle looks good',
      issue: `${prefix}Drop your ${d > 0 ? 'right' : 'left'} shoulder ${amount(d * 2)}`,
    });
  }

  // TORSO — lean + turn.
  if (parts.has('torso') && torsoOk) {
    const d = angleDiff(dTorsoAngle, rTorsoAngle); // >0 → leaning to image-right (subject's left) too much? angle measured from hip to neck
    const leanScore = angleScore(d, 6, 35);
    const rRatio = dist(R.leftShoulder, R.rightShoulder) / rTorso;
    const dRatio = dist(D.leftShoulder, D.rightShoulder) / dTorso;
    const turn = Math.log(dRatio / rRatio);
    const turnScore = clamp(1 - Math.max(0, Math.abs(turn) - 0.15) / 0.8);
    const score = Math.min(leanScore, turnScore);
    const issue =
      leanScore <= turnScore
        ? `${prefix}Lean your upper body ${amount(d)} to your ${d > 0 ? 'right' : 'left'}`
        : turn > 0
          ? `${prefix}Turn your torso slightly away from the camera`
          : `${prefix}Turn your torso a bit more towards the camera`;
    out.push({ part: 'torso', score, good: 'Torso angle looks good', issue });
  }

  // ARMS — upper arm + forearm directions.
  if (parts.has('arms')) {
    const sides: { side: Side; score: number; issue: string }[] = [];
    for (const side of SIDES) {
      const S = K(side, 'Shoulder'), E = K(side, 'Elbow'), W = K(side, 'Wrist');
      if (!has(S, E) || !refHas(S, E)) continue;
      const upper = angleScore(angleDiff(angleOf(D[S], D[E]), angleOf(R[S], R[E])));
      const lowerOk = has(E, W) && refHas(E, W);
      const lower = lowerOk ? angleScore(angleDiff(angleOf(D[E], D[W]), angleOf(R[E], R[W]))) : upper;
      const score = upper * 0.55 + lower * 0.45;
      const elevD = elevation(D[S], D[E]);
      const elevR = elevation(R[S], R[E]);
      let issue: string;
      if (Math.abs(elevD - elevR) > 15 && upper <= lower + 0.1) {
        issue = elevD < elevR ? `Raise your ${side} arm ${amount(elevR - elevD)}` : `Lower your ${side} arm ${amount(elevD - elevR)}`;
      } else if (lowerOk) {
        const bendD = 180 - Math.abs(angleDiff(angleOf(D[E], D[S]), angleOf(D[E], D[W])));
        const bendR = 180 - Math.abs(angleDiff(angleOf(R[E], R[S]), angleOf(R[E], R[W])));
        issue = Math.abs(bendD - bendR) > 15
          ? bendD < bendR ? `Bend your ${side} elbow more` : `Straighten your ${side} arm a little`
          : `Move your ${side} arm ${amount(angleDiff(angleOf(D[S], D[E]), angleOf(R[S], R[E])))}`;
      } else {
        issue = `Adjust your ${side} arm`;
      }
      sides.push({ side, score, issue: prefix + issue });
    }
    if (sides.length) {
      const worst = sides.reduce((a, b) => (a.score < b.score ? a : b));
      out.push({ part: 'arms', score: sides.reduce((s, x) => s + x.score, 0) / sides.length, good: 'Arms look great', issue: worst.issue });
    }
  }

  // HANDS — wrist position relative to the neck, in torso units.
  if (parts.has('hands')) {
    const sides: { score: number; issue: string }[] = [];
    for (const side of SIDES) {
      const W = K(side, 'Wrist');
      if (!has(W) || !refHas(W)) continue;
      const rv = { x: (R[W].x - rNeck.x) / rTorso, y: (R[W].y - rNeck.y) / rTorso };
      const dv = { x: (D[W].x - dNeck.x) / dTorso, y: (D[W].y - dNeck.y) / dTorso };
      const d = Math.hypot(rv.x - dv.x, rv.y - dv.y);
      const score = clamp(1 - Math.max(0, d - 0.15) / 0.9);
      const nearFace = Math.hypot(R[W].x - R.nose.x, R[W].y - R.nose.y) / rTorso < 0.45;
      const nearHip = Math.min(dist(R[W], R.leftHip), dist(R[W], R.rightHip)) / rTorso < 0.35;
      let issue: string;
      if (nearFace) issue = `Bring your ${side} hand closer to your face`;
      else if (nearHip) issue = `Place your ${side} hand on your hip`;
      else issue = `Move your ${side} hand ${dv.y > rv.y ? 'higher' : 'lower'}`;
      sides.push({ score, issue: prefix + issue });
    }
    if (sides.length) {
      const worst = sides.reduce((a, b) => (a.score < b.score ? a : b));
      out.push({ part: 'hands', score: sides.reduce((s, x) => s + x.score, 0) / sides.length, good: 'Hands are well placed', issue: worst.issue });
    }
  }

  // HIPS — hip line tilt (weight shift).
  if (parts.has('hips') && has('leftHip', 'rightHip')) {
    const d = angleDiff(angleOf(D.rightHip, D.leftHip), angleOf(R.rightHip, R.leftHip)); // >0 → left hip too low
    const score = angleScore(d, 5, 30);
    out.push({ part: 'hips', score, good: 'Hips look good', issue: `${prefix}Shift your weight onto your ${d > 0 ? 'left' : 'right'} leg` });
  }

  // LEGS — thigh + shin directions.
  if (parts.has('legs')) {
    const sides: { score: number; issue: string }[] = [];
    for (const side of SIDES) {
      const Hp = K(side, 'Hip'), Kn = K(side, 'Knee'), An = K(side, 'Ankle');
      if (!has(Hp, Kn) || !refHas(Hp, Kn)) continue;
      const thigh = angleScore(angleDiff(angleOf(D[Hp], D[Kn]), angleOf(R[Hp], R[Kn])));
      const shinOk = has(Kn, An) && refHas(Kn, An);
      const shin = shinOk ? angleScore(angleDiff(angleOf(D[Kn], D[An]), angleOf(R[Kn], R[An]))) : thigh;
      const score = thigh * 0.55 + shin * 0.45;
      let issue: string;
      if (shinOk) {
        const bendD = 180 - Math.abs(angleDiff(angleOf(D[Kn], D[Hp]), angleOf(D[Kn], D[An])));
        const bendR = 180 - Math.abs(angleDiff(angleOf(R[Kn], R[Hp]), angleOf(R[Kn], R[An])));
        if (Math.abs(bendD - bendR) > 15) issue = bendD < bendR ? `Bend your ${side} knee more` : `Straighten your ${side} leg`;
        else {
          const rx = (R[An].x - R[Hp].x) * (side === 'left' ? 1 : -1);
          const dx = (D[An].x - D[Hp].x) * (side === 'left' ? 1 : -1);
          issue = dx > rx ? `Bring your ${side} foot closer to your other foot` : `Step your ${side} foot a little wider`;
        }
      } else {
        issue = `Adjust your ${side} leg`;
      }
      sides.push({ score, issue: prefix + issue });
    }
    if (sides.length) {
      const worst = sides.reduce((a, b) => (a.score < b.score ? a : b));
      out.push({ part: 'legs', score: sides.reduce((s, x) => s + x.score, 0) / sides.length, good: 'Legs look good', issue: worst.issue });
    }
  }
  return out;
}

const weighted = (evals: PartEval[]) => {
  const w = evals.reduce((s, e) => s + WEIGHTS[e.part], 0);
  return w ? evals.reduce((s, e) => s + e.score * WEIGHTS[e.part], 0) / w : 0;
};

const hipX = (s: Skeleton) => (s.leftHip.x + s.rightHip.x + s.leftShoulder.x + s.rightShoulder.x) / 4;

/** Composition checks on the detected figures (0..1 photo coordinates). */
function evaluateComposition(detected: Skeleton[], framing: Framing, brightness?: number): Feedback[] {
  const fb: Feedback[] = [];
  const pts = detected.flatMap((s) => (Object.keys(s) as KeypointName[]).filter((k) => visible(s, k)).map((k) => s[k]));
  const first = detected[0];
  const neckY = (first.leftShoulder.y + first.rightShoulder.y) / 2;
  const headTop = Math.min(...detected.map((s) => s.nose.y - Math.max(0.03, (neckY - s.nose.y) * 1.1)));
  const bottom = Math.max(...pts.map((p) => p.y));
  const bodyH = bottom - headTop;
  const anyVisible = (k: KeypointName) => detected.some((s) => visible(s, k));
  const feet = anyVisible('leftAnkle') || anyVisible('rightAnkle');
  const hips = anyVisible('leftHip') || anyVisible('rightHip');

  let framingScore = 1;
  let framingMsg = 'Framing looks good';
  if (framing === 'full') {
    if (!feet) [framingScore, framingMsg] = [0.4, 'Step back so your whole body is in the frame'];
    else if (headTop < 0 || bottom > 0.985) [framingScore, framingMsg] = [0.7, 'Leave a little space around your head and feet'];
    else if (bodyH < 0.45) [framingScore, framingMsg] = [0.7, 'Move closer — you look small in the frame'];
  } else if (framing === 'half') {
    if (!hips) [framingScore, framingMsg] = [0.55, 'Step back so your waist is in the frame'];
    else if (feet && bodyH < 0.6) [framingScore, framingMsg] = [0.75, 'Move closer for a waist-up shot'];
    else if (headTop < 0) [framingScore, framingMsg] = [0.7, 'Leave a little space above your head'];
  } else {
    const sw = Math.abs(first.leftShoulder.x - first.rightShoulder.x);
    if (hips && sw < 0.3) [framingScore, framingMsg] = [0.7, 'Get closer for a head-and-shoulders crop'];
    else if (headTop < 0) [framingScore, framingMsg] = [0.75, 'Leave a little space above your head'];
  }
  fb.push({ id: 'framing', area: 'framing', kind: 'composition', status: statusFor(framingScore), message: framingMsg, score: Math.round(framingScore * 100) });

  const cx = detected.reduce((s, d) => s + hipX(d), 0) / detected.length;
  const off = Math.abs(cx - 0.5);
  const thirds = Math.min(Math.abs(cx - 1 / 3), Math.abs(cx - 2 / 3));
  let compScore = 1;
  let compMsg = 'Subject is nicely centred';
  if (off < 0.1) compMsg = 'Subject is nicely centred';
  else if (thirds < 0.06) compMsg = 'Nice rule-of-thirds placement';
  else [compScore, compMsg] = [clamp(1 - off * 1.5, 0.4, 0.79), `Shift the subject a little to the ${cx < 0.5 ? 'right' : 'left'} of the frame`];
  if (compScore >= 0.8 && framing !== 'closeup' && headTop > 0.3) {
    [compScore, compMsg] = [0.7, 'Lots of empty space above — tilt the camera down or move closer'];
  }
  fb.push({ id: 'composition', area: 'composition', kind: 'composition', status: statusFor(compScore), message: compMsg, score: Math.round(compScore * 100) });

  if (brightness !== undefined) {
    let s = 1;
    let m = 'Lighting looks good';
    if (brightness < 55) [s, m] = [0.45, 'It’s quite dark — find more light or face a window'];
    else if (brightness < 85) [s, m] = [0.72, 'A little more light would help'];
    else if (brightness > 215) [s, m] = [0.72, 'Very bright — avoid harsh direct light'];
    fb.push({ id: 'lighting', area: 'lighting', kind: 'composition', status: statusFor(s), message: m, score: Math.round(s * 100) });
  }
  return fb;
}

/**
 * Scores detected figures against a reference pose.
 * @param detected Skeletons normalized to the photo (0..1), anatomical sides.
 */
export function scorePose(pose: Pose, detected: Skeleton[], ctx: ScoreContext): PoseAnalysisOutput {
  const parts = expectedParts(pose.framing);
  const refs = [...pose.figures].sort((a, b) => hipX(a) - hipX(b));
  const dets = [...detected].sort((a, b) => hipX(a) - hipX(b)).slice(0, Math.max(refs.length, 1));

  // Greedy pairing by horizontal position.
  const pairs: [Skeleton, Skeleton][] = [];
  const free = [...refs];
  for (const d of dets) {
    if (!free.length) break;
    let best = 0;
    free.forEach((r, i) => {
      if (Math.abs(hipX(r) - hipX(d)) < Math.abs(hipX(free[best]) - hipX(d))) best = i;
    });
    pairs.push([free.splice(best, 1)[0], d]);
  }

  const multi = refs.length > 1;
  const perPart = new Map<BodyPart, PartEval[]>();
  pairs.forEach(([ref, det], i) => {
    const prefix = multi ? `Person ${i + 1}: ` : '';
    const D = toSpace(det, ctx.imageAspect);
    const a = evaluatePair(toSpace(ref, FRAME_ASPECT), D, parts, prefix);
    const b = evaluatePair(toSpace(mirrorSkeleton(ref), FRAME_ASPECT), D, parts, prefix);
    const evals = weighted(b) > weighted(a) ? b : a;
    for (const e of evals) perPart.set(e.part, [...(perPart.get(e.part) ?? []), e]);
  });

  const ORDER: BodyPart[] = ['head', 'shoulders', 'arms', 'hands', 'torso', 'hips', 'legs'];
  const merged: PartEval[] = ORDER.filter((p) => perPart.has(p)).map((p) => {
    const list = perPart.get(p)!;
    const worst = list.reduce((a, b) => (a.score < b.score ? a : b));
    return { ...worst, score: list.reduce((s, e) => s + e.score, 0) / list.length };
  });

  const coverage = refs.length ? pairs.length / refs.length : 1;
  const similarity = clamp(weighted(merged) * coverage);
  const bodyFeedback: Feedback[] = merged.map((e) => {
    const status = statusFor(e.score);
    return { id: e.part, area: e.part, kind: 'body', status, message: status === 'good' ? e.good : e.issue ?? e.good, score: Math.round(e.score * 100) };
  });
  if (coverage < 1) {
    bodyFeedback.unshift({
      id: 'people', area: 'similarity', kind: 'body', status: 'miss',
      message: `We found ${pairs.length} of ${refs.length} people — make sure everyone is in the shot`,
      score: Math.round(coverage * 100),
    });
  }

  const compositionFeedback = evaluateComposition(dets, pose.framing, ctx.brightness);
  const compScore = compositionFeedback.reduce((s, f) => s + (f.score ?? 100), 0) / compositionFeedback.length / 100;
  const score = Math.round(clamp(similarity * 0.8 + compScore * 0.2) * 100);

  const issues = [...bodyFeedback, ...compositionFeedback].filter((f) => f.status !== 'good').sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const recommendations: string[] = [];
  if (issues.length) recommendations.push(`Focus first on: ${issues[0].message.replace(/^Person \d+: /, '').toLowerCase()}.`);
  if (score >= 85) recommendations.push('Great match! Try a variation or challenge yourself with a new pose.');
  recommendations.push(...pose.bodyTips.slice(0, ctx.advanced ? 2 : 1));
  recommendations.push(...pose.cameraTips.slice(0, ctx.advanced ? 2 : 1));

  return {
    score,
    similarity: Math.round(similarity * 100),
    bodyFeedback,
    compositionFeedback,
    recommendations: [...new Set(recommendations)],
    provider: ctx.provider,
    detectedFigures: dets,
  };
}

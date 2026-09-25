import { describe, expect, it } from 'vitest';
import { POSES } from '@/data/poses';
import { buildFigures, mirrorSkeleton, type FigureSpec } from '@/data/skeletonBuilder';
import { FRAME_ASPECT } from '@/data/skeletonBuilder';
import { scorePose } from './poseScoring';

const ctx = { imageAspect: FRAME_ASPECT, brightness: 140, advanced: true, provider: 'test' };
const base: FigureSpec = { lArm: { a: 8, b: 3 }, rArm: { a: 8, b: 3 }, lLeg: { a: 3, b: 2 }, rLeg: { a: 3, b: 2 } };

describe('scorePose', () => {
  it('gives a near-perfect score for an identical pose', () => {
    for (const pose of POSES) {
      const r = scorePose(pose, pose.figures, ctx);
      expect(r.similarity, pose.id).toBeGreaterThanOrEqual(97);
      expect(r.bodyFeedback.every((f) => f.status === 'good'), pose.id).toBe(true);
    }
  });

  it('accepts a mirrored performance of the pose', () => {
    const pose = POSES.find((p) => p.id === 'hands-in-hair')!;
    const r = scorePose(pose, pose.figures.map(mirrorSkeleton), ctx);
    expect(r.similarity).toBeGreaterThanOrEqual(95);
  });

  it('tells the user to raise the arm when it is too low', () => {
    const pose = POSES.find((p) => p.id === 'wave-hello')!; // left arm raised
    const detected = buildFigures([{ ...base, head: 4 }], pose.framing); // arms down
    const r = scorePose(pose, detected, ctx);
    const arms = r.bodyFeedback.find((f) => f.area === 'arms')!;
    expect(arms.status).not.toBe('good');
    expect(arms.message).toMatch(/Raise your left arm/);
    expect(r.score).toBeLessThan(90);
  });

  it('asks to step back when feet are missing on a full-body pose', () => {
    const pose = POSES.find((p) => p.id === 'power-stance')!;
    const det = pose.figures.map((f) => ({ ...f, leftAnkle: { ...f.leftAnkle, visibility: 0.1 }, rightAnkle: { ...f.rightAnkle, visibility: 0.1 } }));
    const r = scorePose(pose, det, ctx);
    expect(r.compositionFeedback.find((f) => f.area === 'framing')?.message).toMatch(/Step back/);
  });

  it('reports missing people in group poses', () => {
    const pose = POSES.find((p) => p.id === 'arm-in-arm-trio')!;
    const r = scorePose(pose, [pose.figures[1]], ctx);
    expect(r.bodyFeedback[0].message).toMatch(/1 of 3 people/);
    expect(r.score).toBeLessThan(60);
  });

  it('flags a dark photo', () => {
    const pose = POSES[0];
    const r = scorePose(pose, pose.figures, { ...ctx, brightness: 30 });
    expect(r.compositionFeedback.find((f) => f.area === 'lighting')?.status).toBe('miss');
  });
});

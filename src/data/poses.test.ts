import { describe, expect, it } from 'vitest';
import { CATEGORIES } from './categories';
import { POSES } from './poses';
import { KEYPOINTS } from '@/models';

describe('sample data', () => {
  it('has unique pose ids and valid categories', () => {
    const ids = new Set(POSES.map((p) => p.id));
    expect(ids.size).toBe(POSES.length);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const p of POSES) for (const c of p.categoryIds) expect(cats.has(c), `${p.id}:${c}`).toBe(true);
  });

  it('every category has at least 3 poses', () => {
    for (const c of CATEGORIES) expect(POSES.filter((p) => p.categoryIds.includes(c.id)).length, c.id).toBeGreaterThanOrEqual(3);
  });

  it('skeletons are complete and the head is inside the frame', () => {
    for (const p of POSES) {
      for (const f of p.figures) {
        for (const k of KEYPOINTS) expect(Number.isFinite(f[k].x) && Number.isFinite(f[k].y), `${p.id}.${k}`).toBe(true);
        expect(f.nose.y, p.id).toBeGreaterThan(0);
        expect(f.nose.x, p.id).toBeGreaterThan(0);
        expect(f.nose.x, p.id).toBeLessThan(1);
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { POSES } from '@/data/poses';
import { EMPTY_FILTERS, filterPoses } from './filters';

describe('filterPoses', () => {
  it('filters by category, difficulty and access', () => {
    const r = filterPoses(POSES, { ...EMPTY_FILTERS, categoryId: 'couple', access: 'free' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.categoryIds.includes('couple') && !p.isPremium)).toBe(true);
  });
  it('searches titles and tags', () => {
    expect(filterPoses(POSES, { ...EMPTY_FILTERS, query: 'selfie' }).length).toBeGreaterThan(2);
    expect(filterPoses(POSES, { ...EMPTY_FILTERS, query: 'zzzz' })).toHaveLength(0);
  });
  it('filters group poses', () => {
    expect(filterPoses(POSES, { ...EMPTY_FILTERS, people: ['group'] }).every((p) => p.figures.length >= 3)).toBe(true);
  });
});

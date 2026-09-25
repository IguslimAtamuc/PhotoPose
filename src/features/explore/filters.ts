import type { Difficulty, Framing, Pose } from '@/models';

export type SortKey = 'popular' | 'recommended' | 'newest' | 'az';

export interface PoseFilters {
  query: string;
  categoryId: string | null;
  difficulty: Difficulty[];
  framing: Framing[];
  people: ('solo' | 'duo' | 'group')[];
  access: 'all' | 'free' | 'premium';
  sort: SortKey;
}

export const EMPTY_FILTERS: PoseFilters = {
  query: '',
  categoryId: null,
  difficulty: [],
  framing: [],
  people: [],
  access: 'all',
  sort: 'popular',
};

const peopleOf = (p: Pose) => (p.figures.length === 1 ? 'solo' : p.figures.length === 2 ? 'duo' : 'group');

/** Pure filtering/sorting — unit-testable and reusable by a backend search later. */
export function filterPoses(poses: Pose[], f: PoseFilters, categoryNames: Record<string, string> = {}): Pose[] {
  const q = f.query.trim().toLowerCase();
  const out = poses.filter((p) => {
    if (f.categoryId && !p.categoryIds.includes(f.categoryId)) return false;
    if (f.difficulty.length && !f.difficulty.includes(p.difficulty)) return false;
    if (f.framing.length && !f.framing.includes(p.framing)) return false;
    if (f.people.length && !f.people.includes(peopleOf(p))) return false;
    if (f.access === 'free' && p.isPremium) return false;
    if (f.access === 'premium' && !p.isPremium) return false;
    if (q) {
      const hay = [p.title, p.summary, ...p.tags, ...p.categoryIds.map((c) => categoryNames[c] ?? c)].join(' ').toLowerCase();
      return q.split(/\s+/).every((w) => hay.includes(w));
    }
    return true;
  });
  switch (f.sort) {
    case 'recommended':
      return out; // caller passes poses already ranked by the recommender
    case 'az':
      return out.sort((a, b) => a.title.localeCompare(b.title));
    case 'newest':
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      return out.sort((a, b) => b.popularity - a.popularity);
  }
}

export const activeFilterCount = (f: PoseFilters) =>
  f.difficulty.length + f.framing.length + f.people.length + (f.access !== 'all' ? 1 : 0);

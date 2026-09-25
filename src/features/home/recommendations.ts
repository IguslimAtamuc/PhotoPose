import type { Favorite, Pose, RecentView } from '@/models';

/**
 * Simple on-device recommender: boosts categories the user saved or viewed,
 * then popularity. Swap for a backend recommender later without UI changes.
 */
export function recommendPoses(poses: Pose[], favorites: Favorite[], recent: RecentView[], byId: Record<string, Pose>): Pose[] {
  const affinity = new Map<string, number>();
  const bump = (poseId: string, w: number) => byId[poseId]?.categoryIds.forEach((c) => affinity.set(c, (affinity.get(c) ?? 0) + w));
  favorites.forEach((f) => bump(f.poseId, 3));
  recent.slice(0, 10).forEach((r) => bump(r.poseId, 1));
  const seen = new Set([...favorites.map((f) => f.poseId), ...recent.slice(0, 3).map((r) => r.poseId)]);
  if (affinity.size === 0) return diversify(poses.filter((p) => !p.isPremium));
  return [...poses]
    .filter((p) => !seen.has(p.id))
    .map((p) => ({ p, s: p.categoryIds.reduce((s, c) => s + (affinity.get(c) ?? 0), 0) * 20 + p.popularity - (p.isPremium ? 8 : 0) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}

/** Deterministic daily pick (free poses for free users). */
export function poseOfTheDay(poses: Pose[], includePremium: boolean): Pose | undefined {
  const pool = poses.filter((p) => (includePremium || !p.isPremium) && p.popularity >= 75);
  if (!pool.length) return poses[0];
  const day = Math.floor(Date.now() / 864e5);
  return pool[day % pool.length];
}

/** Cold start: best pose of each category in turn, so the rail shows variety. */
function diversify(poses: Pose[]): Pose[] {
  const byCat = new Map<string, Pose[]>();
  for (const p of [...poses].sort((a, b) => b.popularity - a.popularity)) {
    const c = p.categoryIds[0];
    byCat.set(c, [...(byCat.get(c) ?? []), p]);
  }
  const out: Pose[] = [];
  const seen = new Set<string>();
  const queues = [...byCat.values()];
  // Start from the second-best of each category so "Popular" and "Recommended" differ.
  for (let round = 1; out.length < poses.length && round < 6; round++) {
    for (const q of queues) {
      const p = q[round] ?? q[round - 1];
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
  }
  return out;
}

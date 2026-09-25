import type { Point } from '@/models';

export const DEG = Math.PI / 180;

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Point, s: number): Point => ({ x: a.x * s, y: a.y * s });
export const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Angle of the vector a→b in degrees, 0 = pointing right, 90 = pointing down (screen coords). */
export const angleOf = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x) / DEG;

/** Smallest signed difference a-b in degrees, in (-180, 180]. */
export const angleDiff = (a: number, b: number) => {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
};

/** Interior angle at joint b formed by a-b-c, degrees 0..180. */
export const jointAngle = (a: Point, b: Point, c: Point) => {
  const d = Math.abs(angleDiff(angleOf(b, a), angleOf(b, c)));
  return d;
};

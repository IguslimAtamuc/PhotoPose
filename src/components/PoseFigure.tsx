import { memo, useId } from 'react';
import type { Point, Skeleton } from '@/models';
import { dist, mid } from '@/utils/geometry';

export type PoseFigureVariant = 'solid' | 'overlay' | 'wire';

interface Props {
  figures: Skeleton[];
  variant?: PoseFigureVariant;
  /** Main colour for solid/overlay variants. */
  color?: string;
  className?: string;
  /** Rendered width/height ratio is always 3:4. */
  title?: string;
  /** 'stretch' maps 0..1 coords onto the full box (for photos of any aspect). */
  fit?: 'meet' | 'stretch';
  /** Bottom colour of the solid gradient. */
  colorEnd?: string;
}

const W = 300;
const H = 400;
const px = (p: Point) => ({ x: p.x * W, y: p.y * H });

/**
 * Renders reference skeletons as a stylised mannequin (solid), a
 * semi-transparent camera guide (overlay) or a joints-and-bones wireframe
 * (wire, used for detected poses). Pure SVG — tiny, crisp at any size.
 */
function PoseFigureImpl({ figures, variant = 'solid', color = '#FFFFFF', className, title, fit = 'meet', colorEnd = '#D9D4E6' }: Props) {
  const gid = useId().replace(/:/g, '');
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      preserveAspectRatio={fit === 'stretch' ? 'none' : 'xMidYMid meet'}
    >
      <defs>
        <linearGradient id={`g${gid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
          <stop offset="0" style={{ stopColor: color }} />
          <stop offset="1" style={{ stopColor: colorEnd ?? color }} />
        </linearGradient>
        <filter id={`s${gid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.28" />
        </filter>
        <filter id={`glow${gid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {figures.map((f, i) =>
        variant === 'wire' ? (
          <Wire key={i} s={f} color={color} />
        ) : (
          <Body key={i} s={f} variant={variant} fill={`url(#g${gid})`} color={color} filter={variant === 'solid' ? `url(#s${gid})` : `url(#glow${gid})`} />
        ),
      )}
    </svg>
  );
}

function Body({ s, variant, fill, color, filter }: { s: Skeleton; variant: PoseFigureVariant; fill: string; color: string; filter: string }) {
  const p = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, px(v)])) as Record<keyof Skeleton, Point>;
  const neck = mid(p.leftShoulder, p.rightShoulder);
  const hip = mid(p.leftHip, p.rightHip);
  const torso = Math.max(dist(neck, hip), 20);
  const arm = torso * 0.17;
  const leg = torso * 0.22;
  const headR = torso * 0.21;
  // Head centre sits slightly above the nose, along the neck→nose direction.
  const nd = dist(neck, p.nose) || 1;
  const head = { x: p.nose.x + ((p.nose.x - neck.x) / nd) * headR * 0.25, y: p.nose.y + ((p.nose.y - neck.y) / nd) * headR * 0.25 };

  const isOverlay = variant === 'overlay';
  const stroke = isOverlay ? color : fill;
  const common = {
    stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  const seg = (a: Point, b: Point, w: number, key: string) => (
    <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={w} {...common} />
  );

  const torsoPath = torsoOutline(p);

  const shape = (
    <>
      {seg(p.leftHip, p.leftKnee, leg, 'lt')}
      {seg(p.leftKnee, p.leftAnkle, leg * 0.82, 'ls')}
      {seg(p.rightHip, p.rightKnee, leg, 'rt')}
      {seg(p.rightKnee, p.rightAnkle, leg * 0.82, 'rs')}
      <path d={torsoPath} fill={isOverlay ? 'none' : fill} stroke={stroke} strokeWidth={arm * 1.4} strokeLinejoin="round" />
      {seg(neck, head, arm * 0.9, 'neck')}
      {seg(p.leftShoulder, p.leftElbow, arm, 'lu')}
      {seg(p.leftElbow, p.leftWrist, arm * 0.85, 'lf')}
      {seg(p.rightShoulder, p.rightElbow, arm, 'ru')}
      {seg(p.rightElbow, p.rightWrist, arm * 0.85, 'rf')}
      <circle cx={p.leftWrist.x} cy={p.leftWrist.y} r={arm * 0.62} fill={isOverlay ? 'none' : fill} stroke={isOverlay ? stroke : 'none'} strokeWidth={isOverlay ? 2 : 0} />
      <circle cx={p.rightWrist.x} cy={p.rightWrist.y} r={arm * 0.62} fill={isOverlay ? 'none' : fill} stroke={isOverlay ? stroke : 'none'} strokeWidth={isOverlay ? 2 : 0} />
      <circle cx={head.x} cy={head.y} r={headR} fill={isOverlay ? 'none' : fill} stroke={isOverlay ? stroke : 'none'} strokeWidth={isOverlay ? 3 : 0} />
    </>
  );

  if (isOverlay) {
    // Outline effect: thick translucent body + thin bright edge on top.
    return (
      <g filter={filter}>
        <g opacity={0.28}>{shapeFilled(p, neck, head, headR, arm, leg, color)}</g>
        <g opacity={0.95}>{shape}</g>
      </g>
    );
  }
  return <g filter={filter}>{shape}</g>;
}

/** Tapered torso: shoulders → waist → hips, so figures read as bodies, not boxes. */
function torsoOutline(p: Record<keyof Skeleton, Point>) {
  const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const lw0 = lerp(p.leftShoulder, p.leftHip, 0.62);
  const rw0 = lerp(p.rightShoulder, p.rightHip, 0.62);
  const c = mid(lw0, rw0);
  const lw = lerp(lw0, c, 0.12);
  const rw = lerp(rw0, c, 0.12);
  return `M${p.leftShoulder.x},${p.leftShoulder.y} L${p.rightShoulder.x},${p.rightShoulder.y} Q${rw.x},${rw.y} ${p.rightHip.x},${p.rightHip.y} L${p.leftHip.x},${p.leftHip.y} Q${lw.x},${lw.y} ${p.leftShoulder.x},${p.leftShoulder.y} Z`;
}

/** Filled silhouette used under the overlay outline. */
function shapeFilled(p: Record<keyof Skeleton, Point>, neck: Point, head: Point, headR: number, arm: number, leg: number, color: string) {
  const l = (a: Point, b: Point, w: number, k: string) => (
    <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={w} stroke={color} strokeLinecap="round" />
  );
  return (
    <>
      {l(p.leftHip, p.leftKnee, leg, 'a')}
      {l(p.leftKnee, p.leftAnkle, leg * 0.82, 'b')}
      {l(p.rightHip, p.rightKnee, leg, 'c')}
      {l(p.rightKnee, p.rightAnkle, leg * 0.82, 'd')}
      <path
        d={torsoOutline(p)}
        fill={color}
        stroke={color}
        strokeWidth={arm * 1.4}
        strokeLinejoin="round"
      />
      {l(neck, head, arm * 0.9, 'e')}
      {l(p.leftShoulder, p.leftElbow, arm, 'f')}
      {l(p.leftElbow, p.leftWrist, arm * 0.85, 'g')}
      {l(p.rightShoulder, p.rightElbow, arm, 'h')}
      {l(p.rightElbow, p.rightWrist, arm * 0.85, 'i')}
      <circle cx={head.x} cy={head.y} r={headR} fill={color} />
    </>
  );
}

const BONES: [keyof Skeleton, keyof Skeleton][] = [
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
];

function Wire({ s, color }: { s: Skeleton; color: string }) {
  const visible = (k: keyof Skeleton) => (s[k].visibility ?? 1) > 0.4;
  return (
    <g>
      {BONES.filter(([a, b]) => visible(a) && visible(b)).map(([a, b]) => {
        const pa = px(s[a]);
        const pb = px(s[b]);
        return <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.9} />;
      })}
      {(Object.keys(s) as (keyof Skeleton)[]).filter(visible).map((k) => {
        const p = px(s[k]);
        return <circle key={k} cx={p.x} cy={p.y} r={5} fill="#fff" stroke={color} strokeWidth={2.5} />;
      })}
    </g>
  );
}

export const PoseFigure = memo(PoseFigureImpl);

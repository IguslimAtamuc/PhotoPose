import { useEffect, useState } from 'react';

/** Animated circular score. */
export function ScoreRing({ score, size = 168, label = 'Pose Match' }: { score: number; size?: number; label?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  const r = 44;
  const c = 2 * Math.PI * r;
  const tone = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="score-ring" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${score} percent`}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f2653f" />
            <stop offset="1" stopColor="#c93a72" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="score-ring__center" aria-hidden>
        <span className="score-ring__label">{label}</span>
        <span className="score-ring__value">
          {shown}
          <small>%</small>
        </span>
        <span className="score-ring__dot" style={{ background: tone }} />
      </div>
    </div>
  );
}

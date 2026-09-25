import { Crown } from 'lucide-react';
import type { Difficulty } from '@/models';

const LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export function DifficultyBadge({ value }: { value: Difficulty }) {
  return (
    <span className={`badge badge--${value}`} aria-label={`Difficulty: ${LABEL[value]}`}>
      <span className="badge__dots" aria-hidden>
        <i />
        <i className={value !== 'easy' ? 'on' : ''} />
        <i className={value === 'hard' ? 'on' : ''} />
      </span>
      {LABEL[value]}
    </span>
  );
}

export function PremiumBadge({ compact }: { compact?: boolean }) {
  return (
    <span className={`badge badge--premium ${compact ? 'badge--icon' : ''}`} aria-label="Premium">
      <Crown size={12} aria-hidden />
      {!compact && 'Premium'}
    </span>
  );
}

import { Check, TriangleAlert, X } from 'lucide-react';
import type { Feedback } from '@/models';

const ICON = { good: Check, adjust: TriangleAlert, miss: X };
const SR = { good: 'Good', adjust: 'Adjust', miss: 'Needs work' };

export function FeedbackList({ items, showScores }: { items: Feedback[]; showScores?: boolean }) {
  return (
    <ul className="feedback-list">
      {items.map((f, i) => {
        const Icon = ICON[f.status];
        return (
          <li key={f.id + i} className={`feedback-item is-${f.status}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="feedback-item__icon" aria-hidden>
              <Icon size={15} strokeWidth={2.6} />
            </span>
            <span className="sr-only">{SR[f.status]}: </span>
            <span className="feedback-item__msg">{f.message}</span>
            {showScores && f.score !== undefined && (
              <span className="feedback-item__score" aria-label={`${f.score} out of 100`}>
                {f.score}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

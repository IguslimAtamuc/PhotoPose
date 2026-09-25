import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Lock } from 'lucide-react';
import type { Pose } from '@/models';
import { useLibraryStore } from '@/stores/libraryStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { DifficultyBadge, PremiumBadge } from './Badges';
import { PoseArt } from './PoseArt';

interface Props {
  pose: Pose;
  variant?: 'rail' | 'grid' | 'hero';
  subtitle?: string;
}

function PoseCardImpl({ pose, variant = 'grid', subtitle }: Props) {
  const fav = useLibraryStore((s) => s.favorites.some((f) => f.poseId === pose.id));
  const locked = useSubscriptionStore((s) => pose.isPremium && !s.entitlements.premiumPoses);
  const toggle = useFavoriteToggle();
  return (
    <article className={`pose-card pose-card--${variant}`}>
      <Link to={`/pose/${pose.id}`} className="pose-card__link" aria-label={`${pose.title}, ${pose.difficulty}${pose.isPremium ? ', premium' : ''}`}>
        <PoseArt pose={pose} className="pose-card__art" />
        <div className="pose-card__meta">
          <h3 className="pose-card__title">{pose.title}</h3>
          <div className="pose-card__sub">{subtitle ?? <DifficultyBadge value={pose.difficulty} />}</div>
        </div>
      </Link>
      <div className="pose-card__top">
        {pose.isPremium && (locked ? <span className="badge badge--lock" aria-label="Premium, locked"><Lock size={12} /></span> : <PremiumBadge compact />)}
      </div>
      <button
        className={`pose-card__fav ${fav ? 'is-on' : ''}`}
        aria-label={fav ? `Remove ${pose.title} from favorites` : `Save ${pose.title} to favorites`}
        aria-pressed={fav}
        onClick={() => toggle(pose)}
      >
        <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}

export const PoseCard = memo(PoseCardImpl);

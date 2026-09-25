import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { StateView } from '@/components/Feedback';
import { PoseArt } from '@/components/PoseArt';
import { TopBar } from '@/components/TopBar';
import { useCatalogStore } from '@/stores/catalogStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { getServices } from '@/services/container';
import { toast } from '@/stores/toastStore';
import './favorites.css';

export function FavoritesScreen() {
  const favorites = useLibraryStore((s) => s.favorites);
  const removeFavorite = useLibraryStore((s) => s.removeFavorite);
  const byId = useCatalogStore((s) => s.byId);
  const premium = useSubscriptionStore((s) => s.entitlements.premiumPoses);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const poses = useMemo(() => favorites.map((f) => byId[f.poseId]).filter(Boolean), [favorites, byId]);

  const start = (id: string, isPremium: boolean) => {
    if (isPremium && !premium) return navigate('/premium?from=favorites');
    getServices().analytics.track('pose_started', { poseId: id, from: 'favorites' });
    navigate(`/camera?pose=${id}`);
  };

  return (
    <main className="screen favorites">
      <TopBar
        title="Favorites"
        large
        right={
          poses.length > 0 && (
            <button className="text-btn" onClick={() => setEditing(!editing)} aria-pressed={editing}>
              {editing ? 'Done' : 'Edit'}
            </button>
          )
        }
      />
      {poses.length === 0 ? (
        <StateView
          icon={<Heart size={28} />}
          title="No favorites yet"
          message="Tap the heart on any pose to save it here for your next shoot."
          action={<Button onClick={() => navigate('/explore')}>Explore poses</Button>}
        />
      ) : (
        <>
          <p className="page-pad t-caption favorites__count">{poses.length} saved {poses.length === 1 ? 'pose' : 'poses'}</p>
          <ul className="fav-grid page-pad">
            {poses.map((p) => (
              <li key={p.id} className={`fav-card ${editing ? 'is-editing' : ''}`}>
                <Link to={`/pose/${p.id}`} className="fav-card__link" aria-label={`Open ${p.title}`}>
                  <PoseArt pose={p} className="fav-card__art" />
                  <span className="fav-card__title">{p.title}</span>
                </Link>
                {editing ? (
                  <button
                    className="fav-card__remove"
                    aria-label={`Remove ${p.title} from favorites`}
                    onClick={() => {
                      removeFavorite(p.id);
                      getServices().analytics.track('pose_unsaved', { poseId: p.id });
                      toast('Removed from Favorites');
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : (
                  <button className="fav-card__start" aria-label={`Start session with ${p.title}`} onClick={() => start(p.id, p.isPremium)}>
                    <Camera size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

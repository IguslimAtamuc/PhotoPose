import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Camera, Crown, Heart, Lock, PersonStanding, ScanLine, SearchX, Video } from 'lucide-react';
import { Button, IconButton } from '@/components/Button';
import { DifficultyBadge, PremiumBadge } from '@/components/Badges';
import { StateView } from '@/components/Feedback';
import { PoseArt } from '@/components/PoseArt';
import { PoseCard } from '@/components/PoseCard';
import { TopBar } from '@/components/TopBar';
import { useCanUsePose } from '@/hooks/useEntitlements';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { getServices } from '@/services/container';
import { useCatalogStore } from '@/stores/catalogStore';
import { useLibraryStore } from '@/stores/libraryStore';
import './pose.css';

const FRAMING = { full: 'Full body', half: 'Half body', closeup: 'Close-up' } as const;
const ANGLE = { 'eye-level': 'Eye level', low: 'Low angle', high: 'High angle', overhead: 'Overhead' } as const;

export function PoseDetailScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { byId, categories, poses, status } = useCatalogStore();
  const pose = byId[id];
  const fav = useLibraryStore((s) => s.favorites.some((f) => f.poseId === id));
  const markViewed = useLibraryStore((s) => s.markViewed);
  const toggleFav = useFavoriteToggle();
  const canUse = useCanUsePose(pose?.isPremium ?? false);

  useEffect(() => {
    if (!pose) return;
    markViewed(pose.id);
    getServices().analytics.track('pose_viewed', { poseId: pose.id, premium: pose.isPremium });
  }, [pose, markViewed]);

  const similar = useMemo(
    () => (pose ? poses.filter((p) => p.id !== pose.id && p.categoryIds.some((c) => pose.categoryIds.includes(c))).slice(0, 8) : []),
    [pose, poses],
  );

  if (!pose) {
    return (
      <main className="screen screen--no-tabs">
        <TopBar back />
        {status === 'ready' && (
          <StateView icon={<SearchX size={28} />} title="Pose not found" message="It may have been removed or renamed." action={<Button size="md" onClick={() => navigate('/explore')}>Browse poses</Button>} />
        )}
      </main>
    );
  }

  const start = () => {
    if (!canUse) {
      navigate('/premium?from=pose');
      return;
    }
    getServices().analytics.track('pose_started', { poseId: pose.id, from: 'detail' });
    navigate(`/camera?pose=${pose.id}`);
  };
  const cats = categories.filter((c) => pose.categoryIds.includes(c.id));
  const people = pose.figures.length;

  return (
    <main className="screen screen--no-tabs screen--flush pose-detail">
      <div className="pose-detail__hero">
        <PoseArt pose={pose} className="pose-detail__art" />
        <TopBar
          back
          overlay
          right={
            <IconButton label={fav ? 'Remove from favorites' : 'Save to favorites'} variant="glass" pressed={fav} onClick={() => toggleFav(pose)}>
              <Heart size={20} fill={fav ? 'currentColor' : 'none'} />
            </IconButton>
          }
        />
      </div>

      <div className="pose-detail__sheet page-pad">
        <div className="pose-detail__badges">
          <DifficultyBadge value={pose.difficulty} />
          {pose.isPremium && <PremiumBadge />}
        </div>
        <h1 className="t-title">{pose.title}</h1>
        <p className="pose-detail__summary">{pose.summary}</p>

        <dl className="facts">
          <div>
            <dt><ScanLine size={16} aria-hidden /> Framing</dt>
            <dd>{FRAMING[pose.framing]}</dd>
          </div>
          <div>
            <dt><Video size={16} aria-hidden /> Camera</dt>
            <dd>{ANGLE[pose.cameraAngle]}</dd>
          </div>
          <div>
            <dt><PersonStanding size={16} aria-hidden /> People</dt>
            <dd>{people === 1 ? 'Solo' : people}</dd>
          </div>
        </dl>

        <section className="detail-block">
          <h2 className="t-headline">Step by step</h2>
          <ol className="steps">
            {pose.instructions.map((s, i) => (
              <li key={i}>
                <span className="steps__n" aria-hidden>{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="detail-block">
          <h2 className="t-headline">Body tips</h2>
          <ul className="tips">
            {pose.bodyTips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </section>

        <section className="detail-block">
          <h2 className="t-headline">Camera angle tips</h2>
          <ul className="tips tips--camera">
            {pose.cameraTips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </section>

        <div className="tag-row" aria-label="Tags">
          {cats.map((c) => (
            <Link key={c.id} to={`/explore?c=${c.id}`} className="tag tag--cat">{c.name}</Link>
          ))}
          {pose.tags.map((t) => (
            <span key={t} className="tag">#{t}</span>
          ))}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="home-section" aria-label="More like this">
          <div className="section-head page-pad">
            <h2 className="t-headline">More like this</h2>
          </div>
          <div className="rail">
            {similar.map((p) => <PoseCard key={p.id} pose={p} variant="rail" />)}
          </div>
        </section>
      )}

      <div className="sticky-cta">
        <IconButton label={fav ? 'Remove from favorites' : 'Save to favorites'} size={54} pressed={fav} onClick={() => toggleFav(pose)}>
          <Heart size={22} fill={fav ? 'currentColor' : 'none'} />
        </IconButton>
        {canUse ? (
          <Button block icon={<Camera size={20} />} onClick={start}>
            Try This Pose
          </Button>
        ) : (
          <Button block variant="premium" icon={<Lock size={18} />} trailingIcon={<Crown size={16} />} onClick={start}>
            Unlock with Premium
          </Button>
        )}
      </div>
    </main>
  );
}

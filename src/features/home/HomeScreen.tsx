import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, ChevronRight, Crown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Skeleton, StateView } from '@/components/Feedback';
import { PoseArt } from '@/components/PoseArt';
import { PoseCard } from '@/components/PoseCard';
import type { Pose } from '@/models';
import { useCatalogStore } from '@/stores/catalogStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUserStore } from '@/stores/userStore';
import { recommendPoses, poseOfTheDay } from './recommendations';
import './home.css';

export function HomeScreen() {
  const { status, poses, categories, byId, load } = useCatalogStore();
  const favorites = useLibraryStore((s) => s.favorites);
  const recent = useLibraryStore((s) => s.recent);
  const sessions = useHistoryStore((s) => s.sessions);
  const premium = useSubscriptionStore((s) => s.entitlements.tier === 'premium');
  const name = useUserStore((s) => s.user?.displayName);
  const navigate = useNavigate();

  const featured = useMemo(() => poseOfTheDay(poses, premium), [poses, premium]);
  const recommended = useMemo(() => recommendPoses(poses, favorites, recent, byId).slice(0, 10), [poses, favorites, recent, byId]);
  const popular = useMemo(() => [...poses].sort((a, b) => b.popularity - a.popularity).slice(0, 10), [poses]);
  const recentPoses = useMemo(() => recent.map((r) => byId[r.poseId]).filter(Boolean).slice(0, 10), [recent, byId]);
  const savedPoses = useMemo(() => favorites.map((f) => byId[f.poseId]).filter(Boolean).slice(0, 10), [favorites, byId]);

  if (status === 'error') {
    return (
      <main className="screen">
        <StateView
          tone="error"
          title="Couldn’t load poses"
          message="Please check your connection and try again."
          action={<Button icon={<RefreshCw size={18} />} onClick={() => { useCatalogStore.setState({ status: 'idle' }); void load(); }}>Retry</Button>}
        />
      </main>
    );
  }

  return (
    <main className="screen home">
      <header className="home__header page-pad">
        <span className="home__logo" aria-label="PhotoPose">
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" width={28} height={28} />
          PhotoPose
        </span>
        {!premium ? (
          <Link to="/premium" className="home__premium">
            <Crown size={14} aria-hidden /> Go Premium
          </Link>
        ) : (
          <span className="home__premium is-member"><Crown size={14} aria-hidden /> Premium</span>
        )}
      </header>

      <section className="home__hello page-pad">
        <p className="t-caption">{greeting()}{name ? `, ${name}` : ''}</p>
        <h1 className="t-display">
          What are you <span className="t-accent">shooting</span> today?
        </h1>
      </section>

      <section className="page-pad" aria-label="Start a session">
        {featured ? (
          <div className="hero-card">
            <PoseArt pose={featured} className="hero-card__art" />
            <div className="hero-card__shade" aria-hidden />
            <div className="hero-card__body">
              <span className="t-overline hero-card__eyebrow">Pose of the day</span>
              <h2 className="hero-card__title">{featured.title}</h2>
              <p className="hero-card__text">{featured.summary}</p>
              <div className="hero-card__actions">
                <Button size="md" icon={<Camera size={18} />} onClick={() => navigate(`/camera?pose=${featured.id}`)}>
                  Start session
                </Button>
                <Link className="hero-card__link" to={`/pose/${featured.id}`}>
                  Details <ChevronRight size={16} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <Skeleton className="hero-card" />
        )}
      </section>

      <Section title="Categories" to="/explore">
        <div className="cat-grid">
          {status !== 'ready'
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="cat-tile" />)
            : categories.map((c) => (
                <Link key={c.id} to={`/explore?c=${c.id}`} className="cat-tile" style={{ ['--ga' as string]: c.gradient[0], ['--gb' as string]: c.gradient[1] }}>
                  <span className="cat-tile__icon"><CategoryIcon name={c.icon} size={18} /></span>
                  <span className="cat-tile__name">{c.name}</span>
                </Link>
              ))}
        </div>
      </Section>

      <Rail title="Recommended for you" poses={recommended} loading={status !== 'ready'} to="/explore?sort=recommended" />
      <Rail title="Popular right now" poses={popular} loading={status !== 'ready'} to="/explore?sort=popular" />
      {recentPoses.length > 0 && <Rail title="Recently viewed" poses={recentPoses} />}
      {savedPoses.length > 0 && <Rail title="Saved recently" poses={savedPoses} to="/favorites" />}

      {sessions.length > 0 && (
        <Section title="Your recent shots" to="/history">
          <div className="rail">
            {sessions.slice(0, 8).map((s) => (
              <Link key={s.id} to={s.result ? `/session/${s.id}` : `/session/${s.id}/analyze`} className="shot-thumb" aria-label={`${byId[s.poseId]?.title ?? 'Photo'}${s.result ? `, score ${s.result.score}%` : ''}`}>
                {s.thumbnail && <img src={s.thumbnail} alt="" />}
                {s.result && <span className="shot-thumb__score">{s.result.score}%</span>}
              </Link>
            ))}
          </div>
        </Section>
      )}

      <section className="page-pad home__cta">
        <div className="cta-card">
          <div>
            <h2 className="t-headline">Ready when you are</h2>
            <p className="t-caption">Open the camera and follow any pose with the live guide.</p>
          </div>
          <Button size="md" variant="secondary" trailingIcon={<ArrowRight size={16} />} onClick={() => navigate('/camera')}>
            Open camera
          </Button>
        </div>
      </section>
    </main>
  );
}

function Section({ title, to, children }: { title: string; to?: string; children: React.ReactNode }) {
  return (
    <section className="home-section" aria-label={title}>
      <div className="section-head page-pad">
        <h2 className="t-headline">{title}</h2>
        {to && (
          <Link to={to} className="section-head__link">
            See all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Rail({ title, poses, loading, to }: { title: string; poses: Pose[]; loading?: boolean; to?: string }) {
  return (
    <Section title={title} to={to}>
      <div className="rail">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="pose-card pose-card--rail" />)
          : poses.map((p) => <PoseCard key={p.id} pose={p} variant="rail" />)}
      </div>
    </Section>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}


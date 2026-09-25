import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Camera, Crown, Download, Eye, EyeOff, Info, Lightbulb, RefreshCw, SearchX, Share2, Shuffle, Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/Button';
import { StateView } from '@/components/Feedback';
import { FeedbackList } from '@/components/FeedbackList';
import { PhotoImage } from '@/components/PhotoImage';
import { PoseFigure } from '@/components/PoseFigure';
import { ScoreRing } from '@/components/ScoreRing';
import { Sheet } from '@/components/Sheet';
import { TopBar } from '@/components/TopBar';
import { appConfig } from '@/config/app.config';
import { getServices } from '@/services/container';
import { ShareError } from '@/services/share/ShareService';
import { useCatalogStore } from '@/stores/catalogStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { toast } from '@/stores/toastStore';
import { formatDate, scoreLabel } from '@/utils/format';
import './analysis.css';

export default function ResultScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const session = useHistoryStore((s) => s.sessions.find((x) => x.id === id));
  const hydrated = useHistoryStore((s) => s.hydrated);
  const remove = useHistoryStore((s) => s.remove);
  const pose = useCatalogStore((s) => (session ? s.byId[session.poseId] : undefined));
  const advanced = useSubscriptionStore((s) => s.entitlements.advancedFeedback);
  const [overlay, setOverlay] = useState<'none' | 'detected' | 'guide'>('none');
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!session || !session.result) {
    if (hydrated && session && !session.result) return <Navigate to={`/session/${id}/analyze`} replace />;
    return (
      <main className="screen screen--no-tabs">
        <TopBar back="/history" />
        {hydrated && (
          <StateView icon={<SearchX size={28} />} title="Result not found" message="This analysis may have been deleted." action={<Button onClick={() => navigate('/history')}>Go to History</Button>} />
        )}
      </main>
    );
  }

  const r = session.result;
  const filename = `PhotoPose-${(pose?.title ?? 'photo').replace(/\s+/g, '-')}-${session.createdAt.slice(0, 10)}.jpg`;

  const withPhoto = async (kind: 'save' | 'share') => {
    setBusy(kind);
    try {
      const blob = await getServices().photos.get(session.photoId);
      if (!blob) throw new ShareError('failed', 'Photo not found on this device.');
      const share = getServices().share;
      const outcome =
        kind === 'save'
          ? await share.savePhoto(blob, filename)
          : await share.sharePhoto(blob, { title: 'PhotoPose', text: `I scored ${r.score}% on “${pose?.title}” with PhotoPose!`, filename });
      if (outcome === 'cancelled') return;
      getServices().analytics.track(kind === 'save' ? 'photo_saved' : 'photo_shared', { poseId: session.poseId, outcome });
      if (outcome === 'downloaded') toast('Photo downloaded', 'success');
      else if (kind === 'save') toast('Tap “Save Image” to add it to Photos', 'info');
    } catch (e) {
      const msg =
        e instanceof ShareError && e.code === 'permission_denied'
          ? 'Photo access was denied. Allow access in Settings and try again.'
          : e instanceof Error
            ? e.message
            : 'Something went wrong.';
      toast(msg, 'error');
    } finally {
      setBusy(null);
    }
  };

  const body = r.bodyFeedback;
  const composition = r.compositionFeedback;

  return (
    <main className="screen screen--no-tabs result">
      <TopBar
        back="/"
        title="Your result"
        right={
          <IconButton label="Delete photo" variant="plain" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={20} />
          </IconButton>
        }
      />

      <div className="page-pad">
        <div className="result__photo">
          <PhotoImage photoId={session.photoId} thumbnail={session.thumbnail} alt={`Your photo for ${pose?.title ?? 'the pose'}`}>
            {overlay === 'detected' && r.detectedFigures && (
              <div className={`result__overlay ${session.mirrored ? 'is-mirrored' : ''}`} aria-hidden>
                <PoseFigure figures={r.detectedFigures} variant="wire" color="#3DDC97" fit="stretch" />
              </div>
            )}
            {overlay === 'guide' && pose && (
              <div className="result__overlay" aria-hidden>
                <PoseFigure figures={pose.figures} variant="overlay" color="#FFFFFF" />
              </div>
            )}
          </PhotoImage>
          <div className="result__photo-tools">
            <button
              className="pill-btn"
              aria-pressed={overlay !== 'none'}
              onClick={() => setOverlay((o) => (o === 'none' ? (r.detectedFigures ? 'detected' : 'guide') : o === 'detected' ? 'guide' : 'none'))}
            >
              {overlay === 'none' ? <Eye size={15} /> : <EyeOff size={15} />}
              {overlay === 'none' ? 'Show overlay' : overlay === 'detected' ? 'Detected body' : 'Pose guide'}
            </button>
          </div>
        </div>

        <section className="result__score" aria-label="Score">
          <ScoreRing score={r.score} />
          <div className="result__score-text">
            <h1 className="t-title">{scoreLabel(r.score)}</h1>
            <p className="t-caption">
              {pose?.title} · {formatDate(session.createdAt)}
            </p>
            {r.provider === 'mock' && (
              <p className="result__demo">
                <Info size={14} aria-hidden /> Basic estimate — the on-device AI wasn’t used for this photo.
              </p>
            )}
          </div>
        </section>

        <section className="result__block">
          <h2 className="t-headline">Body</h2>
          <FeedbackList items={body} showScores={advanced} />
        </section>
        <section className="result__block">
          <h2 className="t-headline">Framing & composition</h2>
          <FeedbackList items={composition} showScores={advanced} />
        </section>

        {advanced ? (
          <section className="result__block">
            <h2 className="t-headline">Detailed breakdown</h2>
            <div className="breakdown">
              <Bar label="Pose similarity" value={r.similarity} />
              {[...body, ...composition]
                .filter((f) => f.score !== undefined)
                .map((f) => (
                  <Bar key={f.id} label={f.area[0].toUpperCase() + f.area.slice(1)} value={f.score!} />
                ))}
            </div>
          </section>
        ) : (
          <Link to="/premium?from=result" className="upsell">
            <Crown size={20} aria-hidden />
            <div>
              <strong>Unlock the detailed breakdown</strong>
              <span>Per-body-part scores, pose similarity and extra coaching tips.</span>
            </div>
          </Link>
        )}

        {r.recommendations.length > 0 && (
          <section className="result__block">
            <h2 className="t-headline">Suggestions</h2>
            <ul className="suggestions">
              {r.recommendations.map((t, i) => (
                <li key={i}>
                  <Lightbulb size={16} aria-hidden />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="result__actions">
          <Button block icon={<RefreshCw size={18} />} onClick={() => navigate(`/camera?pose=${session.poseId}`)}>
            Try Again
          </Button>
          <div className="result__actions-row">
            <Button variant="secondary" size="md" icon={<Download size={18} />} loading={busy === 'save'} onClick={() => withPhoto('save')}>
              Save Photo
            </Button>
            <Button variant="secondary" size="md" icon={<Share2 size={18} />} loading={busy === 'share'} onClick={() => withPhoto('share')}>
              Share
            </Button>
          </div>
          <Button variant="ghost" block icon={<Shuffle size={18} />} onClick={() => navigate('/explore')}>
            Try Another Pose
          </Button>
          <Button variant="ghost" block icon={<Camera size={18} />} onClick={() => navigate('/camera')}>
            Open camera
          </Button>
        </div>
        <p className="result__footnote">Analysed by {r.provider === 'mediapipe' ? 'on-device AI' : r.provider}. Photos stay on your device unless you share them. {appConfig.brand.name} feedback is guidance, not a judgement.</p>
      </div>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this photo?"
        footer={
          <div className="sheet-actions">
            <Button variant="ghost" size="md" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={async () => {
                await remove(session.id);
                toast('Photo deleted', 'info');
                navigate('/history', { replace: true });
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="t-body">The photo and its analysis will be removed from this device.</p>
      </Sheet>
    </main>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="bar">
      <div className="bar__head">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="bar__track" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="bar__fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

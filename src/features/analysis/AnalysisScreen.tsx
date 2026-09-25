import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Crown, ImageOff, RefreshCw, ScanFace, SearchX, Sparkles, WifiOff } from 'lucide-react';
import { Button } from '@/components/Button';
import { StateView } from '@/components/Feedback';
import { PhotoImage } from '@/components/PhotoImage';
import { TopBar } from '@/components/TopBar';
import { appConfig } from '@/config/app.config';
import { AnalysisError, type AnalysisErrorCode } from '@/services/ai/PoseAnalysisService';
import { useCatalogStore } from '@/stores/catalogStore';
import { useHistoryStore } from '@/stores/historyStore';
import { analyzeSession, QuotaExceededError } from '../session/sessionController';
import './analysis.css';

const STEPS = ['Finding your body…', 'Mapping 17 body points…', 'Comparing with the reference…', 'Checking framing & light…'];

type Failure = AnalysisErrorCode | 'quota';

export default function AnalysisScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const session = useHistoryStore((s) => s.sessions.find((x) => x.id === id));
  const hydrated = useHistoryStore((s) => s.hydrated);
  const pose = useCatalogStore((s) => (session ? s.byId[session.poseId] : undefined));
  const [failure, setFailure] = useState<Failure | null>(null);
  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState<{ n: number; fallback: boolean }>({ n: 0, fallback: false });
  const ran = useRef(-1);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1100);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!session || !pose) return;
    if (session.result && attempt.n === 0) {
      navigate(`/session/${id}`, { replace: true });
      return;
    }
    if (ran.current === attempt.n) return;
    ran.current = attempt.n;
    const controller = new AbortController();
    setFailure(null);
    analyzeSession(id, pose, { useFallback: attempt.fallback, signal: controller.signal })
      .then(() => navigate(`/session/${id}`, { replace: true }))
      .catch((e) => {
        if (e instanceof QuotaExceededError) return setFailure('quota');
        const code = e instanceof AnalysisError ? e.code : 'unknown';
        if (code === 'aborted') return;
        setFailure(code);
      });
    return () => {
      controller.abort();
      ran.current = -1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, pose?.id, attempt]);

  const retry = (fallback = false) => setAttempt((a) => ({ n: a.n + 1, fallback }));
  const retake = () => navigate(`/camera?pose=${session?.poseId ?? ''}`, { replace: true });

  if (hydrated && !session) {
    return (
      <main className="screen screen--no-tabs">
        <TopBar back="/" />
        <StateView icon={<SearchX size={28} />} title="Photo not found" message="This session may have been deleted." action={<Button onClick={() => navigate('/camera')}>Open camera</Button>} />
      </main>
    );
  }

  return (
    <main className="screen screen--no-tabs analysis">
      <TopBar back="/" title={failure ? 'Analysis' : undefined} />
      {session && (
        <div className={`analysis__photo ${failure ? 'is-failed' : 'is-scanning'}`}>
          <PhotoImage photoId={session.photoId} thumbnail={session.thumbnail} alt="Your photo" />
          {!failure && <div className="analysis__scan" aria-hidden />}
        </div>
      )}
      {!failure ? (
        <div className="analysis__status" role="status" aria-live="polite">
          <ScanFace size={22} aria-hidden />
          <div>
            <h1 className="t-headline">Analysing your pose</h1>
            <p className="t-caption" key={step}>{STEPS[step]}</p>
          </div>
        </div>
      ) : (
        <FailureView failure={failure} onRetry={() => retry(false)} onFallback={() => retry(true)} onRetake={retake} onPremium={() => navigate('/premium?from=quota')} onHome={() => navigate('/')} />
      )}
    </main>
  );
}

function FailureView(p: { failure: Failure; onRetry(): void; onFallback(): void; onRetake(): void; onPremium(): void; onHome(): void }) {
  const retake = <Button variant="secondary" icon={<Camera size={18} />} onClick={p.onRetake}>Retake photo</Button>;
  const basic = (
    <Button variant="ghost" size="md" icon={<Sparkles size={18} />} onClick={p.onFallback}>
      Use basic analysis
    </Button>
  );
  switch (p.failure) {
    case 'quota':
      return (
        <StateView
          icon={<Crown size={28} />}
          title="Daily free analyses used"
          message={`Free accounts get ${appConfig.subscription.freeDailyAnalyses} AI analyses per day. Your photo is saved in History — analyse it tomorrow or go unlimited with Premium.`}
          action={<Button variant="premium" icon={<Crown size={18} />} onClick={p.onPremium}>Go Premium</Button>}
          secondary={<Button variant="ghost" size="md" onClick={p.onHome}>Maybe later</Button>}
        />
      );
    case 'no_person':
      return (
        <StateView
          tone="error"
          icon={<SearchX size={28} />}
          title="We couldn’t find a person"
          message="Make sure your whole body (or face, for close-ups) is visible, well lit and not too far from the camera."
          action={retake}
          secondary={<Button variant="ghost" size="md" icon={<RefreshCw size={18} />} onClick={p.onRetry}>Try again</Button>}
        />
      );
    case 'network':
      return (
        <StateView
          tone="error"
          icon={<WifiOff size={28} />}
          title="Network unavailable"
          message="The AI model downloads once, then works offline. Connect to the internet and try again."
          action={<Button icon={<RefreshCw size={18} />} onClick={p.onRetry}>Retry</Button>}
          secondary={basic}
        />
      );
    case 'model_unavailable':
      return (
        <StateView
          tone="error"
          icon={<Sparkles size={28} />}
          title="AI analysis failed"
          message="The pose engine couldn’t start on this device. You can retry or use a basic estimated analysis."
          action={<Button icon={<RefreshCw size={18} />} onClick={p.onRetry}>Retry</Button>}
          secondary={basic}
        />
      );
    case 'image_invalid':
      return (
        <StateView
          tone="error"
          icon={<ImageOff size={28} />}
          title="Image processing failed"
          message="We couldn’t read this photo. Please take it again."
          action={retake}
        />
      );
    default:
      return (
        <StateView
          tone="error"
          title="AI analysis failed"
          message="Something went wrong while analysing your photo. Your photo is safe in History."
          action={<Button icon={<RefreshCw size={18} />} onClick={p.onRetry}>Try again</Button>}
          secondary={basic}
        />
      );
  }
}

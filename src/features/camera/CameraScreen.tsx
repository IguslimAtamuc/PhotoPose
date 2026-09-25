import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Camera,
  CameraOff,
  Check,
  Grid3x3,
  ImageUp,
  Layers,
  Lock,
  RotateCcw,
  SwitchCamera,
  Timer,
  TimerOff,
  X,
  Zap,
  ZapOff,
} from 'lucide-react';
import { Button, IconButton } from '@/components/Button';
import { Spinner, StateView } from '@/components/Feedback';
import { PoseFigure } from '@/components/PoseFigure';
import { PoseArt } from '@/components/PoseArt';
import type { Pose, Skeleton } from '@/models';
import { appConfig } from '@/config/app.config';
import { FRAME_ASPECT } from '@/data/skeletonBuilder';
import { getServices } from '@/services/container';
import { scorePose } from '@/services/ai/poseScoring';
import { useCatalogStore } from '@/stores/catalogStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { toast } from '@/stores/toastStore';
import { haptic } from '@/utils/haptics';
import { createSession, importPhoto, type NewPhoto } from '../session/sessionController';
import { poseOfTheDay } from '../home/recommendations';
import { useCameraController } from './useCameraController';
import './camera.css';

type Captured = NewPhoto & { url: string; source: 'camera' | 'library' };
const TIMERS = [0, 3, 10] as const;
const OPACITY_STEPS = [0.7, 0.4, 0] as const;

export default function CameraScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { poses, byId, status } = useCatalogStore();
  const favorites = useLibraryStore((s) => s.favorites);
  const { settings, updateCamera } = useSettingsStore();
  const cam = settings.camera;
  const premium = useSubscriptionStore((s) => s.entitlements.premiumPoses);
  const ctrl = useCameraController();

  // ---- Selected pose -------------------------------------------------------
  const requested = params.get('pose');
  const pose: Pose | undefined = (requested && byId[requested]) || poseOfTheDay(poses, premium);
  const locked = !!pose?.isPremium && !premium;
  const strip = useMemo(() => {
    const favs = favorites.map((f) => byId[f.poseId]).filter(Boolean);
    const rest = [...poses].sort((a, b) => b.popularity - a.popularity);
    const list = [pose, ...favs, ...rest].filter((p): p is Pose => !!p);
    return [...new Map(list.map((p) => [p.id, p])).values()].slice(0, 24);
  }, [pose, favorites, poses, byId]);
  const selectPose = (p: Pose) => {
    setParams({ pose: p.id }, { replace: true });
    haptic();
  };

  // ---- Camera toolbar state -----------------------------------------------
  const [grid, setGrid] = useState(cam.showGrid);
  const [timer, setTimer] = useState<0 | 3 | 10>(cam.defaultTimer);
  const [opacity, setOpacity] = useState<number>(cam.overlayOpacity);
  const [flash, setFlash] = useState(false);
  const [live, setLive] = useState(cam.liveTracking && appConfig.features.liveTracking);
  const [countdown, setCountdown] = useState(0);
  const [screenFlash, setScreenFlash] = useState(false);
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cancelTimer = useRef<() => void>(() => {});

  useEffect(() => {
    getServices().analytics.track('camera_opened', { poseId: pose?.id ?? 'none' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cancelTimer.current(), []);
  useEffect(() => () => { if (captured) URL.revokeObjectURL(captured.url); }, [captured]);

  // ---- Live body tracking --------------------------------------------------
  const [liveFigures, setLiveFigures] = useState<Skeleton[]>([]);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  useEffect(() => {
    const video = ctrl.videoRef.current;
    if (!live || ctrl.phase !== 'live' || !video || !pose || captured) {
      setLiveFigures([]);
      setLiveScore(null);
      return;
    }
    const tracking = getServices().tracking;
    let lastUi = 0;
    setLiveLoading(true);
    tracking
      .start(
        video,
        (figs) => {
          const now = performance.now();
          if (now - lastUi < 150) return;
          lastUi = now;
          const mapped = figs.map((f) => toViewport(f, video.videoWidth, video.videoHeight));
          setLiveFigures(mapped);
          setLiveScore(mapped.length ? scorePose(pose, mapped, { imageAspect: FRAME_ASPECT, advanced: false, provider: 'live' }).similarity : null);
        },
        pose.figures.length,
      )
      .then(() => setLiveLoading(false))
      .catch(() => {
        setLiveLoading(false);
        setLive(false);
        toast('Live tracking isn’t available right now', 'error');
      });
    return () => tracking.stop();
  }, [live, ctrl.phase, pose, captured, ctrl.videoRef]);

  // ---- Capture ---------------------------------------------------------------
  const doCapture = useCallback(async () => {
    const video = ctrl.videoRef.current;
    if (!video) return;
    const useScreenFlash = flash && !ctrl.hasTorch && ctrl.facing === 'user';
    try {
      if (useScreenFlash) {
        setScreenFlash(true);
        await new Promise((r) => setTimeout(r, 260));
      }
      const mirror = ctrl.facing === 'user' && cam.mirrorFrontCamera;
      const photo = await getServices().camera.capture(video, { aspect: FRAME_ASPECT, mirror, maxSize: 1600 });
      haptic([10, 30, 10]);
      setCaptured({ ...photo, url: URL.createObjectURL(photo.blob), source: 'camera' });
    } catch (e) {
      console.error(e);
      toast('We couldn’t process that photo. Please try again.', 'error');
    } finally {
      setScreenFlash(false);
    }
  }, [ctrl, flash, cam.mirrorFrontCamera]);

  const onShutter = () => {
    if (locked) {
      navigate('/premium?from=camera');
      return;
    }
    if (countdown) {
      cancelTimer.current();
      return;
    }
    if (!timer) return void doCapture();
    let n = timer;
    setCountdown(n);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCountdown(0);
        void doCapture();
      } else {
        setCountdown(n);
        haptic(5);
      }
    }, 1000);
    cancelTimer.current = () => {
      clearInterval(id);
      setCountdown(0);
    };
  };

  const onFlash = async () => {
    const next = !flash;
    if (ctrl.hasTorch) {
      const ok = await ctrl.setTorch(next);
      if (!ok) return toast('Flash couldn’t be turned on', 'error');
    } else if (next && ctrl.facing === 'environment') {
      return toast('Flash isn’t supported by this browser on the rear camera', 'info');
    } else if (next) {
      toast('Screen flash on — your screen will light up for the photo');
    }
    setFlash(next);
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const photo = await importPhoto(file);
      setCaptured({ ...photo, url: URL.createObjectURL(photo.blob), source: 'library' });
    } catch {
      toast('That image couldn’t be opened. Try a JPEG or PNG photo.', 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirm = async () => {
    if (!captured || !pose) return;
    setBusy(true);
    try {
      const session = await createSession(pose, captured, captured.source, captured.source === 'camera' ? ctrl.facing : undefined);
      navigate(`/session/${session.id}/analyze`, { replace: true });
    } catch {
      toast('Couldn’t save the photo on this device. Free up some space and try again.', 'error');
      setBusy(false);
    }
  };

  const close = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));
  const mirroredPreview = ctrl.facing === 'user';

  // ---- Render ------------------------------------------------------------------
  return (
    <main className="camera" aria-label="Camera">
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPickFile(e.target.files?.[0])} />

      <header className="camera__top">
        <IconButton label="Close camera" variant="glass" onClick={close}>
          <X size={22} />
        </IconButton>
        {!captured && (
          <div className="camera__tools" role="toolbar" aria-label="Camera options">
            <IconButton label={flash ? 'Flash on' : 'Flash off'} variant="glass" pressed={flash} onClick={onFlash}>
              {flash ? <Zap size={20} /> : <ZapOff size={20} />}
            </IconButton>
            <IconButton label={grid ? 'Hide grid' : 'Show grid'} variant="glass" pressed={grid} onClick={() => { setGrid(!grid); updateCamera({ showGrid: !grid }); }}>
              <Grid3x3 size={20} />
            </IconButton>
            <IconButton
              label={timer ? `Timer ${timer} seconds` : 'Timer off'}
              variant="glass"
              pressed={!!timer}
              onClick={() => {
                const next = TIMERS[(TIMERS.indexOf(timer) + 1) % TIMERS.length];
                setTimer(next);
                updateCamera({ defaultTimer: next });
              }}
            >
              {timer ? <span className="camera__timer-label"><Timer size={18} />{timer}s</span> : <TimerOff size={20} />}
            </IconButton>
            <IconButton
              label={`Pose guide opacity ${Math.round(opacity * 100)} percent`}
              variant="glass"
              pressed={opacity > 0}
              onClick={() => {
                const i = OPACITY_STEPS.findIndex((o) => Math.abs(o - opacity) < 0.05);
                const next = OPACITY_STEPS[(i + 1) % OPACITY_STEPS.length];
                setOpacity(next);
                if (next > 0) updateCamera({ overlayOpacity: next });
              }}
            >
              <Layers size={20} />
            </IconButton>
            {appConfig.features.liveTracking && (
              <IconButton label={live ? 'Live body tracking on' : 'Live body tracking off'} variant="glass" pressed={live} onClick={() => setLive(!live)}>
                {liveLoading ? <Spinner size={18} /> : <Activity size={20} />}
              </IconButton>
            )}
          </div>
        )}
      </header>

      <div className="camera__viewport">
        <video ref={ctrl.videoRef} className={`camera__video ${mirroredPreview ? 'is-mirrored' : ''} ${ctrl.phase === 'live' ? 'is-live' : ''}`} playsInline muted autoPlay aria-hidden />

        {!captured && ctrl.phase === 'live' && (
          <>
            {grid && <div className="camera__grid" aria-hidden />}
            {pose && opacity > 0 && (
              <div className="camera__guide" style={{ opacity }} aria-hidden>
                <PoseFigure figures={pose.figures} variant="overlay" color="#FFFFFF" />
              </div>
            )}
            {live && liveFigures.length > 0 && (
              <div className={`camera__live ${mirroredPreview ? 'is-mirrored' : ''}`} aria-hidden>
                <PoseFigure figures={liveFigures} variant="wire" color="#3DDC97" />
              </div>
            )}
            {live && liveScore !== null && (
              <div className="camera__match" role="status" aria-live="polite">
                Match <strong>{liveScore}%</strong>
              </div>
            )}
            {locked && (
              <div className="camera__locked">
                <Lock size={18} /> Premium pose
              </div>
            )}
          </>
        )}

        {countdown > 0 && (
          <div className="camera__countdown" role="timer" aria-live="assertive" key={countdown}>
            {countdown}
          </div>
        )}

        {captured && (
          <div className="camera__preview">
            <img src={captured.url} alt="Captured photo preview" />
            {pose && (
              <div className="camera__preview-guide" aria-hidden>
                <PoseFigure figures={pose.figures} variant="overlay" color="#FFFFFF" />
              </div>
            )}
          </div>
        )}

        {!captured && ctrl.phase === 'starting' && (
          <div className="camera__state">
            <Spinner size={30} label="Starting camera" />
          </div>
        )}
        {!captured && ctrl.phase === 'priming' && (
          <div className="camera__state">
            <StateView
              icon={<Camera size={28} />}
              title="Allow camera access"
              message="PhotoPose uses your camera to show the pose guide live and take your photo. Photos stay on your device."
              action={<Button onClick={() => ctrl.start()}>Enable camera</Button>}
              secondary={
                <Button variant="ghost" size="md" icon={<ImageUp size={18} />} onClick={() => fileRef.current?.click()}>
                  Upload a photo instead
                </Button>
              }
            />
          </div>
        )}
        {!captured && ctrl.phase === 'error' && (
          <div className="camera__state">
            <CameraErrorView code={ctrl.error} onRetry={() => ctrl.start()} onUpload={() => fileRef.current?.click()} />
          </div>
        )}
        {screenFlash && <div className="camera__screen-flash" aria-hidden />}
      </div>

      {captured ? (
        <footer className="camera__bottom camera__bottom--review">
          <p className="camera__review-hint">Happy with it? We’ll compare it with “{pose?.title}”.</p>
          <div className="camera__review-actions">
            <Button variant="secondary" icon={<RotateCcw size={18} />} onClick={() => setCaptured(null)} disabled={busy}>
              Retake
            </Button>
            <Button icon={<Check size={20} />} onClick={confirm} loading={busy}>
              Use Photo
            </Button>
          </div>
        </footer>
      ) : (
        <footer className="camera__bottom">
          <div className="pose-strip" role="listbox" aria-label="Choose a pose to follow">
            {status === 'ready' &&
              strip.map((p) => (
                <button
                  key={p.id}
                  role="option"
                  aria-selected={p.id === pose?.id}
                  aria-label={`${p.title}${p.isPremium && !premium ? ', premium' : ''}`}
                  className={`pose-strip__item ${p.id === pose?.id ? 'is-on' : ''}`}
                  onClick={() => selectPose(p)}
                >
                  <PoseArt pose={p} rich={false} />
                  {p.isPremium && !premium && <span className="pose-strip__lock"><Lock size={10} /></span>}
                </button>
              ))}
          </div>
          <p className="camera__pose-name" aria-live="polite">{pose?.title ?? 'Choose a pose'}</p>
          <div className="camera__controls">
            <IconButton label="Choose photo from library" variant="glass" size={52} onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Spinner size={20} /> : <ImageUp size={22} />}
            </IconButton>
            <button
              className={`shutter ${countdown ? 'is-counting' : ''}`}
              aria-label={locked ? 'Unlock premium pose' : countdown ? 'Cancel timer' : timer ? `Take photo in ${timer} seconds` : 'Take photo'}
              onClick={onShutter}
              disabled={ctrl.phase !== 'live' && !locked}
            >
              <span className="shutter__inner" />
            </button>
            <IconButton label={`Switch to ${ctrl.facing === 'user' ? 'back' : 'front'} camera`} variant="glass" size={52} onClick={() => ctrl.flip()} disabled={ctrl.phase !== 'live'}>
              <SwitchCamera size={22} />
            </IconButton>
          </div>
        </footer>
      )}
    </main>
  );
}

/** Maps detected keypoints from the full video frame into the 3:4 viewport crop. */
export function toViewport(s: Skeleton, vw: number, vh: number): Skeleton {
  let sw = vw;
  let sh = vw / FRAME_ASPECT;
  if (sh > vh) {
    sh = vh;
    sw = vh * FRAME_ASPECT;
  }
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  const out = {} as Skeleton;
  for (const k of Object.keys(s) as (keyof Skeleton)[]) {
    out[k] = { x: (s[k].x * vw - sx) / sw, y: (s[k].y * vh - sy) / sh, visibility: s[k].visibility };
  }
  return out;
}

function CameraErrorView({ code, onRetry, onUpload }: { code: string | null; onRetry: () => void; onUpload: () => void }) {
  const upload = (
    <Button variant="ghost" size="md" icon={<ImageUp size={18} />} onClick={onUpload}>
      Upload a photo instead
    </Button>
  );
  switch (code) {
    case 'permission_denied':
      return (
        <StateView
          tone="error"
          icon={<CameraOff size={28} />}
          title="Camera access is off"
          message="To use the pose guide, allow camera access: on iPhone open Settings › Apps › Safari › Camera and choose “Allow”, then come back and tap Try again."
          action={<Button onClick={onRetry}>Try again</Button>}
          secondary={upload}
        />
      );
    case 'insecure_context':
      return <StateView tone="error" icon={<CameraOff size={28} />} title="Camera needs a secure connection" message="Open PhotoPose over https to use the camera." secondary={upload} />;
    case 'in_use':
      return (
        <StateView
          tone="error"
          icon={<CameraOff size={28} />}
          title="Camera is busy"
          message="Another app is using the camera. Close it and try again."
          action={<Button onClick={onRetry}>Try again</Button>}
          secondary={upload}
        />
      );
    case 'unavailable':
      return <StateView tone="error" icon={<CameraOff size={28} />} title="No camera available" message="We couldn’t find a camera on this device. You can still analyse a photo from your library." action={upload} />;
    default:
      return (
        <StateView
          tone="error"
          icon={<CameraOff size={28} />}
          title="Camera couldn’t start"
          message="Something went wrong while starting the camera."
          action={<Button onClick={onRetry}>Try again</Button>}
          secondary={upload}
        />
      );
  }
}

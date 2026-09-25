import { useCallback, useEffect, useRef, useState } from 'react';
import { getServices } from '@/services/container';
import { CameraError, type CameraErrorCode, type CameraFacing } from '@/services/camera/CameraService';
import { useSettingsStore } from '@/stores/settingsStore';

export type CameraPhase = 'idle' | 'priming' | 'starting' | 'live' | 'error';

/**
 * Camera state machine for the camera screen: permission priming, start/stop,
 * front/back switching, torch, lifecycle (pause when the app is hidden).
 */
export function useCameraController() {
  const camera = getServices().camera;
  const { settings, cameraPrimed, setCameraPrimed } = useSettingsStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<CameraPhase>('idle');
  const [error, setError] = useState<CameraErrorCode | null>(null);
  const [facing, setFacing] = useState<CameraFacing>(settings.camera.defaultFacing);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const startSeq = useRef(0);
  const phaseRef = useRef<CameraPhase>('idle');
  phaseRef.current = phase;

  const start = useCallback(
    async (f: CameraFacing = facing) => {
      const video = videoRef.current;
      if (!video) return;
      const seq = ++startSeq.current;
      setPhase('starting');
      setError(null);
      try {
        const res = await camera.start(video, f);
        if (seq !== startSeq.current) return; // a newer start superseded this one
        setFacing(f);
        setHasTorch(res.hasTorch);
        setTorchOn(false);
        setPhase('live');
        setCameraPrimed(true);
      } catch (e) {
        if (seq !== startSeq.current) return;
        const code = e instanceof CameraError ? e.code : 'unknown';
        setError(code);
        setPhase('error');
      }
    },
    [camera, facing, setCameraPrimed],
  );

  // Initial start: show a friendly explainer before the system prompt the first time.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!camera.isSupported()) {
        setError(window.isSecureContext === false ? 'insecure_context' : 'unavailable');
        setPhase('error');
        return;
      }
      const state = await camera.getPermissionState();
      if (cancelled) return;
      if (state === 'denied') {
        setError('permission_denied');
        setPhase('error');
      } else if (state === 'granted' || cameraPrimed) {
        void start();
      } else {
        setPhase('priming');
      }
    })();
    return () => {
      cancelled = true;
      startSeq.current++;
      camera.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Release the camera when the app goes to background; resume on return.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        if (phaseRef.current === 'live' || phaseRef.current === 'starting') {
          startSeq.current++;
          camera.stop();
          setPhase('idle');
        }
      } else if (phaseRef.current === 'idle') {
        void start();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [camera, start]);

  const flip = useCallback(() => start(facing === 'user' ? 'environment' : 'user'), [facing, start]);

  const setTorch = useCallback(
    async (on: boolean) => {
      const ok = await camera.setTorch(on);
      if (ok) setTorchOn(on);
      return ok;
    },
    [camera],
  );

  const stop = useCallback(() => {
    startSeq.current++;
    camera.stop();
    setPhase('idle');
  }, [camera]);

  return { videoRef, phase, error, facing, hasTorch, torchOn, start, stop, flip, setTorch };
}

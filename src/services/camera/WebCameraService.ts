import { canvasToBlob, makeThumbnail } from '@/utils/image';
import {
  CameraError,
  type CameraFacing,
  type CameraService,
  type CameraStartResult,
  type CapturedPhoto,
  type CaptureOptions,
  type PermissionStateLite,
} from './CameraService';

/** getUserMedia-based camera for browsers / installed PWAs (incl. iOS Safari). */
export class WebCameraService implements CameraService {
  private stream: MediaStream | null = null;

  isSupported() {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  async getPermissionState(): Promise<PermissionStateLite> {
    try {
      const status = await navigator.permissions?.query({ name: 'camera' as PermissionName });
      return (status?.state as PermissionStateLite) ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async start(video: HTMLVideoElement, facing: CameraFacing): Promise<CameraStartResult> {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      throw new CameraError('insecure_context', 'The camera requires a secure (https) connection.');
    }
    if (!this.isSupported()) throw new CameraError('unavailable', 'No camera is available on this device.');
    this.stop();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
      });
    } catch (e) {
      throw mapError(e);
    }
    video.srcObject = this.stream;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    try {
      await video.play();
    } catch {
      /* iOS may need a gesture; autoplay muted usually works */
    }
    await waitForDimensions(video);
    const track = this.stream.getVideoTracks()[0];
    const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
    const settings = track?.getSettings?.() ?? {};
    return {
      facing: (settings.facingMode as CameraFacing | undefined) ?? facing,
      hasTorch: Boolean(caps.torch),
      width: video.videoWidth,
      height: video.videoHeight,
    };
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  async setTorch(on: boolean) {
    const track = this.stream?.getVideoTracks()[0];
    if (!track) return false;
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      return true;
    } catch {
      return false;
    }
  }

  async capture(video: HTMLVideoElement, { aspect, mirror, maxSize }: CaptureOptions): Promise<CapturedPhoto> {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) throw new CameraError('unavailable', 'Camera is not ready yet.');
    // Centre crop to the requested aspect (matches the on-screen viewport).
    let sw = vw;
    let sh = vw / aspect;
    if (sh > vh) {
      sh = vh;
      sw = vh * aspect;
    }
    const sx = (vw - sw) / 2;
    const sy = (vh - sh) / 2;
    const s = Math.min(1, maxSize / Math.max(sw, sh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw * s);
    canvas.height = Math.round(sh * s);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing failed');
    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
    const thumbnail = await makeThumbnail(canvas, canvas.width, canvas.height);
    return { blob, width: canvas.width, height: canvas.height, thumbnail, mirrored: mirror };
  }
}

function mapError(e: unknown): CameraError {
  const name = (e as DOMException)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return new CameraError('permission_denied', 'Camera access was denied.');
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return new CameraError('unavailable', 'No camera was found.');
  if (name === 'NotReadableError' || name === 'AbortError') return new CameraError('in_use', 'The camera is being used by another app.');
  return new CameraError('unknown', 'The camera could not be started.');
}

function waitForDimensions(video: HTMLVideoElement, timeout = 4000) {
  return new Promise<void>((resolve) => {
    if (video.videoWidth) return resolve();
    const done = () => {
      video.removeEventListener('loadedmetadata', done);
      resolve();
    };
    video.addEventListener('loadedmetadata', done);
    setTimeout(done, timeout);
  });
}

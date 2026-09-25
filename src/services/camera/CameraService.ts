/**
 * Camera abstraction. The web implementation uses getUserMedia; a native
 * wrapper (Capacitor / React Native) can provide its own implementation
 * with the same contract.
 */
export type CameraFacing = 'user' | 'environment';

export type CameraErrorCode = 'permission_denied' | 'unavailable' | 'insecure_context' | 'in_use' | 'unknown';

export class CameraError extends Error {
  constructor(public code: CameraErrorCode, message: string) {
    super(message);
    this.name = 'CameraError';
  }
}

export interface CameraStartResult {
  facing: CameraFacing;
  hasTorch: boolean;
  width: number;
  height: number;
}

export interface CaptureOptions {
  /** Target aspect (width / height). The centre of the frame is cropped. */
  aspect: number;
  /** Mirror the output horizontally (front camera "as seen"). */
  mirror: boolean;
  /** Longest side of the output photo. */
  maxSize: number;
}

export interface CapturedPhoto {
  blob: Blob;
  width: number;
  height: number;
  thumbnail: string;
  mirrored: boolean;
}

export type PermissionStateLite = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface CameraService {
  isSupported(): boolean;
  getPermissionState(): Promise<PermissionStateLite>;
  start(video: HTMLVideoElement, facing: CameraFacing): Promise<CameraStartResult>;
  stop(): void;
  setTorch(on: boolean): Promise<boolean>;
  capture(video: HTMLVideoElement, options: CaptureOptions): Promise<CapturedPhoto>;
}

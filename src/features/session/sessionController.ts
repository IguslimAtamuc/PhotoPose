/**
 * Photo session use-cases. Screens call these instead of wiring services and
 * stores together themselves (keeps business logic out of views).
 */
import type { PhotoSession, Pose } from '@/models';
import { getServices } from '@/services/container';
import { AnalysisError, type AnalysisErrorCode } from '@/services/ai/PoseAnalysisService';
import { useHistoryStore } from '@/stores/historyStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { uid } from '@/utils/id';
import { decodeImage, makeThumbnail, resizeImage } from '@/utils/image';

export interface NewPhoto {
  blob: Blob;
  width: number;
  height: number;
  thumbnail: string;
  mirrored: boolean;
}

export class QuotaExceededError extends Error {
  constructor() {
    super('Daily analysis limit reached');
    this.name = 'QuotaExceededError';
  }
}

/** Persists a captured photo and creates a session in "captured" state. */
export async function createSession(
  pose: Pose,
  photo: NewPhoto,
  source: PhotoSession['source'],
  cameraFacing?: PhotoSession['cameraFacing'],
): Promise<PhotoSession> {
  const { photos, analytics } = getServices();
  const id = uid('ses');
  const photoId = uid('img');
  try {
    await photos.save(photoId, photo.blob);
  } catch (e) {
    console.error('[session] could not store photo', e);
    throw new Error('storage_failed');
  }
  const session: PhotoSession = {
    id,
    poseId: pose.id,
    photoId,
    thumbnail: photo.thumbnail,
    width: photo.width,
    height: photo.height,
    source,
    cameraFacing,
    mirrored: photo.mirrored,
    status: 'captured',
    createdAt: new Date().toISOString(),
  };
  useHistoryStore.getState().upsert(session);
  analytics.track('photo_captured', { poseId: pose.id, source });
  return session;
}

/** Imports a photo from the device library. */
export async function importPhoto(file: File): Promise<NewPhoto> {
  if (!file.type.startsWith('image/')) throw new Error('image_invalid');
  const resized = await resizeImage(file, 1600);
  const img = await decodeImage(resized.blob);
  try {
    const thumbnail = await makeThumbnail(img.source, img.width, img.height);
    return { ...resized, thumbnail, mirrored: false };
  } finally {
    img.close();
  }
}

/**
 * Runs AI analysis for a session. Enforces the free-tier quota, updates the
 * session state and records analytics. Throws AnalysisError / QuotaExceededError.
 */
export async function analyzeSession(
  sessionId: string,
  pose: Pose,
  opts: { useFallback?: boolean; signal?: AbortSignal } = {},
): Promise<PhotoSession> {
  const services = getServices();
  const history = useHistoryStore.getState();
  const subs = useSubscriptionStore.getState();
  const session = history.sessions.find((s) => s.id === sessionId);
  if (!session) throw new AnalysisError('image_invalid', 'This photo session no longer exists.');
  if (subs.remainingAnalyses() <= 0) throw new QuotaExceededError();

  const blob = await services.photos.get(session.photoId);
  if (!blob) throw new AnalysisError('image_invalid', 'The photo could not be found.');

  const provider = opts.useFallback ? services.fallbackAnalysis : services.analysis;
  history.patch(sessionId, { status: 'analyzing', errorCode: undefined });
  services.analytics.track('analysis_started', { poseId: pose.id, provider: provider.id });
  const started = performance.now();
  try {
    const out = await provider.analyze(
      {
        pose,
        image: blob,
        width: session.width,
        height: session.height,
        mirrored: session.mirrored ?? false,
        advanced: subs.entitlements.advancedFeedback,
      },
      opts.signal,
    );
    if (opts.signal?.aborted) throw new AnalysisError('aborted', 'Analysis cancelled');
    const result = { ...out, id: uid('res'), sessionId, createdAt: new Date().toISOString() };
    useHistoryStore.getState().patch(sessionId, { status: 'analyzed', result });
    useSubscriptionStore.getState().recordAnalysis();
    services.analytics.track('analysis_completed', {
      poseId: pose.id,
      provider: provider.id,
      score: result.score,
      ms: Math.round(performance.now() - started),
    });
    return useHistoryStore.getState().sessions.find((s) => s.id === sessionId)!;
  } catch (e) {
    const code: AnalysisErrorCode = e instanceof AnalysisError ? e.code : 'unknown';
    if (code !== 'aborted') {
      useHistoryStore.getState().patch(sessionId, { status: 'failed', errorCode: code });
      services.analytics.track('analysis_failed', { poseId: pose.id, provider: provider.id, code });
    }
    throw e instanceof AnalysisError ? e : new AnalysisError('unknown', 'Something went wrong while analysing your photo.');
  }
}

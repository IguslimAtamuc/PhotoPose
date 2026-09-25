/**
 * Composition root — the ONE place where concrete implementations are chosen.
 * To swap a provider (AI, backend, database, auth, payments, analytics),
 * change the factory here; screens and stores depend only on interfaces.
 */
import { appConfig } from '@/config/app.config';
import { ApiClient } from './api/ApiClient';
import { BundledPoseRepository, RemotePoseRepository, type PoseRepository } from './api/PoseRepository';
import type { PoseAnalysisService } from './ai/PoseAnalysisService';
import { MediaPipePoseAnalysisService } from './ai/MediaPipePoseAnalysisService';
import { MockPoseAnalysisService } from './ai/MockPoseAnalysisService';
import { RemotePoseAnalysisService } from './ai/RemotePoseAnalysisService';
import { AnalyticsService, ConsoleAnalyticsProvider, NoopAnalyticsProvider } from './analytics/AnalyticsService';
import { LocalGuestAuthService, type AuthService } from './auth/AuthService';
import type { CameraService } from './camera/CameraService';
import { WebCameraService } from './camera/WebCameraService';
import { WebNotificationService, type NotificationService } from './notifications/NotificationService';
import { createKeyValueStore, type KeyValueStore } from './persistence/KeyValueStore';
import { createPhotoStore, type PhotoStore } from './persistence/PhotoStore';
import { WebShareService, type ShareService } from './share/ShareService';
import { MockSubscriptionService } from './subscription/MockSubscriptionService';
import type { SubscriptionService } from './subscription/SubscriptionService';
import { NoopBodyTrackingService, type BodyTrackingService } from './tracking/BodyTrackingService';
import { MediaPipeBodyTrackingService } from './tracking/MediaPipeBodyTrackingService';

export interface Services {
  kv: KeyValueStore;
  photos: PhotoStore;
  api: ApiClient;
  poses: PoseRepository;
  /** Primary analysis provider. */
  analysis: PoseAnalysisService;
  /** Offline/basic fallback the user can opt into when the primary fails. */
  fallbackAnalysis: PoseAnalysisService;
  tracking: BodyTrackingService;
  camera: CameraService;
  subscription: SubscriptionService;
  analytics: AnalyticsService;
  auth: AuthService;
  share: ShareService;
  notifications: NotificationService;
}

export function createServices(): Services {
  const kv = createKeyValueStore(appConfig.storage.namespace);
  const auth = new LocalGuestAuthService(kv);
  const api = new ApiClient({ baseUrl: appConfig.api.baseUrl, timeoutMs: appConfig.api.timeoutMs, getToken: () => auth.getToken() });

  // BACKEND HOOK: set VITE_API_BASE_URL to load content from your server.
  const poses: PoseRepository = api.isConfigured ? new RemotePoseRepository(api) : new BundledPoseRepository();

  // AI HOOK: choose the analysis provider (VITE_ANALYSIS_PROVIDER).
  const fallbackAnalysis = new MockPoseAnalysisService();
  let analysis: PoseAnalysisService;
  switch (appConfig.ai.provider) {
    case 'remote':
      analysis = new RemotePoseAnalysisService(
        appConfig.ai.remoteEndpoint ? new ApiClient({ baseUrl: appConfig.ai.remoteEndpoint, timeoutMs: 45000, getToken: () => auth.getToken() }) : api,
      );
      break;
    case 'mock':
      analysis = fallbackAnalysis;
      break;
    default:
      analysis = new MediaPipePoseAnalysisService();
  }

  const analyticsProvider = appConfig.analytics.provider === 'console' ? new ConsoleAnalyticsProvider() : new NoopAnalyticsProvider();

  return {
    kv,
    photos: createPhotoStore(`${appConfig.storage.namespace}.photos`),
    api,
    poses,
    analysis,
    fallbackAnalysis,
    tracking: appConfig.features.liveTracking ? new MediaPipeBodyTrackingService() : new NoopBodyTrackingService(),
    camera: new WebCameraService(),
    // SUBSCRIPTION HOOK: replace with RevenueCat / StoreKit / Stripe implementation.
    subscription: new MockSubscriptionService(kv, [...appConfig.subscription.plans], appConfig.subscription.testMode),
    analytics: new AnalyticsService([analyticsProvider]),
    auth,
    share: new WebShareService(),
    notifications: new WebNotificationService(),
  };
}

let instance: Services | null = null;
/** Lazily created singleton, used by stores and the React provider. */
export function getServices(): Services {
  if (!instance) instance = createServices();
  return instance;
}
/** Test hook to inject fakes. */
export function setServices(s: Services) {
  instance = s;
}

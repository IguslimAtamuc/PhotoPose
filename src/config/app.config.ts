/**
 * Central app configuration.
 *
 * Branding, provider selection, feature flags and monetization limits live
 * here so they can be changed without touching screens or services.
 * Values can be overridden at build time with VITE_* environment variables.
 */

const env = import.meta.env;
const base = env.BASE_URL ?? '/';

export type AnalysisProviderId = 'mediapipe' | 'mock' | 'remote';
export type AnalyticsProviderId = 'console' | 'noop';
export type SubscriptionProviderId = 'mock';

export const appConfig = {
  brand: {
    name: 'PhotoPose',
    tagline: 'Pose like a pro. Shoot with confidence.',
    supportEmail: 'support@photopose.app',
    websiteUrl: 'https://photopose.app',
    /** Set when the native App Store listing exists. */
    appStoreUrl: (env.VITE_APP_STORE_URL as string | undefined) ?? '',
  },

  /** Backend API. Empty = fully local (bundled sample content). */
  api: {
    baseUrl: (env.VITE_API_BASE_URL as string | undefined) ?? '',
    timeoutMs: 15000,
  },

  ai: {
    /** Which PoseAnalysisService implementation to use. */
    provider: ((env.VITE_ANALYSIS_PROVIDER as AnalysisProviderId | undefined) ?? 'mediapipe') as AnalysisProviderId,
    /** Endpoint for the "remote" provider (your own server calling OpenAI/Gemini/Claude/Vision API). */
    remoteEndpoint: (env.VITE_ANALYSIS_ENDPOINT as string | undefined) ?? '',
    mediapipe: {
      wasmBaseUrl: `${base}mediapipe/wasm`,
      /** Tried in order; the first that loads wins. */
      modelUrls: [
        `${base}models/pose_landmarker_lite.task`,
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
      ],
    },
  },

  analytics: {
    provider: ((env.VITE_ANALYTICS_PROVIDER as AnalyticsProviderId | undefined) ?? (env.DEV ? 'console' : 'noop')) as AnalyticsProviderId,
  },

  subscription: {
    provider: 'mock' as SubscriptionProviderId,
    /** When true, "purchases" succeed locally without payment (MVP / testing). */
    testMode: true,
    freeDailyAnalyses: 5,
    plans: [
      { id: 'photopose.premium.yearly', title: 'Yearly', priceLabel: '€29.99 / year', period: 'year', highlight: 'Best value', trialDays: 7 },
      { id: 'photopose.premium.monthly', title: 'Monthly', priceLabel: '€5.99 / month', period: 'month' },
    ] as const,
  },

  features: {
    liveTracking: true,
    analyzeFromLibrary: true,
    notifications: true,
  },

  storage: {
    /** Bump to migrate/clear persisted local state. */
    namespace: 'photopose.v1',
    maxHistoryItems: 200,
    maxRecentViews: 20,
  },
} as const;

export type AppConfig = typeof appConfig;

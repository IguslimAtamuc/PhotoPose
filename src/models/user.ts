/** User, favorites, settings and subscription models. */

export interface User {
  id: string;
  displayName: string;
  /** Guest users live only on this device until an auth provider is connected. */
  isGuest: boolean;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Favorite {
  poseId: string;
  createdAt: string;
}

export interface RecentView {
  poseId: string;
  viewedAt: string;
}

export type ThemePreference = 'system' | 'dark' | 'light';

export interface CameraSettings {
  defaultFacing: 'user' | 'environment';
  showGrid: boolean;
  overlayOpacity: number; // 0..1
  defaultTimer: 0 | 3 | 10;
  mirrorFrontCamera: boolean;
  liveTracking: boolean;
  saveOriginalsToHistory: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  dailyInspiration: boolean;
  newPoses: boolean;
}

export interface AppSettings {
  theme: ThemePreference;
  haptics: boolean;
  reduceMotion: boolean;
  textScale: number; // 0.9..1.3, multiplies the system text size
  camera: CameraSettings;
  notifications: NotificationSettings;
  analyticsEnabled: boolean;
}

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionPlan {
  id: string;
  title: string;
  priceLabel: string;
  period: 'week' | 'month' | 'year' | 'lifetime';
  highlight?: string;
  trialDays?: number;
}

export interface Subscription {
  tier: SubscriptionTier;
  planId?: string;
  status: 'none' | 'active' | 'expired' | 'grace';
  /** Where the purchase came from (e.g. "mock", "revenuecat", "storekit", "stripe"). */
  provider: string;
  startedAt?: string;
  expiresAt?: string;
}

/** What the current user may do. UI checks entitlements, never tiers. */
export interface Entitlements {
  tier: SubscriptionTier;
  unlimitedAnalyses: boolean;
  dailyAnalysisLimit: number;
  premiumPoses: boolean;
  advancedFeedback: boolean;
  exclusiveContent: boolean;
}

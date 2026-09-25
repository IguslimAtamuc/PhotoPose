/**
 * Analytics abstraction. Screens call `analytics.track(...)` with typed
 * events; the provider (Firebase, Amplitude, Mixpanel, PostHog, TelemetryDeck…)
 * is chosen in services/container.ts.
 */
export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_completed'
  | 'pose_viewed'
  | 'pose_started'
  | 'camera_opened'
  | 'photo_captured'
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'pose_saved'
  | 'pose_unsaved'
  | 'photo_saved'
  | 'photo_shared'
  | 'paywall_viewed'
  | 'subscription_started'
  | 'subscription_restored'
  | 'search_performed';

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export interface AnalyticsProvider {
  track(event: AnalyticsEvent, props?: AnalyticsProps): void;
  identify(userId: string, traits?: AnalyticsProps): void;
}

export class NoopAnalyticsProvider implements AnalyticsProvider {
  track() {}
  identify() {}
}

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent, props?: AnalyticsProps) {
    console.info('%c[analytics]', 'color:#FF6B4A', event, props ?? {});
  }
  identify(userId: string, traits?: AnalyticsProps) {
    console.info('%c[analytics] identify', 'color:#FF6B4A', userId, traits ?? {});
  }
}

/** Facade that respects the user's analytics opt-out and fans out to providers. */
export class AnalyticsService {
  private enabled = true;
  constructor(private providers: AnalyticsProvider[]) {}

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
  track(event: AnalyticsEvent, props?: AnalyticsProps) {
    if (!this.enabled) return;
    for (const p of this.providers) {
      try {
        p.track(event, props);
      } catch {
        /* analytics must never break the app */
      }
    }
  }
  identify(userId: string, traits?: AnalyticsProps) {
    if (!this.enabled) return;
    this.providers.forEach((p) => p.identify(userId, traits));
  }
}

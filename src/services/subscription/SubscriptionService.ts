import type { Entitlements, Subscription, SubscriptionPlan } from '@/models';

/**
 * Monetization boundary. The UI only asks for plans, purchases, restores and
 * *entitlements* — never for store-specific details.
 *
 * SUBSCRIPTION HOOK: implement this with RevenueCat (web + native),
 * StoreKit 2 (native iOS wrapper) or Stripe Checkout (web) and select it in
 * services/container.ts.
 */
export interface SubscriptionService {
  readonly id: string;
  getPlans(): Promise<SubscriptionPlan[]>;
  getSubscription(): Promise<Subscription>;
  purchase(planId: string): Promise<Subscription>;
  restore(): Promise<Subscription>;
  /** URL of the store's subscription management page, if any. */
  manageUrl(): string | null;
}

export const FREE_SUBSCRIPTION: Subscription = { tier: 'free', status: 'none', provider: 'none' };

/** Maps a subscription to what the user may do. Keep ALL gating rules here. */
export function entitlementsFor(sub: Subscription, freeDailyAnalyses: number): Entitlements {
  const premium = sub.tier === 'premium' && (sub.status === 'active' || sub.status === 'grace');
  return {
    tier: premium ? 'premium' : 'free',
    unlimitedAnalyses: premium,
    dailyAnalysisLimit: premium ? Number.POSITIVE_INFINITY : freeDailyAnalyses,
    premiumPoses: premium,
    advancedFeedback: premium,
    exclusiveContent: premium,
  };
}

export class PurchaseError extends Error {
  constructor(public code: 'cancelled' | 'not_available' | 'failed', message: string) {
    super(message);
    this.name = 'PurchaseError';
  }
}

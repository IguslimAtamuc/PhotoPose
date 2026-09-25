import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Entitlements, Subscription, SubscriptionPlan } from '@/models';
import { appConfig } from '@/config/app.config';
import { getServices } from '@/services/container';
import { entitlementsFor, FREE_SUBSCRIPTION } from '@/services/subscription/SubscriptionService';
import { kvStorage } from './storage';

const today = () => new Date().toISOString().slice(0, 10);

interface SubscriptionState {
  subscription: Subscription;
  entitlements: Entitlements;
  plans: SubscriptionPlan[];
  usage: { date: string; analyses: number };
  busy: boolean;
  refresh(): Promise<void>;
  purchase(planId: string): Promise<void>;
  restore(): Promise<boolean>;
  /** Remaining AI analyses today (Infinity for premium). */
  remainingAnalyses(): number;
  recordAnalysis(): void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: FREE_SUBSCRIPTION,
      entitlements: entitlementsFor(FREE_SUBSCRIPTION, appConfig.subscription.freeDailyAnalyses),
      plans: [],
      usage: { date: today(), analyses: 0 },
      busy: false,
      refresh: async () => {
        const svc = getServices().subscription;
        const [subscription, plans] = await Promise.all([svc.getSubscription(), svc.getPlans()]);
        set({ subscription, plans, entitlements: entitlementsFor(subscription, appConfig.subscription.freeDailyAnalyses) });
      },
      purchase: async (planId) => {
        set({ busy: true });
        try {
          const subscription = await getServices().subscription.purchase(planId);
          set({ subscription, entitlements: entitlementsFor(subscription, appConfig.subscription.freeDailyAnalyses) });
          getServices().analytics.track('subscription_started', { planId });
        } finally {
          set({ busy: false });
        }
      },
      restore: async () => {
        set({ busy: true });
        try {
          const subscription = await getServices().subscription.restore();
          set({ subscription, entitlements: entitlementsFor(subscription, appConfig.subscription.freeDailyAnalyses) });
          getServices().analytics.track('subscription_restored', { tier: subscription.tier });
          return subscription.tier === 'premium';
        } finally {
          set({ busy: false });
        }
      },
      remainingAnalyses: () => {
        const { entitlements, usage } = get();
        if (entitlements.unlimitedAnalyses) return Number.POSITIVE_INFINITY;
        const used = usage.date === today() ? usage.analyses : 0;
        return Math.max(0, entitlements.dailyAnalysisLimit - used);
      },
      recordAnalysis: () =>
        set((s) => ({ usage: s.usage.date === today() ? { date: s.usage.date, analyses: s.usage.analyses + 1 } : { date: today(), analyses: 1 } })),
    }),
    { name: 'usage', storage: kvStorage, version: 1, partialize: (s) => ({ usage: s.usage }) },
  ),
);

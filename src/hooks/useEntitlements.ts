import { useSubscriptionStore } from '@/stores/subscriptionStore';

export function useEntitlements() {
  return useSubscriptionStore((s) => s.entitlements);
}

/** True when the user may open a pose's camera session. */
export function useCanUsePose(isPremium: boolean) {
  return useSubscriptionStore((s) => !isPremium || s.entitlements.premiumPoses);
}

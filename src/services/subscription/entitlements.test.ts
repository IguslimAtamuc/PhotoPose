import { describe, expect, it } from 'vitest';
import { entitlementsFor, FREE_SUBSCRIPTION } from './SubscriptionService';

describe('entitlementsFor', () => {
  it('limits free users', () => {
    const e = entitlementsFor(FREE_SUBSCRIPTION, 5);
    expect(e.dailyAnalysisLimit).toBe(5);
    expect(e.premiumPoses).toBe(false);
  });
  it('unlocks active premium', () => {
    const e = entitlementsFor({ tier: 'premium', status: 'active', provider: 'mock' }, 5);
    expect(e.unlimitedAnalyses && e.premiumPoses && e.advancedFeedback).toBe(true);
  });
  it('does not unlock expired premium', () => {
    expect(entitlementsFor({ tier: 'premium', status: 'expired', provider: 'mock' }, 5).premiumPoses).toBe(false);
  });
});

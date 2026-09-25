import type { Subscription, SubscriptionPlan } from '@/models';
import type { KeyValueStore } from '@/services/persistence/KeyValueStore';
import { FREE_SUBSCRIPTION, PurchaseError, type SubscriptionService } from './SubscriptionService';

/**
 * Local, test-mode subscription provider. Purchases succeed instantly with no
 * payment and are stored on-device. Replace before shipping paid plans.
 */
export class MockSubscriptionService implements SubscriptionService {
  readonly id = 'mock';
  private key = 'subscription';

  constructor(private kv: KeyValueStore, private plans: SubscriptionPlan[], private testMode: boolean) {}

  async getPlans() {
    return this.plans;
  }

  async getSubscription(): Promise<Subscription> {
    try {
      const raw = this.kv.getItem(this.key);
      if (!raw) return FREE_SUBSCRIPTION;
      const sub = JSON.parse(raw) as Subscription;
      if (sub.expiresAt && new Date(sub.expiresAt).getTime() < Date.now()) return { ...sub, status: 'expired', tier: 'free' };
      return sub;
    } catch {
      return FREE_SUBSCRIPTION;
    }
  }

  async purchase(planId: string): Promise<Subscription> {
    if (!this.testMode) throw new PurchaseError('not_available', 'Purchases are not available yet.');
    const plan = this.plans.find((p) => p.id === planId);
    if (!plan) throw new PurchaseError('failed', 'Unknown plan.');
    await new Promise((r) => setTimeout(r, 900));
    const days = plan.period === 'year' ? 365 : plan.period === 'month' ? 30 : plan.period === 'week' ? 7 : 36500;
    const sub: Subscription = {
      tier: 'premium',
      status: 'active',
      planId,
      provider: this.id,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + days * 864e5).toISOString(),
    };
    this.kv.setItem(this.key, JSON.stringify(sub));
    return sub;
  }

  async restore() {
    await new Promise((r) => setTimeout(r, 600));
    return this.getSubscription();
  }

  manageUrl() {
    return null;
  }

  /** Test helper: cancel the local subscription. */
  async reset() {
    this.kv.removeItem(this.key);
    return FREE_SUBSCRIPTION;
  }
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Crown, Infinity as InfinityIcon, Sparkles, Unlock, Wand2, X } from 'lucide-react';
import { Button, IconButton } from '@/components/Button';
import { PoseArt } from '@/components/PoseArt';
import { appConfig } from '@/config/app.config';
import { getServices } from '@/services/container';
import { PurchaseError } from '@/services/subscription/SubscriptionService';
import { useCatalogStore } from '@/stores/catalogStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { toast } from '@/stores/toastStore';
import './paywall.css';

const PERKS = [
  { icon: InfinityIcon, title: 'Unlimited AI analyses', text: `Free includes ${appConfig.subscription.freeDailyAnalyses} per day.` },
  { icon: Unlock, title: 'Every pose, every category', text: 'Including Wedding and all premium collections.' },
  { icon: Wand2, title: 'Advanced feedback', text: 'Per-body-part scores and extra coaching tips.' },
  { icon: Sparkles, title: 'Exclusive new content', text: 'Fresh pose packs every month.' },
];

/**
 * Paywall UI. Purchase logic lives in SubscriptionService; in the MVP it runs
 * in test mode (no payment).
 */
export default function PaywallScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { plans, purchase, restore, busy, entitlements } = useSubscriptionStore();
  const allPoses = useCatalogStore((s) => s.poses);
  const poses = useMemo(() => allPoses.filter((p) => p.isPremium).slice(0, 3), [allPoses]);
  const [planId, setPlanId] = useState<string>(appConfig.subscription.plans[0].id);

  useEffect(() => {
    getServices().analytics.track('paywall_viewed', { from: params.get('from') ?? 'direct' });
  }, [params]);

  const close = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'));

  const buy = async () => {
    try {
      await purchase(planId);
      toast('Welcome to PhotoPose Premium!', 'success');
      close();
    } catch (e) {
      if (e instanceof PurchaseError && e.code === 'cancelled') return;
      toast(e instanceof Error ? e.message : 'Purchase failed', 'error');
    }
  };

  if (entitlements.tier === 'premium') {
    return (
      <main className="screen screen--no-tabs paywall">
        <div className="paywall__close"><IconButton label="Close" variant="glass" onClick={close}><X size={20} /></IconButton></div>
        <div className="paywall__done page-pad">
          <Crown size={40} className="paywall__crown" aria-hidden />
          <h1 className="t-title">You’re Premium</h1>
          <p className="t-body">Everything in PhotoPose is unlocked.</p>
          <Button onClick={() => navigate('/explore')}>Explore all poses</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="screen screen--no-tabs screen--flush paywall">
      <div className="paywall__close"><IconButton label="Close" variant="glass" onClick={close}><X size={20} /></IconButton></div>
      <div className="paywall__hero" aria-hidden>
        {poses.map((p, i) => (
          <PoseArt key={p.id} pose={p} className={`paywall__art paywall__art--${i}`} />
        ))}
        <div className="paywall__fade" />
      </div>
      <div className="paywall__body page-pad">
        <span className="badge badge--premium"><Crown size={12} aria-hidden /> Premium</span>
        <h1 className="t-display">Pose better, <span className="t-accent">every shot.</span></h1>
        <ul className="perks">
          {PERKS.map((p) => (
            <li key={p.title}>
              <span className="perks__icon" aria-hidden><p.icon size={18} /></span>
              <div>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="plans" role="radiogroup" aria-label="Choose a plan">
          {plans.map((p) => (
            <button key={p.id} role="radio" aria-checked={planId === p.id} className={`plan ${planId === p.id ? 'is-on' : ''}`} onClick={() => setPlanId(p.id)}>
              <span className="plan__radio" aria-hidden>{planId === p.id && <Check size={14} strokeWidth={3} />}</span>
              <span className="plan__text">
                <strong>{p.title}</strong>
                <span>{p.priceLabel}{p.trialDays ? ` · ${p.trialDays}-day free trial` : ''}</span>
              </span>
              {p.highlight && <span className="plan__tag">{p.highlight}</span>}
            </button>
          ))}
        </div>

        <Button block variant="premium" loading={busy} onClick={buy}>
          {appConfig.subscription.testMode ? 'Start Premium (test mode)' : 'Continue'}
        </Button>
        {appConfig.subscription.testMode && (
          <p className="paywall__note">Preview build: purchases are simulated and free. No payment is taken.</p>
        )}
        <div className="paywall__links">
          <button onClick={async () => { const ok = await restore(); toast(ok ? 'Premium restored' : 'No purchases to restore', ok ? 'success' : 'info'); if (ok) close(); }}>Restore Purchases</button>
          <span aria-hidden>·</span>
          <button onClick={() => navigate('/terms')}>Terms</button>
          <span aria-hidden>·</span>
          <button onClick={() => navigate('/privacy')}>Privacy</button>
        </div>
      </div>
    </main>
  );
}

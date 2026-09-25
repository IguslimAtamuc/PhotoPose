import { useNavigate } from 'react-router-dom';
import { Crown, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/Button';
import { ListGroup, ListRow } from '@/components/Controls';
import { TopBar } from '@/components/TopBar';
import { appConfig } from '@/config/app.config';
import { getServices } from '@/services/container';
import { MockSubscriptionService } from '@/services/subscription/MockSubscriptionService';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { toast } from '@/stores/toastStore';
import '../profile/profile.css';

export default function SubscriptionScreen() {
  const navigate = useNavigate();
  const { subscription, entitlements, plans, restore, refresh, remainingAnalyses } = useSubscriptionStore();
  const premium = entitlements.tier === 'premium';
  const plan = plans.find((p) => p.id === subscription.planId);
  const svc = getServices().subscription;
  const manageUrl = svc.manageUrl();

  return (
    <main className="screen screen--no-tabs settings">
      <TopBar title="Subscription" back />
      <div className="page-pad">
        <div className={`premium-card ${premium ? 'is-member' : ''}`}>
          <Crown size={22} aria-hidden />
          <div>
            <strong>{premium ? 'PhotoPose Premium' : 'PhotoPose Free'}</strong>
            <span>
              {premium
                ? `${plan?.title ?? 'Premium'} plan${subscription.expiresAt ? ` · renews ${new Date(subscription.expiresAt).toLocaleDateString()}` : ''}`
                : `${remainingAnalyses()} of ${appConfig.subscription.freeDailyAnalyses} AI analyses left today`}
            </span>
          </div>
        </div>

        <ListGroup title="Plan">
          <ListRow label="Status" value={premium ? 'Active' : 'Free'} />
          <ListRow label="Provider" value={subscription.provider === 'mock' ? 'Test mode' : subscription.provider} />
          {!premium && <ListRow icon={<Crown size={18} />} label="Upgrade to Premium" onClick={() => navigate('/premium?from=subscription')} />}
        </ListGroup>

        <ListGroup title="Manage" footer={manageUrl ? undefined : 'In the App Store version, subscriptions are managed in iPhone Settings › Apple ID › Subscriptions.'}>
          <ListRow icon={<RotateCcw size={18} />} label="Restore Purchases" onClick={async () => { const ok = await restore(); toast(ok ? 'Premium restored' : 'No active purchases found', ok ? 'success' : 'info'); }} />
          {manageUrl && <ListRow icon={<ExternalLink size={18} />} label="Manage Subscription" href={manageUrl} />}
        </ListGroup>

        {premium && svc instanceof MockSubscriptionService && (
          <Button
            variant="ghost"
            block
            onClick={async () => {
              await svc.reset();
              await refresh();
              toast('Test subscription cancelled');
            }}
          >
            Cancel test subscription
          </Button>
        )}
      </div>
    </main>
  );
}

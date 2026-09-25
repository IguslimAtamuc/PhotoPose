import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Camera, ChevronRight, Crown, FileText, Heart, History, Mail, Pencil, RotateCcw, Settings, Shield, Star, CreditCard } from 'lucide-react';
import { Button } from '@/components/Button';
import { ListGroup, ListRow } from '@/components/Controls';
import { Sheet } from '@/components/Sheet';
import { appConfig } from '@/config/app.config';
import { useHistoryStore } from '@/stores/historyStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { toast } from '@/stores/toastStore';
import { useUserStore } from '@/stores/userStore';
import './profile.css';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.update);
  const favorites = useLibraryStore((s) => s.favorites.length);
  const sessions = useHistoryStore((s) => s.sessions);
  const { entitlements, subscription, restore, busy, remainingAnalyses } = useSubscriptionStore();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [rateOpen, setRateOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const premium = entitlements.tier === 'premium';
  const initials = (user?.displayName ?? 'P').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const remaining = remainingAnalyses();

  const onRestore = async () => {
    try {
      const ok = await restore();
      toast(ok ? 'Premium restored' : 'No active purchases found', ok ? 'success' : 'info');
    } catch {
      toast('Couldn’t reach the store. Please try again.', 'error');
    }
  };

  return (
    <main className="screen profile">
      <header className="profile__head page-pad">
        <h1 className="t-title">Profile</h1>
      </header>

      <section className="profile-card page-pad">
        <div className="profile-card__inner">
          <div className="avatar" aria-hidden>{initials}</div>
          <div className="profile-card__text">
            <strong>{user?.displayName}</strong>
            <span>{user?.isGuest ? 'Guest · saved on this device' : user?.email}</span>
          </div>
          <button
            className="icon-btn icon-btn--surface"
            style={{ width: 40, height: 40 }}
            aria-label="Edit name"
            onClick={() => {
              setName(user?.displayName ?? '');
              setEditOpen(true);
            }}
          >
            <Pencil size={16} />
          </button>
        </div>
        <div className="profile-stats">
          <Link to="/history"><strong>{sessions.length}</strong><span>Photos</span></Link>
          <Link to="/favorites"><strong>{favorites}</strong><span>Favorites</span></Link>
          <div><strong>{premium ? '∞' : remaining}</strong><span>AI left today</span></div>
        </div>
      </section>

      <section className="page-pad">
        {premium ? (
          <Link to="/subscription" className="premium-card is-member">
            <Crown size={22} aria-hidden />
            <div>
              <strong>PhotoPose Premium</strong>
              <span>{subscription.expiresAt ? `Active · renews ${new Date(subscription.expiresAt).toLocaleDateString()}` : 'Active'}</span>
            </div>
            <ChevronRight size={18} aria-hidden />
          </Link>
        ) : (
          <Link to="/premium?from=profile" className="premium-card">
            <Crown size={22} aria-hidden />
            <div>
              <strong>Go Premium</strong>
              <span>Unlimited AI analyses, all poses, detailed feedback.</span>
            </div>
            <ChevronRight size={18} aria-hidden />
          </Link>
        )}
      </section>

      <div className="page-pad">
        <ListGroup title="Library">
          <ListRow icon={<Heart size={18} />} label="Favorites" value={String(favorites)} onClick={() => navigate('/favorites')} />
          <ListRow icon={<History size={18} />} label="History" value={String(sessions.length)} onClick={() => navigate('/history')} />
        </ListGroup>

        <ListGroup title="Settings">
          <ListRow icon={<Settings size={18} />} label="App Settings" onClick={() => navigate('/settings')} />
          <ListRow icon={<Camera size={18} />} label="Camera Settings" onClick={() => navigate('/settings/camera')} />
          <ListRow icon={<Bell size={18} />} label="Notifications" onClick={() => navigate('/settings/notifications')} />
        </ListGroup>

        <ListGroup title="Subscription">
          <ListRow icon={<Crown size={18} />} label="Subscription" value={premium ? 'Premium' : 'Free'} onClick={() => navigate(premium ? '/subscription' : '/premium?from=profile')} />
          <ListRow icon={<RotateCcw size={18} />} label={busy ? 'Restoring…' : 'Restore Purchases'} onClick={onRestore} />
          <ListRow icon={<CreditCard size={18} />} label="Manage Subscription" onClick={() => navigate('/subscription')} />
        </ListGroup>

        <ListGroup title="About" footer={`${appConfig.brand.name} ${__APP_VERSION__}`}>
          <ListRow icon={<Shield size={18} />} label="Privacy" onClick={() => navigate('/privacy')} />
          <ListRow icon={<FileText size={18} />} label="Terms of Use" onClick={() => navigate('/terms')} />
          <ListRow icon={<Star size={18} />} label="Rate App" onClick={() => setRateOpen(true)} />
          <ListRow icon={<Mail size={18} />} label="Contact Support" href={`mailto:${appConfig.brand.supportEmail}`} />
        </ListGroup>
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Your name"
        footer={
          <Button
            block
            onClick={async () => {
              const v = name.trim();
              if (!v) return;
              await updateUser({ displayName: v.slice(0, 40) });
              setEditOpen(false);
              toast('Profile updated', 'success');
            }}
          >
            Save
          </Button>
        }
      >
        <label className="field">
          <span className="t-overline">Display name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus />
        </label>
      </Sheet>

      <Sheet open={rateOpen} onClose={() => setRateOpen(false)} title="Enjoying PhotoPose?">
        <div className="rate">
          <div className="rate__stars" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={stars === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setStars(n)} className={n <= stars ? 'is-on' : ''}>
                <Star size={34} fill={n <= stars ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <Button
            block
            disabled={!stars}
            onClick={() => {
              setRateOpen(false);
              if (stars >= 4 && appConfig.brand.appStoreUrl) window.open(appConfig.brand.appStoreUrl, '_blank');
              else toast(stars >= 4 ? 'Thank you! 💛' : 'Thanks — we’ll keep improving.', 'success');
            }}
          >
            Submit
          </Button>
        </div>
      </Sheet>
    </main>
  );
}

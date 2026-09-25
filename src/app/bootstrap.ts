import { getServices } from '@/services/container';
import { useCatalogStore } from '@/stores/catalogStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUserStore } from '@/stores/userStore';

const MIN_SPLASH_MS = 650;

/** App start-up: load content + local state, then fade out the splash. */
export async function bootstrap() {
  const started = performance.now();
  const services = getServices();
  services.analytics.setEnabled(useSettingsStore.getState().settings.analyticsEnabled);
  useSettingsStore.subscribe((s) => services.analytics.setEnabled(s.settings.analyticsEnabled));

  await Promise.allSettled([
    useCatalogStore.getState().load(),
    useUserStore.getState().load(),
    useSubscriptionStore.getState().refresh(),
    waitForHistory(),
  ]);
  services.analytics.track('app_opened', { standalone: isStandalone() });

  const wait = Math.max(0, MIN_SPLASH_MS - (performance.now() - started));
  setTimeout(hideSplash, wait);
}

function waitForHistory() {
  if (useHistoryStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const unsub = useHistoryStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
    setTimeout(resolve, 1500);
  });
}

function hideSplash() {
  const el = document.getElementById('splash');
  if (!el) return;
  el.classList.add('hide');
  setTimeout(() => el.remove(), 500);
}

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

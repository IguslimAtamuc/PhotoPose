/** Registers the service worker (offline support, fast repeat starts). */
export function registerServiceWorker() {
  if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch((e) => console.warn('[sw] registration failed', e));
}

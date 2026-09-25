import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { TabBar } from '@/components/TabBar';
import { Toasts } from '@/components/Toasts';
import { OfflineBanner, Spinner } from '@/components/Feedback';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSettingsStore } from '@/stores/settingsStore';
import { HomeScreen } from '@/features/home/HomeScreen';
import { ExploreScreen } from '@/features/explore/ExploreScreen';
import { PoseDetailScreen } from '@/features/pose/PoseDetailScreen';
import { FavoritesScreen } from '@/features/favorites/FavoritesScreen';

// Heavier / less frequent screens are code-split for a fast first paint.
const OnboardingScreen = lazy(() => import('@/features/onboarding/OnboardingScreen'));
const CameraScreen = lazy(() => import('@/features/camera/CameraScreen'));
const AnalysisScreen = lazy(() => import('@/features/analysis/AnalysisScreen'));
const ResultScreen = lazy(() => import('@/features/analysis/ResultScreen'));
const HistoryScreen = lazy(() => import('@/features/history/HistoryScreen'));
const ProfileScreen = lazy(() => import('@/features/profile/ProfileScreen'));
const SettingsScreen = lazy(() => import('@/features/profile/SettingsScreen'));
const CameraSettingsScreen = lazy(() => import('@/features/profile/CameraSettingsScreen'));
const NotificationsScreen = lazy(() => import('@/features/profile/NotificationsScreen'));
const LegalScreen = lazy(() => import('@/features/profile/LegalScreen'));
const PaywallScreen = lazy(() => import('@/features/paywall/PaywallScreen'));
const SubscriptionScreen = lazy(() => import('@/features/paywall/SubscriptionScreen'));
const NotFoundScreen = lazy(() => import('@/features/misc/NotFoundScreen'));

const TAB_ROUTES = ['/', '/explore', '/favorites', '/profile', '/history'];

export function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const online = useOnlineStatus();
  const { settings, hasOnboarded } = useSettingsStore();
  useThemeEffect(settings.theme, settings.textScale, settings.reduceMotion);

  const showTabs = TAB_ROUTES.includes(location.pathname);
  if (!hasOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="app">
      {!online && <OfflineBanner />}
      <Suspense
        fallback={
          <div className="screen-loading">
            <Spinner size={28} label="Loading" />
          </div>
        }
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/" element={<HomeScreen />} />
          <Route path="/explore" element={<ExploreScreen />} />
          <Route path="/pose/:id" element={<PoseDetailScreen />} />
          <Route path="/camera" element={<CameraScreen />} />
          <Route path="/session/:id/analyze" element={<AnalysisScreen />} />
          <Route path="/session/:id" element={<ResultScreen />} />
          <Route path="/favorites" element={<FavoritesScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/settings/camera" element={<CameraSettingsScreen />} />
          <Route path="/settings/notifications" element={<NotificationsScreen />} />
          <Route path="/privacy" element={<LegalScreen doc="privacy" />} />
          <Route path="/terms" element={<LegalScreen doc="terms" />} />
          <Route path="/premium" element={<PaywallScreen />} />
          <Route path="/subscription" element={<SubscriptionScreen />} />
          <Route path="*" element={<NotFoundScreen />} />
        </Routes>
      </Suspense>
      {showTabs && <TabBar />}
      <Toasts />
    </div>
  );
}

function useThemeEffect(theme: string, textScale: number, reduceMotion: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B0B0F' : '#F6F4F1');
    };
    apply();
    root.style.setProperty('--ts', String(textScale));
    root.dataset.reduceMotion = String(reduceMotion);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [theme, textScale, reduceMotion]);
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, CameraSettings, NotificationSettings } from '@/models';
import { kvStorage } from './storage';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  haptics: true,
  reduceMotion: false,
  textScale: 1,
  analyticsEnabled: true,
  camera: {
    defaultFacing: 'user',
    showGrid: false,
    overlayOpacity: 0.7,
    defaultTimer: 3,
    mirrorFrontCamera: false,
    liveTracking: false,
    saveOriginalsToHistory: true,
  },
  notifications: { enabled: false, dailyInspiration: true, newPoses: true },
};

interface SettingsState {
  settings: AppSettings;
  hasOnboarded: boolean;
  cameraPrimed: boolean;
  update(patch: Partial<AppSettings>): void;
  updateCamera(patch: Partial<CameraSettings>): void;
  updateNotifications(patch: Partial<NotificationSettings>): void;
  completeOnboarding(): void;
  setCameraPrimed(v: boolean): void;
  reset(): void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      hasOnboarded: false,
      cameraPrimed: false,
      update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      updateCamera: (patch) => set((s) => ({ settings: { ...s.settings, camera: { ...s.settings.camera, ...patch } } })),
      updateNotifications: (patch) =>
        set((s) => ({ settings: { ...s.settings, notifications: { ...s.settings.notifications, ...patch } } })),
      completeOnboarding: () => set({ hasOnboarded: true }),
      setCameraPrimed: (v) => set({ cameraPrimed: v }),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'settings',
      storage: kvStorage,
      version: 1,
      // Deep-merge so new settings keys get defaults after app updates.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...p,
          settings: {
            ...current.settings,
            ...p.settings,
            camera: { ...current.settings.camera, ...p.settings?.camera },
            notifications: { ...current.settings.notifications, ...p.settings?.notifications },
          },
        };
      },
    },
  ),
);

import { useSettingsStore } from '@/stores/settingsStore';

/** Light haptic tap where supported (Android/Chrome). iOS web has no vibration API. */
export function haptic(pattern: number | number[] = 10) {
  if (!useSettingsStore.getState().settings.haptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

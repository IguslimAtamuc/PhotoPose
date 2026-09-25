/**
 * Notifications boundary. On iOS, web push works for Home-Screen-installed
 * web apps (iOS 16.4+) and requires a push backend (VAPID) — not part of the
 * MVP. Local permission handling is implemented; scheduling is a stub.
 */
export type NotificationPermissionLite = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationService {
  getPermission(): NotificationPermissionLite;
  requestPermission(): Promise<NotificationPermissionLite>;
  /** BACKEND HOOK: register the push subscription with your server. */
  registerForPush(): Promise<boolean>;
}

export class WebNotificationService implements NotificationService {
  getPermission(): NotificationPermissionLite {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  }
  async requestPermission(): Promise<NotificationPermissionLite> {
    if (typeof Notification === 'undefined') return 'unsupported';
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }
  async registerForPush() {
    return false;
  }
}

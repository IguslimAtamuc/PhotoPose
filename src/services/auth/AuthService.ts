import type { User } from '@/models';
import type { KeyValueStore } from '@/services/persistence/KeyValueStore';
import { uid } from '@/utils/id';

/**
 * AUTH HOOK: implement with Sign in with Apple, Firebase Auth, Supabase,
 * Clerk… The MVP uses an on-device guest profile.
 */
export interface AuthService {
  readonly id: string;
  getCurrentUser(): Promise<User>;
  updateProfile(patch: Partial<Pick<User, 'displayName' | 'avatarUrl'>>): Promise<User>;
  getToken(): Promise<string | null>;
  signOut(): Promise<User>;
}

export class LocalGuestAuthService implements AuthService {
  readonly id = 'local-guest';
  private key = 'user';
  constructor(private kv: KeyValueStore) {}

  async getCurrentUser(): Promise<User> {
    const raw = this.kv.getItem(this.key);
    if (raw) {
      try {
        return JSON.parse(raw) as User;
      } catch {
        /* recreate */
      }
    }
    const user: User = { id: uid('user'), displayName: 'Photographer', isGuest: true, createdAt: new Date().toISOString() };
    this.kv.setItem(this.key, JSON.stringify(user));
    return user;
  }

  async updateProfile(patch: Partial<Pick<User, 'displayName' | 'avatarUrl'>>) {
    const user = { ...(await this.getCurrentUser()), ...patch };
    this.kv.setItem(this.key, JSON.stringify(user));
    return user;
  }

  async getToken() {
    return null;
  }

  async signOut() {
    this.kv.removeItem(this.key);
    return this.getCurrentUser();
  }
}

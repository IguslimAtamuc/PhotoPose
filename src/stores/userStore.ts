import { create } from 'zustand';
import type { User } from '@/models';
import { getServices } from '@/services/container';

interface UserState {
  user: User | null;
  load(): Promise<void>;
  update(patch: Partial<Pick<User, 'displayName'>>): Promise<void>;
}

export const useUserStore = create<UserState>()((set) => ({
  user: null,
  load: async () => {
    const user = await getServices().auth.getCurrentUser();
    set({ user });
    getServices().analytics.identify(user.id, { guest: user.isGuest });
  },
  update: async (patch) => set({ user: await getServices().auth.updateProfile(patch) }),
}));

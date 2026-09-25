import { create } from 'zustand';
import type { Category, Pose } from '@/models';
import { getServices } from '@/services/container';

interface CatalogState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  categories: Category[];
  poses: Pose[];
  byId: Record<string, Pose>;
  load(): Promise<void>;
}

/** Pose content loaded through the PoseRepository (bundled or remote). */
export const useCatalogStore = create<CatalogState>()((set, get) => ({
  status: 'idle',
  categories: [],
  poses: [],
  byId: {},
  load: async () => {
    if (get().status === 'loading' || get().status === 'ready') return;
    set({ status: 'loading' });
    try {
      const repo = getServices().poses;
      const [categories, poses] = await Promise.all([repo.getCategories(), repo.getPoses()]);
      set({ categories, poses, byId: Object.fromEntries(poses.map((p) => [p.id, p])), status: 'ready' });
    } catch (e) {
      console.error('[catalog] load failed', e);
      set({ status: 'error' });
    }
  },
}));

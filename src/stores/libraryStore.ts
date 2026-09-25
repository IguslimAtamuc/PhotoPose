import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Favorite, RecentView } from '@/models';
import { appConfig } from '@/config/app.config';
import { kvStorage } from './storage';

interface LibraryState {
  favorites: Favorite[];
  recent: RecentView[];
  isFavorite(poseId: string): boolean;
  toggleFavorite(poseId: string): boolean;
  removeFavorite(poseId: string): void;
  markViewed(poseId: string): void;
  clearRecent(): void;
}

/** Favorites + recently viewed poses (persisted locally). */
export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recent: [],
      isFavorite: (id) => get().favorites.some((f) => f.poseId === id),
      toggleFavorite: (id) => {
        const exists = get().isFavorite(id);
        set((s) => ({
          favorites: exists ? s.favorites.filter((f) => f.poseId !== id) : [{ poseId: id, createdAt: new Date().toISOString() }, ...s.favorites],
        }));
        return !exists;
      },
      removeFavorite: (id) => set((s) => ({ favorites: s.favorites.filter((f) => f.poseId !== id) })),
      markViewed: (id) =>
        set((s) => ({
          recent: [{ poseId: id, viewedAt: new Date().toISOString() }, ...s.recent.filter((r) => r.poseId !== id)].slice(
            0,
            appConfig.storage.maxRecentViews,
          ),
        })),
      clearRecent: () => set({ recent: [] }),
    }),
    { name: 'library', storage: kvStorage, version: 1, partialize: (s) => ({ favorites: s.favorites, recent: s.recent }) },
  ),
);

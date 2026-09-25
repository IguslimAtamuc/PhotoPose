import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PhotoSession } from '@/models';
import { appConfig } from '@/config/app.config';
import { getServices } from '@/services/container';
import { idbStorage } from './storage';

interface HistoryState {
  sessions: PhotoSession[];
  hydrated: boolean;
  upsert(session: PhotoSession): void;
  patch(id: string, patch: Partial<PhotoSession>): void;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

/** Photo sessions + analysis results. Photos themselves live in PhotoStore. */
export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      hydrated: false,
      upsert: (session) => {
        const rest = get().sessions.filter((s) => s.id !== session.id);
        const next = [session, ...rest];
        // Evict oldest sessions (and their photos) beyond the cap.
        const evicted = next.slice(appConfig.storage.maxHistoryItems);
        evicted.forEach((s) => void getServices().photos.delete(s.photoId));
        set({ sessions: next.slice(0, appConfig.storage.maxHistoryItems) });
      },
      patch: (id, patch) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      remove: async (id) => {
        const session = get().sessions.find((s) => s.id === id);
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) }));
        if (session) await getServices().photos.delete(session.photoId);
      },
      clear: async () => {
        set({ sessions: [] });
        await getServices().photos.clear();
      },
    }),
    {
      name: 'history',
      storage: idbStorage,
      version: 1,
      partialize: (s) => ({ sessions: s.sessions }),
      onRehydrateStorage: () => () => useHistoryStore.setState({ hydrated: true }),
    },
  ),
);

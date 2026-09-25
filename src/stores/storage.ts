import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { createStore, get, set, del } from 'idb-keyval';
import { appConfig } from '@/config/app.config';
import { getServices } from '@/services/container';

/** Small, synchronous state (settings, favorites) → KeyValueStore (localStorage). */
export const kvStorage = createJSONStorage(() => {
  const kv = getServices().kv;
  const storage: StateStorage = {
    getItem: (k) => kv.getItem(k),
    setItem: (k, v) => kv.setItem(k, v),
    removeItem: (k) => kv.removeItem(k),
  };
  return storage;
});

/** Larger state (history with thumbnails + results) → IndexedDB. */
export const idbStorage = createJSONStorage(() => {
  if (typeof indexedDB === 'undefined') {
    const kv = getServices().kv;
    return { getItem: (k) => kv.getItem(k), setItem: (k, v) => kv.setItem(k, v), removeItem: (k) => kv.removeItem(k) } satisfies StateStorage;
  }
  const store = createStore(`${appConfig.storage.namespace}.state`, 'kv');
  const storage: StateStorage = {
    getItem: async (k) => (await get<string>(k, store)) ?? null,
    setItem: (k, v) => set(k, v, store),
    removeItem: (k) => del(k, store),
  };
  return storage;
});

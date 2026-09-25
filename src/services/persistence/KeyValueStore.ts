/**
 * Synchronous key/value persistence used for small state (settings,
 * favorites, history metadata). Swap the implementation (e.g. for
 * AsyncStorage / MMKV in a native wrapper or a synced backend) without
 * touching stores or UI.
 */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory fallback (private mode, tests, SSR). */
export class MemoryKeyValueStore implements KeyValueStore {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

/** localStorage with namespacing and graceful fallback when storage is blocked/full. */
export class LocalStorageKeyValueStore implements KeyValueStore {
  private fallback = new MemoryKeyValueStore();
  constructor(private readonly namespace: string) {}

  private k(key: string) {
    return `${this.namespace}:${key}`;
  }
  getItem(key: string) {
    try {
      return window.localStorage.getItem(this.k(key)) ?? this.fallback.getItem(key);
    } catch {
      return this.fallback.getItem(key);
    }
  }
  setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(this.k(key), value);
    } catch (e) {
      console.warn('[storage] localStorage write failed, using memory', e);
      this.fallback.setItem(key, value);
    }
  }
  removeItem(key: string) {
    try {
      window.localStorage.removeItem(this.k(key));
    } catch {
      /* ignore */
    }
    this.fallback.removeItem(key);
  }
}

export function createKeyValueStore(namespace: string): KeyValueStore {
  try {
    const probe = `${namespace}:__probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return new LocalStorageKeyValueStore(namespace);
  } catch {
    return new MemoryKeyValueStore();
  }
}

import { createStore, del, get, set, clear, type UseStore } from 'idb-keyval';

/**
 * Binary photo storage. Photos are kept out of localStorage (size limits)
 * and stored as Blobs in IndexedDB. Replace with a cloud implementation
 * (S3 / Firebase Storage / your backend) behind the same interface.
 */
export interface PhotoStore {
  save(id: string, blob: Blob): Promise<void>;
  get(id: string): Promise<Blob | undefined>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export class IndexedDbPhotoStore implements PhotoStore {
  private store: UseStore;
  constructor(dbName: string) {
    this.store = createStore(dbName, 'photos');
  }
  save(id: string, blob: Blob) {
    return set(id, blob, this.store);
  }
  get(id: string) {
    return get<Blob>(id, this.store);
  }
  delete(id: string) {
    return del(id, this.store);
  }
  clear() {
    return clear(this.store);
  }
}

export class MemoryPhotoStore implements PhotoStore {
  private map = new Map<string, Blob>();
  async save(id: string, blob: Blob) {
    this.map.set(id, blob);
  }
  async get(id: string) {
    return this.map.get(id);
  }
  async delete(id: string) {
    this.map.delete(id);
  }
  async clear() {
    this.map.clear();
  }
}

export function createPhotoStore(dbName: string): PhotoStore {
  return typeof indexedDB !== 'undefined' ? new IndexedDbPhotoStore(dbName) : new MemoryPhotoStore();
}

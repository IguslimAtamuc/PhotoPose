import type { Category, Pose } from '@/models';
import { CATEGORIES } from '@/data/categories';
import { POSES } from '@/data/poses';
import type { ApiClient } from './ApiClient';

/**
 * Source of pose content. The bundled implementation ships with the app;
 * `RemotePoseRepository` loads content from your backend/CMS and falls back
 * to bundled content when offline.
 */
export interface PoseRepository {
  getCategories(): Promise<Category[]>;
  getPoses(): Promise<Pose[]>;
}

export class BundledPoseRepository implements PoseRepository {
  async getCategories() {
    return [...CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async getPoses() {
    return POSES;
  }
}

/**
 * BACKEND HOOK: expects `GET /categories` → Category[] and `GET /poses` → Pose[]
 * (same JSON shape as the models; `figures` are normalized skeletons).
 */
export class RemotePoseRepository implements PoseRepository {
  constructor(private api: ApiClient, private fallback: PoseRepository = new BundledPoseRepository()) {}

  async getCategories() {
    try {
      return await this.api.request<Category[]>('/categories');
    } catch (e) {
      console.warn('[poses] remote categories failed, using bundled', e);
      return this.fallback.getCategories();
    }
  }
  async getPoses() {
    try {
      return await this.api.request<Pose[]>('/poses');
    } catch (e) {
      console.warn('[poses] remote poses failed, using bundled', e);
      return this.fallback.getPoses();
    }
  }
}

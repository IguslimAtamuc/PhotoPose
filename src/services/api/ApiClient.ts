/**
 * Minimal HTTP client for the (future) PhotoPose backend.
 * All network code goes through here so auth headers, retries and error
 * mapping live in one place.
 */
export type ApiErrorCode = 'network' | 'timeout' | 'http' | 'not_configured' | 'invalid_response';

export class ApiError extends Error {
  constructor(public code: ApiErrorCode, message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** Returns an auth token when an auth provider is connected. */
  getToken?: () => Promise<string | null>;
}

export class ApiClient {
  constructor(private opts: ApiClientOptions) {}

  get isConfigured() {
    return Boolean(this.opts.baseUrl);
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.isConfigured) throw new ApiError('not_configured', 'API base URL is not configured');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new ApiError('network', 'You appear to be offline');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs);
    const headers = new Headers(init.headers);
    const token = await this.opts.getToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    try {
      const res = await fetch(`${this.opts.baseUrl.replace(/\/$/, '')}${path}`, { ...init, headers, signal: controller.signal });
      if (!res.ok) throw new ApiError('http', `Request failed (${res.status})`, res.status);
      try {
        return (await res.json()) as T;
      } catch {
        throw new ApiError('invalid_response', 'Invalid server response');
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if ((e as Error).name === 'AbortError') throw new ApiError('timeout', 'The request timed out');
      throw new ApiError('network', 'Network request failed');
    } finally {
      clearTimeout(timer);
    }
  }
}

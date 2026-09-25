/**
 * Saving & sharing photos. On iOS the Web Share sheet offers "Save Image"
 * (to Photos), AirDrop, Messages, Instagram… A native wrapper can implement
 * this with the Photos framework / share extension.
 */
export type ShareOutcome = 'shared' | 'saved' | 'downloaded' | 'cancelled';

export class ShareError extends Error {
  constructor(public code: 'not_supported' | 'permission_denied' | 'failed', message: string) {
    super(message);
    this.name = 'ShareError';
  }
}

export interface ShareService {
  canShareFiles(): boolean;
  sharePhoto(blob: Blob, opts: { title: string; text?: string; filename: string }): Promise<ShareOutcome>;
  savePhoto(blob: Blob, filename: string): Promise<ShareOutcome>;
}

export class WebShareService implements ShareService {
  canShareFiles() {
    try {
      const f = new File([new Blob()], 'x.jpg', { type: 'image/jpeg' });
      return typeof navigator.canShare === 'function' && navigator.canShare({ files: [f] });
    } catch {
      return false;
    }
  }

  async sharePhoto(blob: Blob, { title, text, filename }: { title: string; text?: string; filename: string }) {
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
    if (this.canShareFiles()) {
      try {
        await navigator.share({ files: [file], title, text });
        return 'shared' as const;
      } catch (e) {
        return handleShareError(e);
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return 'shared' as const;
      } catch (e) {
        return handleShareError(e);
      }
    }
    return this.download(blob, filename);
  }

  async savePhoto(blob: Blob, filename: string) {
    // iOS: the only way for a web app to write to Photos is the share sheet ("Save Image").
    if (this.canShareFiles() && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      try {
        await navigator.share({ files: [file] });
        return 'saved' as const;
      } catch (e) {
        return handleShareError(e);
      }
    }
    return this.download(blob, filename);
  }

  private download(blob: Blob, filename: string): ShareOutcome {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return 'downloaded';
    } catch {
      throw new ShareError('failed', 'The photo could not be saved.');
    }
  }
}

function handleShareError(e: unknown): ShareOutcome {
  const name = (e as DOMException)?.name;
  if (name === 'AbortError') return 'cancelled';
  if (name === 'NotAllowedError') throw new ShareError('permission_denied', 'Photo access was not allowed.');
  throw new ShareError('failed', 'Sharing failed. Please try again.');
}

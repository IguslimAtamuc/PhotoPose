import { useEffect, useState } from 'react';
import { getServices } from '@/services/container';

/** Object URL for a stored photo; revoked automatically on unmount. */
export function usePhotoUrl(photoId: string | undefined) {
  const [state, setState] = useState<{ url: string | null; missing: boolean }>({ url: null, missing: false });
  useEffect(() => {
    if (!photoId) return;
    let url: string | null = null;
    let alive = true;
    getServices()
      .photos.get(photoId)
      .then((blob) => {
        if (!alive) return;
        if (!blob) return setState({ url: null, missing: true });
        url = URL.createObjectURL(blob);
        setState({ url, missing: false });
      })
      .catch(() => alive && setState({ url: null, missing: true }));
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [photoId]);
  return state;
}

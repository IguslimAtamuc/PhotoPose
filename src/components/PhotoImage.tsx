import type { ReactNode } from 'react';
import { usePhotoUrl } from '@/hooks/usePhotoUrl';

/** Shows a stored photo (IndexedDB) with its thumbnail as instant placeholder. */
export function PhotoImage({ photoId, thumbnail, alt, className = '', children }: { photoId: string; thumbnail?: string; alt: string; className?: string; children?: ReactNode }) {
  const { url, missing } = usePhotoUrl(photoId);
  const src = url ?? thumbnail;
  return (
    <div className={`photo-image ${className}`}>
      {src ? <img src={src} alt={alt} decoding="async" /> : <div className="photo-image__empty">{missing ? 'Photo unavailable' : ''}</div>}
      {children}
    </div>
  );
}

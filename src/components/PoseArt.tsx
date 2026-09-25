import { memo, useState } from 'react';
import type { Pose } from '@/models';
import { useCatalogStore } from '@/stores/catalogStore';
import { PoseFigure } from './PoseFigure';

interface Props {
  pose: Pose;
  className?: string;
  /** Adds the decorative backdrop (light, horizon). */
  rich?: boolean;
}

/**
 * Visual for a pose: its photo when `imageUrl` is set (lazy-loaded), otherwise
 * an illustrated figure on the category's gradient.
 */
function PoseArtImpl({ pose, className = '', rich = true }: Props) {
  const category = useCatalogStore((s) => s.categories.find((c) => c.id === pose.categoryIds[0]));
  const [imgFailed, setImgFailed] = useState(false);
  const [a, b] = category?.gradient ?? ['#2A2A35', '#6B6B7A'];
  const showImage = pose.imageUrl && !imgFailed;
  return (
    <div className={`pose-art ${className}`} style={{ ['--ga' as string]: a, ['--gb' as string]: b }}>
      {showImage ? (
        <img src={pose.imageUrl} alt="" loading="lazy" decoding="async" onError={() => setImgFailed(true)} />
      ) : (
        <>
          {rich && <div className="pose-art__light" aria-hidden />}
          {rich && pose.framing === 'full' && <div className="pose-art__floor" aria-hidden />}
          <PoseFigure figures={pose.figures} className="pose-art__figure" color="var(--figure)" colorEnd="var(--figure-end)" />
        </>
      )}
    </div>
  );
}

export const PoseArt = memo(PoseArtImpl);

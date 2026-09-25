import { useCallback } from 'react';
import type { Pose } from '@/models';
import { getServices } from '@/services/container';
import { useLibraryStore } from '@/stores/libraryStore';
import { toast } from '@/stores/toastStore';
import { haptic } from '@/utils/haptics';

export function useFavoriteToggle() {
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  return useCallback(
    (pose: Pose) => {
      const added = toggleFavorite(pose.id);
      haptic();
      getServices().analytics.track(added ? 'pose_saved' : 'pose_unsaved', { poseId: pose.id });
      toast(added ? 'Saved to Favorites' : 'Removed from Favorites', added ? 'success' : 'info');
    },
    [toggleFavorite],
  );
}

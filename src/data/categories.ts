import type { Category } from '@/models';

/**
 * Initial categories. Add a new category by appending an entry here (or by
 * returning it from a remote PoseRepository) — no UI changes are needed.
 * `icon` must be a key of the icon map in components/CategoryIcon.tsx.
 */
export const CATEGORIES: Category[] = [
  { id: 'portrait', name: 'Portrait', description: 'Face-forward shots that flatter.', icon: 'user', gradient: ['#3A2A4F', '#B85C74'], sortOrder: 1 },
  { id: 'couple', name: 'Couple', description: 'Natural chemistry for two.', icon: 'heart', gradient: ['#4A1F2E', '#E0736A'], sortOrder: 2 },
  { id: 'fashion', name: 'Fashion', description: 'Editorial, confident, bold.', icon: 'sparkles', gradient: ['#1E2A44', '#8C6DE0'], sortOrder: 3 },
  { id: 'fitness', name: 'Fitness', description: 'Show strength and shape.', icon: 'dumbbell', gradient: ['#15332E', '#3CB48C'], sortOrder: 4 },
  { id: 'travel', name: 'Travel', description: 'You + the view.', icon: 'plane', gradient: ['#123047', '#44A3D6'], sortOrder: 5 },
  { id: 'wedding', name: 'Wedding', description: 'Timeless and romantic.', icon: 'gem', gradient: ['#3D3530', '#D9B38C'], isPremium: true, sortOrder: 6 },
  { id: 'street', name: 'Street', description: 'Candid city energy.', icon: 'building', gradient: ['#222226', '#8A8F98'], sortOrder: 7 },
  { id: 'sitting', name: 'Sitting', description: 'Relaxed seated poses.', icon: 'armchair', gradient: ['#2F2A1C', '#C7A04A'], sortOrder: 8 },
  { id: 'standing', name: 'Standing', description: 'Classic standing stances.', icon: 'person-standing', gradient: ['#1F2B3A', '#6E8DB8'], sortOrder: 9 },
  { id: 'full-body', name: 'Full Body', description: 'Head-to-toe compositions.', icon: 'scan', gradient: ['#2B1D3A', '#C46FD1'], sortOrder: 10 },
  { id: 'selfie', name: 'Selfie', description: 'Arm’s-length angles that work.', icon: 'smartphone', gradient: ['#3A2218', '#F08A4B'], sortOrder: 11 },
  { id: 'group', name: 'Group', description: 'Everyone in, everyone looks good.', icon: 'users', gradient: ['#1A2F2A', '#7FC4A6'], sortOrder: 12 },
];

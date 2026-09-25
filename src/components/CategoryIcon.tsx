import {
  Armchair,
  Building2,
  Dumbbell,
  Gem,
  Heart,
  PersonStanding,
  Plane,
  Scan,
  Smartphone,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** Maps Category.icon keys to icons. Unknown keys fall back to Sparkles. */
const ICONS: Record<string, LucideIcon> = {
  user: User,
  heart: Heart,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  plane: Plane,
  gem: Gem,
  building: Building2,
  armchair: Armchair,
  'person-standing': PersonStanding,
  scan: Scan,
  smartphone: Smartphone,
  users: Users,
};

export function CategoryIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon size={size} aria-hidden />;
}

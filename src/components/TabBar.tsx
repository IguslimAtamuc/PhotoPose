import { NavLink, useNavigate } from 'react-router-dom';
import { Camera, Compass, Heart, House, User } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/camera', label: 'Camera', icon: Camera, primary: true },
  { to: '/favorites', label: 'Favorites', icon: Heart },
  { to: '/profile', label: 'Profile', icon: User },
];

export function TabBar() {
  const navigate = useNavigate();
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) =>
        t.primary ? (
          <button key={t.to} className="tabbar__camera" aria-label="Open camera" onClick={() => navigate('/camera')}>
            <t.icon size={26} strokeWidth={2.2} />
          </button>
        ) : (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tabbar__item ${isActive ? 'is-active' : ''}`}>
            <t.icon size={23} strokeWidth={2} aria-hidden />
            <span>{t.label}</span>
          </NavLink>
        ),
      )}
    </nav>
  );
}

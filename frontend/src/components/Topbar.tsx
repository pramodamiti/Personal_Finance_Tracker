import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { MotionButton } from './MotionButton';
import type { NavItem } from './Navbar';
import { useThemeStore } from '../store/themeStore';

type TopbarProps = {
  items: NavItem[];
  user?: {
    displayName?: string;
    email?: string;
  } | null;
  onLogout: () => void;
};

export function Topbar({ items, user, onLogout }: TopbarProps) {
  const displayName = user?.displayName || 'User';
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-brand-mark">P</span>
        <span className="topbar-brand-text">Personal Finance Tracker</span>
      </div>
      <nav className="topbar-nav">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'topbar-link',
                isActive
                  ? 'topbar-link-active'
                  : 'topbar-link-idle'
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="topbar-actions">
        <div className="topbar-user">
          <button
            type="button"
            className="topbar-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 3v2.5" />
                <path d="M12 18.5V21" />
                <path d="M4.5 4.5l1.8 1.8" />
                <path d="M17.7 17.7l1.8 1.8" />
                <path d="M3 12h2.5" />
                <path d="M18.5 12H21" />
                <path d="M4.5 19.5l1.8-1.8" />
                <path d="M17.7 6.3l1.8-1.8" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M21 14.5a8.5 8.5 0 1 1-10.5-10.5 7 7 0 0 0 10.5 10.5z" />
              </svg>
            )}
          </button>
          <div className="topbar-user-text">
            <div className="topbar-user-name">{displayName}</div>
            <div className="topbar-user-email">{user?.email || ''}</div>
          </div>
        </div>
        <MotionButton type="button" variant="secondary" className="topbar-logout" onClick={onLogout}>
          Logout
        </MotionButton>
      </div>
    </header>
  );
}

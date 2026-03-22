import clsx from 'clsx';
import { NavLink } from 'react-router-dom';

export type NavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
};

type NavbarProps = {
  items: NavItem[];
  user?: {
    displayName?: string;
    email?: string;
  } | null;
  onLogout: () => void;
};

type IconProps = {
  className?: string;
};

function DashboardIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 13.5L12 5l8 8.5" />
      <path d="M6.5 11.5V20h11v-8.5" />
    </svg>
  );
}

function WalletIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5z" />
      <path d="M4 8h13.5A2.5 2.5 0 0 1 20 10.5v1.5h-4.5a1.5 1.5 0 0 0 0 3H20" />
      <circle cx="15.5" cy="13.5" r=".75" fill="currentColor" />
    </svg>
  );
}

function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 19.5h16" />
      <path d="M7 16V10" />
      <path d="M12 16V6" />
      <path d="M17 16v-4" />
    </svg>
  );
}

function SparkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18.5 3.5l.7 1.8L21 6l-1.8.7-.7 1.8-.7-1.8L16 6l1.8-.7z" />
    </svg>
  );
}

function RulesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M7.5 6.5h9" />
      <path d="M7.5 12h9" />
      <path d="M7.5 17.5h9" />
      <circle cx="5" cy="6.5" r=".75" fill="currentColor" />
      <circle cx="5" cy="12" r=".75" fill="currentColor" />
      <circle cx="5" cy="17.5" r=".75" fill="currentColor" />
    </svg>
  );
}

function RepeatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M7 7h9a4 4 0 0 1 0 8H8" />
      <path d="M10 5L7 7l3 2" />
      <path d="M14 19l3-2-3-2" />
    </svg>
  );
}

function VaultIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="4" y="4.5" width="16" height="15" rx="2.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 9.5v5" />
      <path d="M9.5 12H14.5" />
    </svg>
  );
}

function TargetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v3" />
      <path d="M12 18.5v3" />
      <path d="M2.5 12h3" />
      <path d="M18.5 12h3" />
    </svg>
  );
}

function SettingsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 8.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5z" />
      <path d="M19 12a7.5 7.5 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-1.8-1L14.3 3h-4.6l-.4 3a7.8 7.8 0 0 0-1.8 1l-2.4-1-2 3.5 2 1.5a7.5 7.5 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 1.8 1l.4 3h4.6l.4-3a7.8 7.8 0 0 0 1.8-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z" />
    </svg>
  );
}

function navIcon(href: string, className?: string) {
  switch (href) {
    case '/':
      return <DashboardIcon className={className} />;
    case '/transactions':
      return <WalletIcon className={className} />;
    case '/budgets':
      return <VaultIcon className={className} />;
    case '/goals':
      return <TargetIcon className={className} />;
    case '/reports':
      return <ChartIcon className={className} />;
    case '/insights':
      return <SparkIcon className={className} />;
    case '/rules':
      return <RulesIcon className={className} />;
    case '/recurring':
      return <RepeatIcon className={className} />;
    case '/accounts':
      return <WalletIcon className={className} />;
    case '/settings':
      return <SettingsIcon className={className} />;
    default:
      return <DashboardIcon className={className} />;
  }
}

export function Navbar({ items, user, onLogout }: NavbarProps) {
  return (
    <>
      <aside className="hidden lg:block">
        <div className="sidebar-shell">
          <div className="surface sidebar-panel">
            <div>
              <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-slate-100">
                Personal Finance
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Your money, organized clearly.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Track balances, budgets, insights, and forecasts in a layout that stays easy to use on every screen size.
              </p>
            </div>

            <nav className="mt-8 grid gap-2">
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    clsx(
                      'group flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 ease-in-out',
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                    )
                  }
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 text-current dark:bg-white/10">
                    {navIcon(item.href, 'h-5 w-5')}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/70">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                Signed In
              </div>
              <div className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">{user?.displayName || 'User'}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</div>
              <button type="button" className="btn-secondary mt-4 w-full" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="floating-nav no-scrollbar lg:hidden">
        <nav className="no-scrollbar flex min-w-max items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-[44px] min-w-[78px] flex-col items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-semibold transition-all duration-300 ease-in-out',
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
                )
              }
            >
              {navIcon(item.href, 'h-5 w-5')}
              <span className="mt-1 whitespace-nowrap">{item.mobileLabel || item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}

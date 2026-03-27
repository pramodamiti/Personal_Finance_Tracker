import clsx from 'clsx';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { MotionButton } from './MotionButton';

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
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
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

function CollapseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function Navbar({ items, user, onLogout, isCollapsed = false, onToggleCollapse }: NavbarProps) {
  return (
    <>
      <aside className="hidden lg:block">
        <div className="sidebar-shell">
          <div className={clsx('surface sidebar-panel', isCollapsed && 'sidebar-panel-collapsed')}>
            <div>
              <div className={clsx('flex items-start gap-3', isCollapsed ? 'justify-center' : 'justify-between')}>
                {isCollapsed ? null : (
                  <div className="dashboard-pill">
                    Personal Finance OS
                  </div>
                )}
                <button
                  type="button"
                  className={clsx('sidebar-collapse-button', isCollapsed && 'is-collapsed')}
                  onClick={onToggleCollapse}
                  aria-label={isCollapsed ? 'Expand menu' : 'Collapse menu'}
                >
                  <CollapseIcon className="h-4 w-4" />
                </button>
              </div>
              {isCollapsed ? null : (
                <>
                  <h1 className="mt-5 text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 dark:text-white">
                    Command your cash flow with calm, not clutter.
                  </h1>
                  <p className="mt-4 text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                    A sharper daily workspace for balances, budgets, reporting, and the decisions behind them.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="signal-chip">Forecast</span>
                    <span className="signal-chip">Controls</span>
                    <span className="signal-chip">Insights</span>
                  </div>
                </>
              )}
            </div>

            <nav className="mt-2 grid gap-2">
              {items.map((item) => (
                <motion.div key={item.href} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      clsx(
                        'group flex min-h-[56px] transform-gpu will-change-transform items-center gap-3 rounded-[22px] px-4 py-3 text-[15px] font-semibold transition-all duration-500 ease-in-out',
                        isCollapsed && 'justify-center px-3',
                        isActive
                          ? 'bg-gradient-to-r from-primary to-blue-700 text-white shadow-lg shadow-primary/20'
                          : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                      )
                    }
                    title={item.label}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-black/5 text-current dark:bg-white/10">
                      {navIcon(item.href, 'h-5 w-5')}
                    </span>
                    {isCollapsed ? null : <span>{item.label}</span>}
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            {isCollapsed ? (
              <div className="mt-auto flex flex-col items-center gap-3 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/70">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-700 text-base font-semibold text-white">
                  {(user?.displayName || 'U').slice(0, 1).toUpperCase()}
                </div>
                <MotionButton type="button" variant="secondary" className="w-full px-0" onClick={onLogout}>
                  Out
                </MotionButton>
              </div>
            ) : (
              <div className="mt-auto rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/70">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                  Signed In
                </div>
                <div className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">{user?.displayName || 'User'}</div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user?.email}</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="mini-stat p-3">
                    <div className="hero-metric-label">Workspace</div>
                    <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">Production</div>
                  </div>
                  <div className="mini-stat p-3">
                    <div className="hero-metric-label">Mode</div>
                    <div className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">Focused</div>
                  </div>
                </div>
                <MotionButton type="button" variant="secondary" className="mt-4 w-full" onClick={onLogout}>
                  Logout
                </MotionButton>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="floating-nav no-scrollbar lg:hidden">
        <nav className="no-scrollbar flex min-w-max items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <motion.div key={item.href} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex min-h-[44px] min-w-[78px] transform-gpu will-change-transform flex-col items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-semibold transition-all duration-500 ease-in-out',
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
                  )
                }
              >
                {navIcon(item.href, 'h-5 w-5')}
                <span className="mt-1 whitespace-nowrap">{item.mobileLabel || item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>
      </div>
    </>
  );
}

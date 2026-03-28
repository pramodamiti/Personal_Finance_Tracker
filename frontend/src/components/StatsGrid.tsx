import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { FinanceCard } from './FinanceCard';

export type StatCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone?: 'primary' | 'accent' | 'income' | 'expense';
  span?: 'standard' | 'wide';
};

type StatsGridProps = {
  items: StatCard[];
};

const toneClasses: Record<NonNullable<StatCard['tone']>, string> = {
  primary:
    'from-primary/10 to-primary/5 text-primary dark:from-primary/20 dark:to-primary/10 dark:text-blue-200',
  accent:
    'from-accent/10 to-accent/5 text-accent dark:from-accent/20 dark:to-accent/10 dark:text-emerald-200',
  income:
    'from-income/10 to-income/5 text-income dark:from-income/20 dark:to-income/10 dark:text-emerald-200',
  expense:
    'from-expense/10 to-expense/5 text-expense dark:from-expense/20 dark:to-expense/10 dark:text-red-200'
};

export function StatsGrid({ items }: StatsGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className="stats-grid transition-all duration-500 ease-in-out"
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08
          }
        }
      }}
    >
      {items.map((item) => {
        const tone = item.tone || 'primary';
        return (
          <FinanceCard
            key={item.id}
            className={clsx('stats-card relative min-h-[162px] overflow-hidden rounded-[28px] p-6', item.span === 'wide' && 'stats-card-wide')}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 100,
                    damping: 20
                  }
                }
              }}
            >
              <div className={clsx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', toneClasses[tone])} />
              <div
                className={clsx(
                  'absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br opacity-45 blur-2xl',
                  toneClasses[tone]
                )}
              />
              <div className="relative min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div className="mt-5 min-w-0 text-[clamp(2rem,4vw,2.45rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-slate-950 dark:text-white">
                  {item.value}
                </div>
                <p className="mt-4 max-w-[28ch] text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {item.hint}
                </p>
              </div>
            </motion.div>
          </FinanceCard>
        );
      })}
    </motion.section>
  );
}

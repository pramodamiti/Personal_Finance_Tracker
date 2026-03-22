import clsx from 'clsx';

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
  return (
    <section className="dashboard-grid grid grid-cols-1 gap-4 transition-all duration-300 ease-in-out md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => {
        const tone = item.tone || 'primary';
        return (
          <article
            key={item.id}
            className={clsx(
              'surface relative overflow-hidden rounded-[24px] p-5 transition-all duration-300 ease-in-out',
              'min-h-[140px]',
              item.span === 'wide' && 'md:col-span-2 2xl:col-span-2'
            )}
          >
            <div className={clsx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', toneClasses[tone])} />
            <div
              className={clsx(
                'absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br opacity-45 blur-2xl',
                toneClasses[tone]
              )}
            />
            <div className="relative">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                {item.label}
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                {item.value}
              </div>
              <p className="mt-3 max-w-[24ch] text-sm leading-6 text-slate-600 dark:text-slate-300">
                {item.hint}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

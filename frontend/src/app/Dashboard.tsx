import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import { FinanceCard } from '../components/FinanceCard';
import { StatsGrid, type StatCard } from '../components/StatsGrid';
import { ErrorBanner } from '../components/ErrorBanner';
import { extractErrorMessage, formatCurrency } from '../utils/ui';

const fetcher = (url: string) => api.get(url).then((response) => response.data);

function formatPercent(value: unknown) {
  const amount = Number(value ?? 0);
  return `${Number.isFinite(amount) ? amount.toFixed(0) : '0'}%`;
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

function SectionMessage({ message }: { message: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
      {message}
    </div>
  );
}

export function Dashboard() {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const prefersReducedMotion = useReducedMotion();
  const summary = useQuery({ queryKey: ['summary'], queryFn: () => fetcher('/dashboard/summary') });
  const spending = useQuery({ queryKey: ['spending'], queryFn: () => fetcher('/dashboard/spending-by-category') });
  const trend = useQuery({ queryKey: ['trend'], queryFn: () => fetcher('/dashboard/income-vs-expense-trend') });
  const goals = useQuery({ queryKey: ['goals'], queryFn: () => fetcher('/dashboard/goals-overview') });
  const budgets = useQuery({ queryKey: ['budgets'], queryFn: () => fetcher('/dashboard/budget-overview') });
  const forecastMonth = useQuery({ queryKey: ['forecast-month'], queryFn: () => fetcher('/dashboard/forecast-month') });
  const forecastDaily = useQuery({ queryKey: ['forecast-daily'], queryFn: () => fetcher('/dashboard/forecast-daily') });
  const healthScore = useQuery({ queryKey: ['health-score'], queryFn: () => fetcher('/dashboard/health-score') });
  const insights = useQuery({ queryKey: ['dashboard-insights'], queryFn: () => fetcher('/dashboard/insights') });
  const recentTransactions = useQuery({ queryKey: ['recent-transactions'], queryFn: () => fetcher('/dashboard/recent-transactions') });
  const dashboardErrorMessage =
    extractErrorMessage(summary.error) ||
    extractErrorMessage(spending.error) ||
    extractErrorMessage(trend.error) ||
    extractErrorMessage(goals.error) ||
    extractErrorMessage(budgets.error) ||
    extractErrorMessage(forecastMonth.error) ||
    extractErrorMessage(forecastDaily.error) ||
    extractErrorMessage(healthScore.error) ||
    extractErrorMessage(insights.error) ||
    extractErrorMessage(recentTransactions.error);

  const statCards: StatCard[] = [
    {
      id: 'balances',
      label: 'Total Balance',
      value: summary.isError ? 'Unavailable' : formatCurrency(summary.data?.totalBalances),
      hint: 'Live value across all active accounts.',
      tone: 'primary',
      span: 'wide'
    },
    {
      id: 'safe-to-spend',
      label: 'Safe To Spend',
      value: forecastMonth.isError ? 'Unavailable' : formatCurrency(forecastMonth.data?.safeToSpend),
      hint: 'Projected cash buffer before month end.',
      tone: 'accent'
    },
    {
      id: 'income',
      label: 'Income',
      value: summary.isError ? 'Unavailable' : formatCurrency(summary.data?.income),
      hint: 'Recognized inflow this month.',
      tone: 'income'
    },
    {
      id: 'expense',
      label: 'Expense',
      value: summary.isError ? 'Unavailable' : formatCurrency(summary.data?.expense),
      hint: 'Current month outflow across categories.',
      tone: 'expense'
    },
    {
      id: 'health',
      label: 'Health Score',
      value: healthScore.isError ? 'Unavailable' : String(healthScore.data?.score ?? 0),
      hint: 'Weighted score from savings, stability, and cash buffer.',
      tone: 'accent'
    }
  ];

  const piePalette = ['#1E3A8A', '#10B981', '#16A34A', '#DC2626', '#0EA5E9', '#F59E0B'];
  const showExtendedPanels = viewMode === 'detailed';
  const staggerItem = {
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
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {dashboardErrorMessage ? <ErrorBanner message={dashboardErrorMessage} /> : null}

      <motion.section
        className="surface relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-5 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60 sm:p-6"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary/10 to-transparent lg:block" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-blue-100">
              Decision Dashboard
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-3xl">
              A clearer view of your money, from phone to desktop.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Track cash flow, review spending, and spot risk early with a cleaner day-to-day finance workspace.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="col-span-full flex justify-start sm:justify-end">
              <div className="relative inline-flex rounded-full border border-white/70 bg-white/75 p-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
                {(['summary', 'detailed'] as const).map((mode) => (
                  <motion.button
                    key={mode}
                    type="button"
                    className="relative min-w-[132px] transform-gpu rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-500 ease-in-out will-change-transform dark:text-slate-200"
                    onClick={() => setViewMode(mode)}
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.02, y: -4 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  >
                    {viewMode === mode ? (
                      <motion.span
                        layoutId="dashboard-view-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-blue-700"
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      />
                    ) : null}
                    <span className={`relative z-10 ${viewMode === mode ? 'text-white' : ''}`}>
                      {mode === 'summary' ? 'Summary View' : 'Detailed View'}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
            <motion.div layoutId="dashboard-summary-month-end" className="rounded-[24px] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Projected Month End
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {forecastMonth.isError ? 'Unavailable' : formatCurrency(forecastMonth.data?.projectedEndBalance)}
              </div>
            </motion.div>
            <motion.div layoutId="dashboard-summary-score" className="rounded-[24px] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Score Snapshot
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {healthScore.isError ? 'Unavailable' : `${String(healthScore.data?.score ?? 0)} / 100`}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <StatsGrid items={statCards} />

      <motion.section
        className="dashboard-grid grid grid-cols-1 gap-4 transition-all duration-500 ease-in-out md:grid-cols-2 2xl:grid-cols-4"
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
        <motion.div variants={staggerItem} className="md:col-span-2 2xl:col-span-2">
          <FinanceCard className="h-full">
          <SectionTitle title="Projected Balance" description="Daily forecast from today through month end" />
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] bg-primary/5 px-4 py-3 dark:bg-primary/15">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Safe To Spend</div>
              <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{forecastMonth.isError ? 'Unavailable' : formatCurrency(forecastMonth.data?.safeToSpend)}</div>
            </div>
            <div className="rounded-[22px] bg-accent/5 px-4 py-3 dark:bg-accent/15">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Expected Income</div>
              <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{forecastMonth.isError ? 'Unavailable' : formatCurrency(forecastMonth.data?.expectedIncome)}</div>
            </div>
            <div className="rounded-[22px] bg-expense/5 px-4 py-3 dark:bg-expense/15">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Expected Expense</div>
              <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{forecastMonth.isError ? 'Unavailable' : formatCurrency(forecastMonth.data?.expectedExpenses)}</div>
            </div>
          </div>
          <div className="h-72 w-full">
            {forecastDaily.isError ? (
              <SectionMessage message="Forecast data is unavailable right now." />
            ) : (forecastDaily.data || []).length ? (
              <ResponsiveContainer>
                <LineChart data={forecastDaily.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="projectedBalance" stroke="#1E3A8A" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <SectionMessage message="Add more transactions to generate a daily forecast." />
            )}
          </div>
          </FinanceCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <FinanceCard className="h-full">
          <SectionTitle title="Forecast Signals" description="Upcoming expenses and warnings" />
          <div className="space-y-3">
            {forecastMonth.isError ? (
              <SectionMessage message="Forecast signals are unavailable right now." />
            ) : (forecastMonth.data?.warnings || []).length ? (
              (forecastMonth.data?.warnings || []).map((warning: string) => (
                <div key={warning} className="rounded-[20px] border border-expense/20 bg-expense/5 px-4 py-3 text-sm text-expense dark:border-expense/30 dark:bg-expense/10 dark:text-red-200">
                  {warning}
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent dark:border-accent/30 dark:bg-accent/10 dark:text-emerald-200">
                No immediate risk warnings detected.
              </div>
            )}
            <div className="space-y-2 list-fade-mask">
              {forecastMonth.isError ? null : (forecastMonth.data?.upcomingExpenses || []).length ? (
                (forecastMonth.data?.upcomingExpenses || []).slice(0, 5).map((expense: any) => (
                  <div key={`${expense.date}-${expense.title}`} className="rounded-[20px] bg-slate-100/80 px-4 py-3 dark:bg-slate-800/80">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-950 dark:text-white">{expense.title}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{expense.date}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-950 dark:text-white">{formatCurrency(expense.amount)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <SectionMessage message="No upcoming recurring expenses found." />
              )}
            </div>
          </div>
          </FinanceCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <FinanceCard className="h-full">
          <SectionTitle title="Financial Health" description="Weighted factor breakdown" />
          <div className="space-y-4">
            {healthScore.isError ? (
              <SectionMessage message="Health score details are unavailable right now." />
            ) : (healthScore.data?.factors || []).length ? (
              (healthScore.data?.factors || []).map((factor: any) => (
                <div key={factor.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200">{factor.name}</span>
                    <span className="font-semibold text-slate-950 dark:text-white">{factor.score}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded-full bg-gradient-to-r from-primary via-accent to-income" style={{ width: `${factor.score}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <SectionMessage message="No health score details are available yet." />
            )}
          </div>
          </FinanceCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <FinanceCard className="h-full">
          <SectionTitle title="Spending Analytics" description="Category concentration this month" />
          <div className="h-72 w-full">
            {spending.isError ? (
              <SectionMessage message="Spending analytics are unavailable right now." />
            ) : (spending.data || []).length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={spending.data || []} dataKey="amount" nameKey="category" outerRadius={92}>
                    {(spending.data || []).map((_: unknown, index: number) => (
                      <Cell key={index} fill={piePalette[index % piePalette.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <SectionMessage message="No spending data is available for this period." />
            )}
          </div>
          </FinanceCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <FinanceCard className="h-full">
          <SectionTitle title="Income vs Expense" description="Desktop-friendly side-by-side chart view" />
          <div className="h-72 w-full">
            {trend.isError ? (
              <SectionMessage message="Income and expense trends are unavailable right now." />
            ) : (trend.data || []).length ? (
              <ResponsiveContainer>
                <BarChart data={trend.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="income" fill="#16A34A" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="expense" fill="#DC2626" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <SectionMessage message="No trend data is available for this period." />
            )}
          </div>
          </FinanceCard>
        </motion.div>

        <motion.div variants={staggerItem} className="md:col-span-2 2xl:col-span-2">
          <FinanceCard className="h-full">
          <SectionTitle title="Recent Transactions" description="Single-column list on mobile, denser table on larger screens" />
          {recentTransactions.isError ? (
            <SectionMessage message="Recent transactions are unavailable right now." />
          ) : (
            <>
              <div className="space-y-3 list-fade-mask md:hidden">
                {(recentTransactions.data || []).map((transaction: any) => (
                  <div key={transaction.id} className="rounded-[22px] bg-slate-100/80 px-4 py-4 dark:bg-slate-800/80">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-950 dark:text-white">{transaction.merchant || transaction.note || transaction.type}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{transaction.transactionDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-950 dark:text-white">{formatCurrency(transaction.amount)}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{transaction.type}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden list-fade-mask md:block">
                <table className="data-table w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="py-2">Merchant</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recentTransactions.data || []).map((transaction: any) => (
                      <tr key={transaction.id}>
                        <td className="py-3">{transaction.merchant || transaction.note || '--'}</td>
                        <td className="py-3">{transaction.type}</td>
                        <td className="py-3">{transaction.transactionDate}</td>
                        <td className="py-3">{formatCurrency(transaction.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(recentTransactions.data || []).length ? null : <SectionMessage message="No recent transactions found." />}
            </>
          )}
          </FinanceCard>
        </motion.div>

        <AnimatePresence initial={false}>
          {showExtendedPanels ? (
            <motion.div key="budget-panel" variants={staggerItem} initial="hidden" animate="visible" exit="hidden">
              <FinanceCard className="h-full" layoutId="dashboard-detail-budget">
          <SectionTitle title="Budgets" description="Current category pacing" />
          <div className="space-y-3">
            {budgets.isError ? (
              <SectionMessage message="Budget pacing is unavailable right now." />
            ) : (budgets.data || []).length ? (
              (budgets.data || []).slice(0, 4).map((budget: any) => (
                <div key={budget.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200">{budget.categoryName}</span>
                    <span className="font-medium text-slate-950 dark:text-white">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min((Number(budget.spent) / Math.max(Number(budget.amount), 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <SectionMessage message="No budgets are available yet." />
            )}
          </div>
              </FinanceCard>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {showExtendedPanels ? (
            <motion.div key="goals-panel" variants={staggerItem} initial="hidden" animate="visible" exit="hidden">
              <FinanceCard className="h-full" layoutId="dashboard-detail-goals">
          <SectionTitle title="Goals" description="Progress against savings targets" />
          <div className="space-y-3">
            {goals.isError ? (
              <SectionMessage message="Goal progress is unavailable right now." />
            ) : (goals.data || []).length ? (
              (goals.data || []).slice(0, 4).map((goal: any) => (
                <div key={goal.id}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200">{goal.name}</span>
                    <span className="font-medium text-slate-950 dark:text-white">{formatPercent(goal.percentage)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded-full bg-income" style={{ width: `${Math.min(Number(goal.percentage) || 0, 100)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <SectionMessage message="No goals are available yet." />
            )}
          </div>
              </FinanceCard>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.div variants={staggerItem} className="md:col-span-2">
          <FinanceCard className="h-full">
          <SectionTitle title="Actionable Insights" description="Highlights generated from current behavior" />
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.isError ? (
              <SectionMessage message="Insights are unavailable right now." />
            ) : (insights.data || []).length ? (
              (insights.data || []).map((item: any) => (
                <div key={item.title} className="rounded-[22px] bg-slate-100/80 px-4 py-4 dark:bg-slate-800/80">
                  <div className="text-sm font-semibold text-slate-950 dark:text-white">{item.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</div>
                </div>
              ))
            ) : (
              <SectionMessage message="No insights are available yet." />
            )}
          </div>
          </FinanceCard>
        </motion.div>
      </motion.section>
    </div>
  );
}

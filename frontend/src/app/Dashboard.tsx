import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import { FinanceCard } from '../components/FinanceCard';
import { StatsGrid, type StatCard } from '../components/StatsGrid';
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader';
import { RunwayMeter } from '../components/dashboard/RunwayMeter';
import { SignalItem } from '../components/dashboard/SignalItem';
import { ErrorBanner } from '../components/ErrorBanner';
import { extractErrorMessage, formatCurrency } from '../utils/ui';

const fetcher = (url: string) => api.get(url).then((response) => response.data);

function formatPercent(value: unknown) {
  const amount = Number(value ?? 0);
  return `${Number.isFinite(amount) ? amount.toFixed(0) : '0'}%`;
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
    }
  ];

  const piePalette = ['#1E3A8A', '#10B981', '#16A34A', '#DC2626', '#0EA5E9', '#F59E0B'];
  const showExtendedPanels = viewMode === 'detailed';
  const isDetailed = viewMode === 'detailed';
  const score = Number(healthScore.data?.score ?? 0);
  const projectedBalance = Number(forecastMonth.data?.projectedEndBalance ?? 0);
  const safeToSpend = Number(forecastMonth.data?.safeToSpend ?? 0);
  const scoreTone =
    score >= 75 ? 'accent' : score >= 50 ? 'default' : 'danger';
  const healthFactors = (healthScore.data?.factors || []).slice(0, 3);
  const scoreLabel =
    score >= 80 ? 'Resilient' : score >= 60 ? 'Stable' : score >= 40 ? 'Caution' : 'Critical';
  const signalItems = forecastMonth.isError
    ? []
    : [
        ...(forecastMonth.data?.warnings || []).slice(0, 2).map((warning: string) => ({
          title: 'Risk Alert',
          subtitle: warning,
          tone: 'danger' as const
        })),
        ...((forecastMonth.data?.upcomingExpenses || []).slice(0, 3).map((expense: any) => ({
          title: expense.title,
          subtitle: expense.date,
          value: formatCurrency(expense.amount),
          tone: 'default' as const
        })) || [])
      ];
  const limitedSignals = signalItems.slice(0, isDetailed ? 5 : 3);
  const recentItems = (recentTransactions.data || []).slice(0, isDetailed ? 12 : 5);
  const insightsItems = (insights.data || []).slice(0, isDetailed ? 6 : 3);
  function condenseSpending(data: any[]) {
    if (!data.length) return [];
    const sorted = [...data].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
    const primary = sorted.slice(0, isDetailed ? 6 : 4);
    const rest = sorted.slice(isDetailed ? 6 : 4);
    if (!rest.length) return primary;
    const otherTotal = rest.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return [...primary, { category: 'Other', amount: otherTotal }];
  }
  const condensedSpending = condenseSpending(spending.data || []);
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
        className="dashboard-hero surface relative overflow-hidden rounded-[36px] border border-white/60 p-6 backdrop-blur-md dark:border-white/10 sm:p-7"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(30,58,138,0.16),transparent_18%),radial-gradient(circle_at_72%_82%,rgba(16,185,129,0.12),transparent_20%)]" />
        <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,22rem)] xl:items-end 2xl:grid-cols-[minmax(0,1.25fr)_380px]">
          <div className="max-w-4xl">
            <div className="dashboard-pill">
              Dashboard
            </div>
            <h1 className="hero-title">Your money, clearly.</h1>
            <p className="hero-description">Balances, spending, and what’s next.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="signal-chip">Forecast</span>
              <span className="signal-chip">Budgets</span>
              <span className="signal-chip">Insights</span>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="flex justify-start xl:justify-end">
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
            <motion.div layoutId="dashboard-summary-month-end" className="hero-metric">
              <div className="hero-metric-label">
                Projected Month End
              </div>
              <div className="hero-metric-value">
                {forecastMonth.isError ? 'Unavailable' : formatCurrency(projectedBalance)}
              </div>
              <div className="hero-metric-subtle">Month-end estimate.</div>
            </motion.div>
            <motion.div layoutId="dashboard-summary-score" className="grid gap-4 sm:grid-cols-2">
              <div className="hero-metric">
                <div className="hero-metric-label">
                  Health Snapshot
                </div>
                <div className="hero-metric-value">
                  {healthScore.isError ? 'Unavailable' : `${score} / 100`}
                </div>
                <div className="hero-metric-subtle">
                  {healthScore.isError ? 'Score unavailable.' : `${scoreLabel} overall.`}
                </div>
              </div>
              <div className="hero-metric">
                <div className="hero-metric-label">Cash Headroom</div>
                <div className="hero-metric-value">
                  {forecastMonth.isError ? 'Unavailable' : formatCurrency(safeToSpend)}
                </div>
                <div className="hero-metric-subtle">Safe to spend.</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <StatsGrid items={statCards} />

      <motion.section
        className="bento-grid transition-all duration-500 ease-in-out"
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
        <motion.div variants={staggerItem} className="2xl:col-span-3">
          <FinanceCard className="h-full">
            <DashboardSectionHeader
              eyebrow="Cash Projection"
              title="Projected balance runway"
              description="Runway through month end."
              action={<div className="dashboard-pill">Updated Live</div>}
            />
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="mini-stat">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Safe To Spend</div>
                <div className="mini-stat-value">{forecastMonth.isError ? 'Unavailable' : formatCurrency(forecastMonth.data?.safeToSpend)}</div>
              </div>
              <div className="mini-stat">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Expected Income</div>
                <div className="mini-stat-value">{forecastMonth.isError ? 'Unavailable' : formatCurrency(forecastMonth.data?.expectedIncome)}</div>
              </div>
              <div className="mini-stat">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Expected Expense</div>
                <div className="mini-stat-value">{forecastMonth.isError ? 'Unavailable' : formatCurrency(forecastMonth.data?.expectedExpenses)}</div>
              </div>
            </div>
            <div className="h-72 w-full">
              {forecastDaily.isError ? (
                <SectionMessage message="Forecast data unavailable." />
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
                <SectionMessage message="Add transactions to generate a forecast." />
              )}
            </div>
          </FinanceCard>
        </motion.div>

        <motion.div variants={staggerItem} className="2xl:col-span-1">
          <FinanceCard className="h-full">
            <DashboardSectionHeader
              eyebrow="Signal Rail"
              title="Forecast signals"
              description="Top alerts and upcoming bills."
            />
            <div className="space-y-3">
              {forecastMonth.isError ? (
                <SectionMessage message="Signals unavailable." />
              ) : limitedSignals.length ? (
                <div className="space-y-3 list-fade-mask">
                  {limitedSignals.map((item) => (
                    <SignalItem
                      key={`${item.title}-${item.subtitle}-${item.value ?? ''}`}
                      title={item.title}
                      subtitle={item.subtitle}
                      value={item.value}
                      tone={item.tone}
                    />
                  ))}
                </div>
              ) : (
                <SignalItem
                  title="No risk warnings"
                  subtitle="All clear right now."
                  tone="accent"
                />
              )}
            </div>
          </FinanceCard>
        </motion.div>

        {isDetailed ? (
          <motion.div variants={staggerItem} className="2xl:col-span-1">
            <FinanceCard className="h-full">
              <DashboardSectionHeader
                eyebrow="Resilience"
                title="Financial health"
                description="Score and key drivers."
              />
              {healthScore.isError ? (
                <SectionMessage message="Health details unavailable." />
              ) : (
                <div className="space-y-5">
                  <RunwayMeter score={score} label={scoreLabel} detail="Stability snapshot." />
                  <div className="space-y-3">
                    {healthFactors.length ? (
                      healthFactors.map((factor: any) => (
                        <SignalItem
                          key={factor.name}
                          title={factor.name}
                          subtitle="Impact on score"
                          value={`${factor.score}/100`}
                          tone={scoreTone}
                        />
                      ))
                    ) : (
                      <SectionMessage message="No health details yet." />
                    )}
                  </div>
                </div>
              )}
            </FinanceCard>
          </motion.div>
        ) : null}

        {isDetailed ? (
          <motion.div variants={staggerItem} className="2xl:col-span-1">
            <FinanceCard className="h-full">
              <DashboardSectionHeader
                eyebrow="Concentration"
                title="Spending mix"
                description="Top spend categories."
              />
              <div className="h-72 w-full">
                {spending.isError ? (
                  <SectionMessage message="Spending data unavailable." />
                ) : (spending.data || []).length ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={condensedSpending} dataKey="amount" nameKey="category" outerRadius={92}>
                        {condensedSpending.map((_: unknown, index: number) => (
                          <Cell key={index} fill={piePalette[index % piePalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <SectionMessage message="No spending data yet." />
                )}
              </div>
            </FinanceCard>
          </motion.div>
        ) : null}

        {isDetailed ? (
          <motion.div variants={staggerItem} className="2xl:col-span-2">
            <FinanceCard className="h-full">
              <DashboardSectionHeader
                eyebrow="Monthly Story"
                title="Income vs expense momentum"
                description="Monthly trend."
              />
              <div className="h-72 w-full">
                {trend.isError ? (
                  <SectionMessage message="Trend data unavailable." />
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
                  <SectionMessage message="No trend data yet." />
                )}
              </div>
            </FinanceCard>
          </motion.div>
        ) : null}

        {isDetailed ? (
          <motion.div variants={staggerItem} className="md:col-span-2 2xl:col-span-3">
            <FinanceCard className="h-full">
              <DashboardSectionHeader
                eyebrow="Execution Feed"
                title="Recent transactions"
                description="Latest activity."
              />
              {recentTransactions.isError ? (
                <SectionMessage message="Recent activity unavailable." />
              ) : (
                <>
                  <div className="space-y-3 list-fade-mask md:hidden">
                    {recentItems.map((transaction: any) => (
                      <SignalItem
                        key={transaction.id}
                        title={transaction.merchant || transaction.note || transaction.type}
                        subtitle={`${transaction.transactionDate} · ${transaction.type}`}
                        value={formatCurrency(transaction.amount)}
                        tone={Number(transaction.amount) < 0 ? 'danger' : 'default'}
                      />
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
                        {recentItems.map((transaction: any) => (
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
                  {(recentTransactions.data || []).length ? null : <SectionMessage message="No recent activity yet." />}
                </>
              )}
            </FinanceCard>
          </motion.div>
        ) : null}

        <AnimatePresence initial={false}>
          {showExtendedPanels ? (
            <motion.div key="budget-panel" variants={staggerItem} initial="hidden" animate="visible" exit="hidden" className="2xl:col-span-1">
              <FinanceCard className="h-full" layoutId="dashboard-detail-budget">
                <DashboardSectionHeader
                  eyebrow="Discipline"
                  title="Budgets"
                  description="Budget pacing."
                />
                <div className="space-y-3">
                  {budgets.isError ? (
                    <SectionMessage message="Budget data unavailable." />
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
                    <SectionMessage message="No budgets yet." />
                  )}
                </div>
              </FinanceCard>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {showExtendedPanels ? (
            <motion.div key="goals-panel" variants={staggerItem} initial="hidden" animate="visible" exit="hidden" className="2xl:col-span-1">
              <FinanceCard className="h-full" layoutId="dashboard-detail-goals">
                <DashboardSectionHeader
                  eyebrow="Momentum"
                  title="Goals"
                  description="Goal progress."
                />
                <div className="space-y-3">
                  {goals.isError ? (
                    <SectionMessage message="Goal data unavailable." />
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
                    <SectionMessage message="No goals yet." />
                  )}
                </div>
              </FinanceCard>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {isDetailed ? (
          <motion.div variants={staggerItem} className="md:col-span-2 2xl:col-span-2">
            <FinanceCard className="h-full">
              <DashboardSectionHeader
              eyebrow="Narrative"
              title="Actionable insights"
              description="Quick recommendations."
            />
              <div className="grid gap-3 sm:grid-cols-2">
                {insights.isError ? (
                  <SectionMessage message="Insights unavailable." />
                ) : insightsItems.length ? (
                  insightsItems.map((item: any) => (
                    <SignalItem
                      key={item.title}
                      title={item.title}
                      subtitle={item.message}
                      tone="accent"
                    />
                  ))
                ) : (
                  <SectionMessage message="No insights yet." />
                )}
              </div>
            </FinanceCard>
          </motion.div>
        ) : null}
      </motion.section>
    </div>
  );
}

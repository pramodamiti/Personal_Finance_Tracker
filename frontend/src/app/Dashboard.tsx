import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import { StatsGrid, type StatCard } from '../components/StatsGrid';

const fetcher = (url: string) => api.get(url).then((response) => response.data);

function formatCurrency(value: unknown) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);
}

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

export function Dashboard() {
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

  const statCards: StatCard[] = [
    {
      id: 'balances',
      label: 'Total Balance',
      value: formatCurrency(summary.data?.totalBalances),
      hint: 'Live value across all active accounts.',
      tone: 'primary',
      span: 'wide'
    },
    {
      id: 'safe-to-spend',
      label: 'Safe To Spend',
      value: formatCurrency(forecastMonth.data?.safeToSpend),
      hint: 'Projected cash buffer before month end.',
      tone: 'accent'
    },
    {
      id: 'income',
      label: 'Income',
      value: formatCurrency(summary.data?.income),
      hint: 'Recognized inflow this month.',
      tone: 'income'
    },
    {
      id: 'expense',
      label: 'Expense',
      value: formatCurrency(summary.data?.expense),
      hint: 'Current month outflow across categories.',
      tone: 'expense'
    },
    {
      id: 'health',
      label: 'Health Score',
      value: String(healthScore.data?.score ?? 0),
      hint: 'Weighted score from savings, stability, and cash buffer.',
      tone: 'accent'
    }
  ];

  const piePalette = ['#1E3A8A', '#10B981', '#16A34A', '#DC2626', '#0EA5E9', '#F59E0B'];

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="surface relative overflow-hidden rounded-[32px] p-5 sm:p-6">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary/10 to-transparent lg:block" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-blue-100">
              Decision Dashboard
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-3xl lg:text-4xl">
              Premium money visibility, optimized from iPhone to 4K.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Track cash flow, read future balance risk, and keep spending behavior in view with a responsive fintech layout.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Projected Month End
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {formatCurrency(forecastMonth.data?.projectedEndBalance)}
              </div>
            </div>
            <div className="rounded-[24px] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Score Snapshot
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {String(healthScore.data?.score ?? 0)} / 100
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatsGrid items={statCards} />

      <section className="dashboard-grid grid grid-cols-1 gap-4 transition-all duration-300 ease-in-out md:grid-cols-2 2xl:grid-cols-4">
        <article className="card md:col-span-2 2xl:col-span-2">
          <SectionTitle title="Projected Balance" description="Daily forecast from today through month end" />
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] bg-primary/5 px-4 py-3 dark:bg-primary/15">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Safe To Spend</div>
              <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{formatCurrency(forecastMonth.data?.safeToSpend)}</div>
            </div>
            <div className="rounded-[22px] bg-accent/5 px-4 py-3 dark:bg-accent/15">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Expected Income</div>
              <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{formatCurrency(forecastMonth.data?.expectedIncome)}</div>
            </div>
            <div className="rounded-[22px] bg-expense/5 px-4 py-3 dark:bg-expense/15">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Expected Expense</div>
              <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{formatCurrency(forecastMonth.data?.expectedExpenses)}</div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={forecastDaily.data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="projectedBalance" stroke="#1E3A8A" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card">
          <SectionTitle title="Forecast Signals" description="Upcoming expenses and warnings" />
          <div className="space-y-3">
            {(forecastMonth.data?.warnings || []).length ? (
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
            <div className="space-y-2">
              {(forecastMonth.data?.upcomingExpenses || []).slice(0, 5).map((expense: any) => (
                <div key={`${expense.date}-${expense.title}`} className="rounded-[20px] bg-slate-100/80 px-4 py-3 dark:bg-slate-800/80">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-950 dark:text-white">{expense.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{expense.date}</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-950 dark:text-white">{formatCurrency(expense.amount)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="card">
          <SectionTitle title="Financial Health" description="Weighted factor breakdown" />
          <div className="space-y-4">
            {(healthScore.data?.factors || []).map((factor: any) => (
              <div key={factor.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{factor.name}</span>
                  <span className="font-semibold text-slate-950 dark:text-white">{factor.score}/100</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary via-accent to-income" style={{ width: `${factor.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <SectionTitle title="Spending Analytics" description="Category concentration this month" />
          <div className="h-72 w-full">
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
          </div>
        </article>

        <article className="card">
          <SectionTitle title="Income vs Expense" description="Desktop-friendly side-by-side chart view" />
          <div className="h-72 w-full">
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
          </div>
        </article>

        <article className="card md:col-span-2 2xl:col-span-2">
          <SectionTitle title="Recent Transactions" description="Single-column list on mobile, denser table on larger screens" />
          <div className="space-y-3 md:hidden">
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
          <div className="hidden md:block">
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
        </article>

        <article className="card">
          <SectionTitle title="Budgets" description="Current category pacing" />
          <div className="space-y-3">
            {(budgets.data || []).slice(0, 4).map((budget: any) => (
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
            ))}
          </div>
        </article>

        <article className="card">
          <SectionTitle title="Goals" description="Progress against savings targets" />
          <div className="space-y-3">
            {(goals.data || []).slice(0, 4).map((goal: any) => (
              <div key={goal.id}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{goal.name}</span>
                  <span className="font-medium text-slate-950 dark:text-white">{formatPercent(goal.percentage)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-2 rounded-full bg-income" style={{ width: `${Math.min(Number(goal.percentage) || 0, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card md:col-span-2">
          <SectionTitle title="Actionable Insights" description="Highlights generated from current behavior" />
          <div className="grid gap-3 sm:grid-cols-2">
            {(insights.data || []).map((item: any) => (
              <div key={item.title} className="rounded-[22px] bg-slate-100/80 px-4 py-4 dark:bg-slate-800/80">
                <div className="text-sm font-semibold text-slate-950 dark:text-white">{item.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

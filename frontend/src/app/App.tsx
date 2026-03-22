import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, CartesianGrid, LineChart, Line, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Navbar, type NavItem } from '../components/Navbar';
import { Dashboard } from './Dashboard';
import { ErrorBanner } from '../components/ErrorBanner';
import { extractErrorMessage, formatCurrency } from '../utils/ui';

const nav: NavItem[] = [
  { href: '/', label: 'Dashboard', mobileLabel: 'Home' },
  { href: '/transactions', label: 'Transactions', mobileLabel: 'Txns' },
  { href: '/budgets', label: 'Budgets', mobileLabel: 'Budgets' },
  { href: '/goals', label: 'Goals', mobileLabel: 'Goals' },
  { href: '/reports', label: 'Reports', mobileLabel: 'Reports' },
  { href: '/insights', label: 'Insights', mobileLabel: 'Insights' },
  { href: '/rules', label: 'Rules', mobileLabel: 'Rules' },
  { href: '/recurring', label: 'Recurring', mobileLabel: 'Repeat' },
  { href: '/accounts', label: 'Accounts', mobileLabel: 'Accounts' },
  { href: '/settings', label: 'Settings', mobileLabel: 'Settings' }
];

const fetcher = (url: string) => api.get(url).then((r) => r.data);
const today = new Date().toISOString().slice(0, 10);

type Option = { value: string; label: string };
type Field = { name: string; label: string; type?: string; options?: Option[] };
type TransactionFormValues = {
  type: string;
  amount?: string;
  transactionDate: string;
  accountId?: string;
  destinationAccountId?: string;
  categoryId?: string;
  paymentMethod?: string;
  merchant?: string;
  note?: string;
};
type BudgetFormValues = {
  categoryId?: string;
  amount?: string;
  budgetMonth: string;
  budgetYear: string;
};
type RuleFormValues = {
  name: string;
  priority: string;
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  actionType: string;
  actionValue: string;
  isActive: string;
};

const transactionTypeOptions = ['EXPENSE', 'INCOME', 'TRANSFER'].map(toOption);
const accountTypeOptions = ['BANK_ACCOUNT', 'CREDIT_CARD', 'CASH_WALLET', 'SAVINGS_ACCOUNT'].map(toOption);
const recurringFrequencyOptions = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map(toOption);
const paymentMethodOptions = ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_WALLET', 'OTHER'].map(toOption);
const ruleFieldOptions = [
  { value: 'merchant', label: 'Merchant' },
  { value: 'amount', label: 'Amount' },
  { value: 'categoryId', label: 'Category' },
  { value: 'type', label: 'Type' },
  { value: 'note', label: 'Note' }
];
const ruleOperatorOptions = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' }
];
const ruleActionOptions = [
  { value: 'set_category', label: 'Set Category' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'set_note', label: 'Set Note' },
  { value: 'trigger_alert', label: 'Trigger Alert' }
];
const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

function toOption(value: string): Option {
  return { value, label: humanize(value) };
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function triggerBlobDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function describeRule(rule: any) {
  const field = humanize(String(rule?.condition?.field ?? ''));
  const operator = humanize(String(rule?.condition?.operator ?? ''));
  const value = String(rule?.condition?.value ?? '');
  const action = humanize(String(rule?.action?.type ?? ''));
  const actionValue = String(rule?.action?.value ?? '');
  return `If ${field} ${operator} ${value}, then ${action}${actionValue ? `: ${actionValue}` : ''}`;
}

function renderResourceCell(row: any, field: Field) {
  const value = row?.[field.name];
  if (field.type === 'number') {
    return formatCurrency(value);
  }
  return String(value ?? '');
}

function FieldInput({ field, register }: { field: Field; register: any }) {
  if (field.options) {
    return (
      <select className="input" defaultValue="" {...register(field.name)}>
        <option value="">Select {field.label}</option>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return <input type={field.type || 'text'} className="input" {...register(field.name)} />;
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="hero-panel">
      <div className="hero-copy">
        <div className="kicker">{eyebrow}</div>
        <h1 className="hero-title">{title}</h1>
        <p className="hero-description">{description}</p>
      </div>
      {actions ? <div className="hero-actions">{actions}</div> : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  meta,
  tone = 'default'
}: {
  label: string;
  value: string;
  meta: string;
  tone?: 'default' | 'warm' | 'cool' | 'emerald';
}) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-meta">{meta}</div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <div className="layout-grid">
        <Navbar items={nav} user={user} onLogout={logout} />
        <main className="app-main">
          <div className="content-wrap">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AuthPage({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<Record<string, string>>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const authLinks = [
    { key: 'login', label: 'Login', to: '/login' },
    { key: 'register', label: 'Create account', to: '/register' },
    { key: 'forgot', label: 'Forgot password', to: '/forgot-password' }
  ].filter((link) => link.key !== mode);
  const mutation = useMutation({
    mutationFn: (payload: any) => api.post(`/auth/${mode === 'register' ? 'register' : mode === 'forgot' ? 'forgot-password' : 'login'}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      if (mode !== 'forgot') { setAuth(data); navigate('/'); }
      else alert('If the email exists, a reset token was emitted to the backend console/MailHog.');
    }
  });
  const errorMessage = extractErrorMessage(mutation.error);

  return (
    <div className="min-h-screen overflow-hidden px-4 py-10">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-shell">
        <div className="auth-showcase">
          <div className="brand-pill">Personal Finance Tracker</div>
          <h1 className="mt-5 text-3xl font-semibold leading-tight text-slate-950 dark:text-white sm:text-4xl">
            Keep everyday money decisions simple and clear.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            Track balances, understand future cash flow, and stay on top of budgets without the interface getting in your way.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Forecasting" value="Daily" meta="Month-end balance view" tone="cool" />
            <MetricCard label="Health Score" value="0-100" meta="Savings and cash buffer" tone="emerald" />
            <MetricCard label="Automation" value="Rules" meta="Categories, tags, alerts" tone="warm" />
          </div>
        </div>
        <div className="auth-card">
          <div className="kicker">
            {mode === 'forgot' ? 'Recovery' : mode === 'register' ? 'Create account' : 'Sign in'}
          </div>
          <h2 className="mt-3 text-2xl font-semibold capitalize text-slate-950 dark:text-white">
            {mode === 'forgot' ? 'Forgot password' : mode === 'register' ? 'Create your account' : 'Login'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'register'
              ? 'Set up your account and start tracking money in one place.'
              : mode === 'forgot'
                ? 'Enter your email and we will send reset instructions.'
                : 'Use your email and password to continue.'}
          </p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            {mode !== 'forgot' && mode !== 'login' && <div><label className="label">Display name</label><input className="input" {...register('displayName')} /></div>}
            <div><label className="label">Email</label><input className="input" {...register('email')} /></div>
            {mode !== 'forgot' && <div><label className="label">Password</label><input type="password" className="input" {...register('password')} /></div>}
            {errorMessage && <ErrorBanner message={errorMessage} />}
            <button className="btn-primary w-full" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Please wait...'
                : mode === 'forgot'
                  ? 'Send reset instructions'
                  : mode === 'register'
                    ? 'Create account'
                    : 'Login'}
            </button>
          </form>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            {authLinks.map((link) => (
              <NavLink key={link.key} className="text-primary underline-offset-4 hover:underline" to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourcePage({ title, endpoint, fields }: { title: string; endpoint: string; fields: Field[] }) {
  const { register, handleSubmit, reset } = useForm<Record<string, string>>();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: [endpoint], queryFn: () => fetcher(endpoint) });
  const mutation = useMutation({ mutationFn: (payload: any) => api.post(endpoint, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: [endpoint] }); reset(); } });
  const rows = Array.isArray(query.data) ? query.data : query.data?.content ?? [];
  const errorMessage = extractErrorMessage(mutation.error) || extractErrorMessage(query.error);

  return <div className="space-y-6"><PageHeader eyebrow="Workspace" title={title} description={`Add and review ${title.toLowerCase()} in one place.`} />{errorMessage && <ErrorBanner message={errorMessage} />}<div className="grid gap-6 lg:grid-cols-[320px_1fr]"><form className="card space-y-3" onSubmit={handleSubmit((values) => mutation.mutate(values))}>{fields.map((f) => <div key={f.name}><label className="label">{f.label}</label><FieldInput field={f} register={register} /></div>)}<button className="btn-primary w-full">Add</button></form><div className="card overflow-auto"><table className="data-table w-full text-left text-sm"><thead><tr>{fields.map((f) => <th key={f.name} className="py-2">{f.label}</th>)}</tr></thead><tbody>{rows.map((row: any) => <tr key={row.id}>{fields.map((f) => <td key={f.name} className="py-3">{renderResourceCell(row, f)}</td>)}</tr>)}</tbody></table></div></div></div>;
}

function TransactionsPage() {
  const { register, handleSubmit, reset, watch } = useForm<TransactionFormValues>({
    defaultValues: {
      type: 'EXPENSE',
      transactionDate: today,
      paymentMethod: 'CARD'
    }
  });
  const qc = useQueryClient();
  const selectedType = watch('type');
  const transactions = useQuery({ queryKey: ['/transactions'], queryFn: () => fetcher('/transactions') });
  const accounts = useQuery({ queryKey: ['/accounts'], queryFn: () => fetcher('/accounts') });
  const categories = useQuery({ queryKey: ['/categories'], queryFn: () => fetcher('/categories') });
  const mutation = useMutation({
    mutationFn: (payload: any) => api.post('/transactions', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/transactions'] });
      reset({
        type: 'EXPENSE',
        transactionDate: today,
        paymentMethod: 'CARD'
      });
    }
  });

  const rows = Array.isArray(transactions.data) ? transactions.data : transactions.data?.content ?? [];
  const accountOptions = (accounts.data || []).map((account: any) => ({ value: account.id, label: account.name }));
  const categoryOptions = (categories.data || [])
    .filter((category: any) => selectedType !== 'TRANSFER' && category.type === selectedType)
    .map((category: any) => ({ value: category.id, label: category.name }));
  const errorMessage = extractErrorMessage(mutation.error) || extractErrorMessage(transactions.error) || extractErrorMessage(accounts.error) || extractErrorMessage(categories.error);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Money Flow" title="Transactions" description="Add expenses, income, and transfers with cleaner transaction details." />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          className="card space-y-3"
          onSubmit={handleSubmit((values) =>
            mutation.mutate({
              ...values,
              accountId: values.accountId || undefined,
              destinationAccountId: values.type === 'TRANSFER' ? values.destinationAccountId || undefined : undefined,
              categoryId: values.type === 'TRANSFER' ? undefined : values.categoryId || undefined,
              merchant: values.merchant || undefined,
              note: values.note || undefined,
              paymentMethod: values.paymentMethod || undefined
            })
          )}
        >
          <div>
            <label className="label">Type</label>
            <FieldInput field={{ name: 'type', label: 'Type', options: transactionTypeOptions }} register={register} />
          </div>
          <div>
            <label className="label">Amount</label>
            <input type="number" step="0.01" className="input" {...register('amount')} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" {...register('transactionDate')} />
          </div>
          <div>
            <label className="label">Account</label>
            <FieldInput field={{ name: 'accountId', label: 'Account', options: accountOptions }} register={register} />
          </div>
          {selectedType === 'TRANSFER' ? (
            <div>
              <label className="label">Destination account</label>
              <FieldInput field={{ name: 'destinationAccountId', label: 'Destination account', options: accountOptions }} register={register} />
            </div>
          ) : (
            <div>
              <label className="label">Category</label>
              <FieldInput field={{ name: 'categoryId', label: 'Category', options: categoryOptions }} register={register} />
            </div>
          )}
          <div>
            <label className="label">Payment method</label>
            <FieldInput field={{ name: 'paymentMethod', label: 'Payment method', options: paymentMethodOptions }} register={register} />
          </div>
          <div>
            <label className="label">Merchant</label>
            <input className="input" {...register('merchant')} />
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input" {...register('note')} />
          </div>
          <button className="btn-primary w-full" disabled={!accountOptions.length || (selectedType !== 'TRANSFER' && !categoryOptions.length)}>
            Add
          </button>
          {!accountOptions.length && <p className="text-sm text-slate-500">Create an account first from the Accounts page.</p>}
        </form>
        <div className="card overflow-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="py-2">Type</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Date</th>
                <th className="py-2">Merchant</th>
                <th className="py-2">Account</th>
                <th className="py-2">Category</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td className="py-3">{String(row.type ?? '')}</td>
                  <td className="py-3">{formatCurrency(row.amount)}</td>
                  <td className="py-3">{String(row.transactionDate ?? '')}</td>
                  <td className="py-3">{String(row.merchant || row.note || '—')}</td>
                  <td className="py-3">{String(row.destinationAccountName ? `${row.accountName || '—'} -> ${row.destinationAccountName}` : row.accountName || '—')}</td>
                  <td className="py-3">{String(row.categoryName || (row.type === 'TRANSFER' ? 'Transfer' : '—'))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BudgetsPage() {
  const { register, handleSubmit, watch } = useForm<BudgetFormValues>({
    defaultValues: {
      budgetMonth: String(currentMonth),
      budgetYear: String(currentYear)
    }
  });

  const qc = useQueryClient();
  const month = Number(watch('budgetMonth') || currentMonth);
  const year = Number(watch('budgetYear') || currentYear);

  const budgets = useQuery({ queryKey: ['/budgets', month, year], queryFn: () => fetcher(`/budgets?month=${month}&year=${year}`) });
  const categories = useQuery({ queryKey: ['/categories'], queryFn: () => fetcher('/categories') });
  const createBudget = useMutation({
    mutationFn: (payload: any) => api.post('/budgets', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/budgets', month, year] });
    }
  });
  const updateBudget = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.put(`/budgets/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/budgets', month, year] });
    }
  });

  const categoryOptions = (categories.data || [])
    .filter((category: any) => category.type === 'EXPENSE')
    .map((category: any) => ({ value: category.id, label: category.name }));

  const rows = Array.isArray(budgets.data) ? budgets.data : budgets.data?.content ?? [];
  const selectedCategoryId = watch('categoryId');
  const existingBudget = rows.find((row: any) => row.categoryId === selectedCategoryId);
  const errorMessage =
    extractErrorMessage(createBudget.error) ||
    extractErrorMessage(updateBudget.error) ||
    extractErrorMessage(budgets.error) ||
    extractErrorMessage(categories.error);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Discipline Layer" title="Budgets" description="Track category limits and spot overspending early." />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          className="card space-y-3"
          onSubmit={handleSubmit((values) => {
            const payload = {
              categoryId: values.categoryId,
              amount: values.amount,
              budgetMonth: Number(values.budgetMonth),
              budgetYear: Number(values.budgetYear)
            };

            if (existingBudget) {
              const shouldUpdate = window.confirm(
                `Budget already exists for ${existingBudget.categoryName}. Do you want to update it?`
              );

              if (!shouldUpdate) {
                return;
              }

              updateBudget.mutate({
                id: existingBudget.id,
                payload
              });
              return;
            }

            createBudget.mutate(payload);
          })}
        >
          <div>
            <label className="label">Category</label>
            <FieldInput field={{ name: 'categoryId', label: 'Category', options: categoryOptions }} register={register} />
          </div>
          <div>
            <label className="label">Amount</label>
            <input type="number" step="0.01" className="input" {...register('amount')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Month</label>
              <input type="number" min="1" max="12" className="input" {...register('budgetMonth')} />
            </div>
            <div>
              <label className="label">Year</label>
              <input type="number" min="2000" className="input" {...register('budgetYear')} />
            </div>
          </div>
          {existingBudget ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              A budget already exists for this category in the selected month. Submitting will ask for confirmation to update it.
            </div>
          ) : null}
          <button className="btn-primary w-full" disabled={!categoryOptions.length || createBudget.isPending || updateBudget.isPending}>
            {createBudget.isPending || updateBudget.isPending ? 'Saving...' : existingBudget ? 'Update budget' : 'Add budget'}
          </button>
          {!categoryOptions.length && <p className="text-sm text-slate-500">Create an expense category first from Categories (created automatically on signup).</p>}
        </form>
        <div className="card overflow-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="py-2">Category</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Spent</th>
                <th className="py-2">Month</th>
                <th className="py-2">Year</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td className="py-3">{String(row.categoryName ?? '')}</td>
                  <td className="py-3">{formatCurrency(row.amount)}</td>
                  <td className="py-3">{formatCurrency(row.spent)}</td>
                  <td className="py-3">{String(row.budgetMonth ?? '')}</td>
                  <td className="py-3">{String(row.budgetYear ?? '')}</td>
                  <td className="py-3">{String(row.threshold ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  return <Dashboard />;
}

function ReportsPage() {
  const from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to = new Date().toISOString().slice(0,10);
  const category = useQuery({ queryKey: ['report-category'], queryFn: () => fetcher(`/reports/category-spend?from=${from}&to=${to}`) });
  const trend = useQuery({ queryKey: ['report-trend'], queryFn: () => fetcher(`/reports/income-vs-expense?from=${from}&to=${to}`) });
  const advancedTrends = useQuery({ queryKey: ['advanced-trends'], queryFn: () => fetcher(`/reports/trends?from=${new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().slice(0,10)}&to=${to}`) });
  const netWorth = useQuery({ queryKey: ['net-worth'], queryFn: () => fetcher('/reports/net-worth') });
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/reports/export/csv', {
        params: { from, to },
        responseType: 'blob'
      });
      return response.data as Blob;
    },
    onSuccess: (blob) => {
      triggerBlobDownload(blob, `transactions-${from}-to-${to}.csv`);
    }
  });
  const errorMessage = extractErrorMessage(category.error) || extractErrorMessage(trend.error) || extractErrorMessage(advancedTrends.error) || extractErrorMessage(netWorth.error) || extractErrorMessage(exportMutation.error);

  return <div className="space-y-6"><PageHeader eyebrow="Advanced Reporting" title="Spending, savings, and net worth over time." description="Compare category trends, savings rate, and balance movement with simpler visuals." actions={<button className="btn-primary" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>{exportMutation.isPending ? 'Preparing CSV...' : 'Download CSV export'}</button>} />{errorMessage && <ErrorBanner message={errorMessage} />}<div className="grid gap-6 lg:grid-cols-2"><div className="card h-80 chart-panel"><SectionTitle title="Category spend" description="This month's highest expense buckets" /><ResponsiveContainer><BarChart data={category.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" /><YAxis /><Tooltip formatter={(value) => formatCurrency(value)} /><Bar dataKey="amount" fill="#0f766e" radius={[12, 12, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="card h-80 chart-panel"><SectionTitle title="Income vs expense" description="Monthly inflow versus outflow" /><ResponsiveContainer><LineChart data={trend.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => formatCurrency(value)} /><Line dataKey="income" stroke="#10b981" strokeWidth={3} /><Line dataKey="expense" stroke="#f97316" strokeWidth={3} /></LineChart></ResponsiveContainer></div></div><div className="grid gap-6 lg:grid-cols-2"><div className="card h-80 chart-panel"><SectionTitle title="Savings rate trend" description="Keep the direction obvious" /><ResponsiveContainer><LineChart data={advancedTrends.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Line dataKey="savingsRate" stroke="#0891b2" strokeWidth={3} /></LineChart></ResponsiveContainer></div><div className="card h-80 chart-panel"><SectionTitle title="Net worth tracking" description="Estimated balance trajectory over time" /><ResponsiveContainer><LineChart data={netWorth.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => formatCurrency(value)} /><Line dataKey="netWorth" stroke="#7c3aed" strokeWidth={3} /></LineChart></ResponsiveContainer></div></div></div>;
}

function InsightsPage() {
  const healthScore = useQuery({ queryKey: ['insights-health'], queryFn: () => fetcher('/insights/health-score') });
  const insights = useQuery({ queryKey: ['insights-list'], queryFn: () => fetcher('/insights') });
  const trends = useQuery({ queryKey: ['insights-trends'], queryFn: () => fetcher(`/reports/trends?from=${new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().slice(0,10)}&to=${today}`) });
  const errorMessage = extractErrorMessage(healthScore.error) || extractErrorMessage(insights.error) || extractErrorMessage(trends.error);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Insight Engine" title="One score, with simple reasons behind it." description="See what is improving, what is slipping, and what to do next." />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card">
          <div className="text-sm text-slate-500">Financial health score</div>
          <div className="mt-2 text-4xl font-bold text-primary">{healthScore.data?.score ?? 0}</div>
          <div className="mt-6 space-y-4">
            {(healthScore.data?.factors || []).map((factor: any) => (
              <div key={factor.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{factor.name}</span>
                  <span>{factor.score}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${factor.score}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{factor.summary}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card h-96 chart-panel">
          <SectionTitle title="Savings trend" description="Six-month view of saving momentum" />
          <ResponsiveContainer>
            <LineChart data={trends.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="savingsRate" stroke="#0f766e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <SectionTitle title="Suggestions" description="High-impact next steps based on the score" />
        <div className="grid gap-3 md:grid-cols-2">
          {(healthScore.data?.suggestions || []).map((suggestion: string) => (
            <div key={suggestion} className="insight-card text-sm text-slate-700">{suggestion}</div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {(insights.data || []).map((item: any) => (
          <div key={item.title} className="card">
            <div className="text-sm font-semibold">{item.title}</div>
            <div className="mt-2 text-sm text-slate-600">{item.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesPage() {
  const { register, handleSubmit, reset, watch } = useForm<RuleFormValues>({
    defaultValues: {
      priority: '100',
      conditionField: 'merchant',
      conditionOperator: 'equals',
      actionType: 'set_category',
      isActive: 'true'
    }
  });
  const qc = useQueryClient();
  const rules = useQuery({ queryKey: ['/rules'], queryFn: () => fetcher('/rules') });
  const categories = useQuery({ queryKey: ['/categories'], queryFn: () => fetcher('/categories') });
  const actionType = watch('actionType');
  const conditionField = watch('conditionField');

  const createRule = useMutation({
    mutationFn: (payload: any) => api.post('/rules', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/rules'] });
      reset({
        priority: '100',
        conditionField: 'merchant',
        conditionOperator: 'equals',
        actionType: 'set_category',
        isActive: 'true',
        name: '',
        conditionValue: '',
        actionValue: ''
      });
    }
  });
  const updateRule = useMutation({
    mutationFn: ({ id, payload }: any) => api.put(`/rules/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/rules'] })
  });
  const deleteRule = useMutation({
    mutationFn: (id: string) => api.delete(`/rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/rules'] })
  });

  const categoryOptions = (categories.data || []).map((category: any) => ({ value: category.id, label: category.name }));
  const errorMessage = extractErrorMessage(rules.error) || extractErrorMessage(categories.error) || extractErrorMessage(createRule.error) || extractErrorMessage(updateRule.error) || extractErrorMessage(deleteRule.error);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Automation Layer" title="Create simple rules for recurring money actions." description="Use merchant, amount, and category rules for categorization, tags, and alerts." />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form
          className="card space-y-3"
          onSubmit={handleSubmit((values) =>
            createRule.mutate({
              name: values.name,
              priority: Number(values.priority),
              condition: {
                field: values.conditionField,
                operator: values.conditionOperator,
                value: values.conditionValue
              },
              action: {
                type: values.actionType,
                value: values.actionValue
              },
              active: values.isActive === 'true'
            })
          )}
        >
          <div>
            <label className="label">Rule name</label>
            <input className="input" {...register('name')} />
          </div>
          <div>
            <label className="label">Priority</label>
            <input type="number" className="input" {...register('priority')} />
          </div>
          <div>
            <label className="label">When field</label>
            <FieldInput field={{ name: 'conditionField', label: 'When field', options: ruleFieldOptions }} register={register} />
          </div>
          <div>
            <label className="label">Operator</label>
            <FieldInput field={{ name: 'conditionOperator', label: 'Operator', options: ruleOperatorOptions }} register={register} />
          </div>
          <div>
            <label className="label">Value</label>
            {conditionField === 'categoryId' ? (
              <FieldInput field={{ name: 'conditionValue', label: 'Value', options: categoryOptions }} register={register} />
            ) : conditionField === 'type' ? (
              <FieldInput field={{ name: 'conditionValue', label: 'Value', options: transactionTypeOptions }} register={register} />
            ) : (
              <input className="input" {...register('conditionValue')} />
            )}
          </div>
          <div>
            <label className="label">Then action</label>
            <FieldInput field={{ name: 'actionType', label: 'Then action', options: ruleActionOptions }} register={register} />
          </div>
          <div>
            <label className="label">Action value</label>
            {actionType === 'set_category' ? (
              <FieldInput field={{ name: 'actionValue', label: 'Action value', options: categoryOptions }} register={register} />
            ) : (
              <input className="input" {...register('actionValue')} />
            )}
          </div>
          <div>
            <label className="label">Status</label>
            <FieldInput field={{ name: 'isActive', label: 'Status', options: [{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }] }} register={register} />
          </div>
          <button className="btn-primary w-full" disabled={createRule.isPending}>Create rule</button>
        </form>
        <div className="card overflow-auto">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Rule</th>
                <th className="py-2">Priority</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(rules.data || []).map((rule: any) => (
                <tr key={rule.id}>
                  <td className="py-3 font-medium">{rule.name}</td>
                  <td className="py-3 text-slate-600">{describeRule(rule)}</td>
                  <td className="py-3">{rule.priority}</td>
                  <td className="py-3">{rule.active ? 'Enabled' : 'Disabled'}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          updateRule.mutate({
                            id: rule.id,
                            payload: {
                              name: rule.name,
                              priority: rule.priority,
                              condition: rule.condition,
                              action: rule.action,
                              active: !rule.active
                            }
                          })
                        }
                      >
                        Toggle
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => deleteRule.mutate(rule.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const { user, logout } = useAuthStore();
  return <div className="space-y-6"><PageHeader eyebrow="Profile & Environment" title="Settings" description="Basic profile and environment information." /><div className="card max-w-xl"><div className="mt-4 space-y-4 text-sm"><div><strong>Name:</strong> {user?.displayName}</div><div><strong>Email:</strong> {user?.email}</div><div><strong>Reset flow:</strong> MailHog or backend console token output.</div><button type="button" className="btn-secondary mt-4 w-full sm:w-auto" onClick={logout}>Logout</button></div></div></div>;
}

function Protected() {
  const auth = useAuthStore();
  if (!auth.accessToken) return <Navigate to="/login" replace />;
  return <Layout><Routes><Route path="/" element={<DashboardPage />} /><Route path="/transactions" element={<TransactionsPage />} /><Route path="/budgets" element={<BudgetsPage />} /><Route path="/goals" element={<ResourcePage title="Goals" endpoint="/goals" fields={[{ name: 'name', label: 'Name' }, { name: 'targetAmount', label: 'Target', type: 'number' }, { name: 'currentAmount', label: 'Current', type: 'number' }]} />} /><Route path="/reports" element={<ReportsPage />} /><Route path="/insights" element={<InsightsPage />} /><Route path="/rules" element={<RulesPage />} /><Route path="/recurring" element={<ResourcePage title="Recurring transactions" endpoint="/recurring" fields={[{ name: 'title', label: 'Title' }, { name: 'transactionType', label: 'Type', options: transactionTypeOptions }, { name: 'frequency', label: 'Frequency', options: recurringFrequencyOptions }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'startDate', label: 'Start', type: 'date' }]} />} /><Route path="/accounts" element={<ResourcePage title="Accounts" endpoint="/accounts" fields={[{ name: 'name', label: 'Name' }, { name: 'type', label: 'Type', options: accountTypeOptions }, { name: 'openingBalance', label: 'Opening balance', type: 'number' }]} />} /><Route path="/settings" element={<SettingsPage />} /></Routes></Layout>;
}

export function App() {
  return <Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/forgot-password" element={<AuthPage mode="forgot" />} /><Route path="*" element={<Protected />} /></Routes>;
}

import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { BarChart, Bar, CartesianGrid, Legend, LineChart, Line, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Navbar, type NavItem } from '../components/Navbar';
import { Topbar } from '../components/Topbar';
import { FinanceCard } from '../components/FinanceCard';
import { ThemeTransition } from '../components/ThemeTransition';
import { Dashboard } from './Dashboard';
import { LandingPage } from './Landing';
import { ErrorBanner } from '../components/ErrorBanner';
import { MotionButton } from '../components/MotionButton';
import { PageWrapper } from '../components/PageWrapper';
import { extractErrorMessage, formatCurrency } from '../utils/ui';
import { downloadReportsPdf } from '../utils/reportExport';

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

function formatMonthLabel(value: unknown) {
  const rawValue = String(value ?? '');
  if (!rawValue) {
    return '';
  }

  if (/^\d{4}-\d{2}$/.test(rawValue)) {
    const [year, month] = rawValue.split('-').map(Number);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      year: '2-digit'
    }).format(new Date(year, month - 1, 1));
  }

  return rawValue;
}

function formatCompactCurrency(value: unknown) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatPercentLabel(value: unknown) {
  const amount = Number(value ?? 0);
  return `${Number.isFinite(amount) ? amount.toFixed(0) : '0'}%`;
}

function truncateLabel(value: unknown, limit = 12) {
  const label = String(value ?? '');
  return label.length > limit ? `${label.slice(0, limit - 1)}…` : label;
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
      <Topbar items={nav} user={user} onLogout={logout} />
      <div className="app-body">
        <div className="lg:hidden">
          <Navbar items={nav} user={user} onLogout={logout} isCollapsed={false} onToggleCollapse={() => {}} />
        </div>
        <main className="app-main" data-scroll-root="true">
          <div className="content-wrap">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<Record<string, string>>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const carouselSlides = [
    {
      eyebrow: 'Forecast',
      title: 'See your month ahead.',
      body: 'Track your balance, spot risk early, and stay in control.',
      tone: 'cool',
      stats: [
        { label: 'Projection', value: '31 days' },
        { label: 'Signal quality', value: 'Live' }
      ]
    },
    {
      eyebrow: 'Budgets',
      title: 'Keep spending easy to read.',
      body: 'Watch category pacing and catch overspending faster.',
      tone: 'warm',
      stats: [
        { label: 'Guardrails', value: 'Category-based' },
        { label: 'Alerts', value: 'Smart' }
      ]
    },
    {
      eyebrow: 'Automation',
      title: 'Let rules handle the repeat work.',
      body: 'Auto-sort activity, trigger alerts, and save time.',
      tone: 'emerald',
      stats: [
        { label: 'Rules', value: 'Custom' },
        { label: 'Actions', value: 'Instant' }
      ]
    }
  ] as const;
  const [activeSlide, setActiveSlide] = useState(0);
  const authLinks = [
    { key: 'login', label: 'Login', to: '/login' },
    { key: 'register', label: 'Create account', to: '/register' }
  ].filter((link) => link.key !== mode);
  const mutation = useMutation({
    mutationFn: (payload: any) => api.post(`/auth/${mode === 'register' ? 'register' : 'login'}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data);
      navigate('/');
    }
  });
  const errorMessage = extractErrorMessage(mutation.error);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % carouselSlides.length);
    }, 4600);

    return () => window.clearInterval(interval);
  }, [carouselSlides.length]);

  return (
    <PageWrapper pageKey={`auth-${mode}`} className="auth-page-shell overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="auth-shell">
        <div className="auth-showcase">
          <div className="flex items-start justify-between gap-4">
            <div className="brand-pill">Personal Finance Tracker</div>
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              <span className="theme-toggle-orb" />
              <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            </button>
          </div>
          <div className="auth-carousel-shell">
            <div className="auth-carousel-grid">
              <div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${mode}-${activeSlide}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  >
                    <div className="auth-slide-pill">{carouselSlides[activeSlide].eyebrow}</div>
                    <h1 className="auth-hero-title">
                      {carouselSlides[activeSlide].title}
                    </h1>
                    <p className="auth-hero-copy">
                      {carouselSlides[activeSlide].body}
                    </p>
                    <div className="auth-stats-grid mt-6 grid gap-3 sm:grid-cols-2">
                      {carouselSlides[activeSlide].stats.map((stat) => (
                        <div key={stat.label} className="auth-stat">
                          <div className="auth-stat-label">{stat.label}</div>
                          <div className="auth-stat-value">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="auth-orbit-panel">
                <div className={`auth-orbit-card auth-orbit-${carouselSlides[activeSlide].tone}`}>
                  <div className="auth-orbit-line" />
                  <div className="auth-orbit-line short" />
                  <div className="auth-orbit-line wide" />
                  <div className="auth-orbit-chip">Live preview</div>
                  <div className="auth-orbit-footprint">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
            <div className="auth-carousel-dots">
              {carouselSlides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  className={`auth-carousel-dot ${index === activeSlide ? 'is-active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="auth-metrics-grid mt-8 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Forecasting" value="Daily" meta="Month-end balance view" tone="cool" />
            <MetricCard label="Health Score" value="0-100" meta="Savings and cash buffer" tone="emerald" />
            <MetricCard label="Automation" value="Rules" meta="Categories, tags, alerts" tone="warm" />
          </div>
        </div>
        <div className="auth-card">
          <div className="flex items-start justify-between gap-4">
            <div className="kicker">{mode === 'register' ? 'Create account' : 'Sign in'}</div>
            <button type="button" className="theme-toggle theme-toggle-compact" onClick={toggleTheme}>
              <span className="theme-toggle-orb" />
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
          <h2 className="auth-form-title mt-3 text-2xl font-semibold capitalize text-slate-950 dark:text-white">
            {mode === 'register' ? 'Create your account' : 'Login'}
          </h2>
          <p className="auth-form-copy mt-2 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'register'
              ? 'Start tracking everything in one place.'
              : 'Enter your email and password.'}
          </p>
          <form className="auth-form mt-8 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            {mode !== 'login' && <div><label className="label">Display name</label><input className="input" {...register('displayName')} /></div>}
            <div><label className="label">Email</label><input className="input" {...register('email')} /></div>
            <div><label className="label">Password</label><input type="password" className="input" {...register('password')} /></div>
            {errorMessage && <ErrorBanner message={errorMessage} />}
            <MotionButton type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Please wait...'
                : mode === 'register'
                  ? 'Create account'
                  : 'Login'}
            </MotionButton>
          </form>
          <div className="auth-links mt-5 flex flex-wrap gap-3 text-sm">
            {authLinks.map((link) => (
              <NavLink key={link.key} className="text-primary underline-offset-4 hover:underline" to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function ResourcePage({ title, endpoint, fields }: { title: string; endpoint: string; fields: Field[] }) {
  const { register, handleSubmit, reset } = useForm<Record<string, string>>();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: [endpoint], queryFn: () => fetcher(endpoint) });
  const mutation = useMutation({ mutationFn: (payload: any) => api.post(endpoint, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: [endpoint] }); reset(); } });
  const rows = Array.isArray(query.data) ? query.data : query.data?.content ?? [];
  const errorMessage = extractErrorMessage(mutation.error) || extractErrorMessage(query.error);

  return (
    <PageWrapper pageKey={`resource-${endpoint}`} className="space-y-6">
      <PageHeader eyebrow="Workspace" title={title} description={`Add and review ${title.toLowerCase()} in one place.`} />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <FinanceCard interactive={false} className="space-y-3">
          <form className="space-y-3" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            {fields.map((field) => (
              <div key={field.name}>
                <label className="label">{field.label}</label>
                <FieldInput field={field} register={register} />
              </div>
            ))}
            <MotionButton type="submit" className="w-full">
              Add
            </MotionButton>
          </form>
        </FinanceCard>
        <FinanceCard interactive={false} className="overflow-auto list-fade-mask">
          <table className="data-table w-full text-left text-sm">
            <thead>
              <tr>
                {fields.map((field) => (
                  <th key={field.name} className="py-2">
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  {fields.map((field) => (
                    <td key={field.name} className="py-3">
                      {renderResourceCell(row, field)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </FinanceCard>
      </div>
    </PageWrapper>
  );
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
    <PageWrapper pageKey="transactions" className="space-y-6">
      <PageHeader eyebrow="Money Flow" title="Transactions" description="Add expenses, income, and transfers with cleaner transaction details." />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <FinanceCard interactive={false}>
          <form
            className="space-y-3"
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
            <MotionButton type="submit" className="w-full" disabled={!accountOptions.length || (selectedType !== 'TRANSFER' && !categoryOptions.length)}>
              Add
            </MotionButton>
            {!accountOptions.length && <p className="text-sm text-slate-500">Create an account first from the Accounts page.</p>}
          </form>
        </FinanceCard>
        <FinanceCard interactive={false} className="overflow-auto list-fade-mask">
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
        </FinanceCard>
      </div>
    </PageWrapper>
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
  const enteredAmount = Number(watch('amount') || 0);
  const existingBudget = rows.find((row: any) => row.categoryId === selectedCategoryId);
  const existingBudgetAmount = Number(existingBudget?.amount ?? 0);
  const combinedBudgetAmount = Number((existingBudgetAmount + enteredAmount).toFixed(2));
  const errorMessage =
    extractErrorMessage(createBudget.error) ||
    extractErrorMessage(updateBudget.error) ||
    extractErrorMessage(budgets.error) ||
    extractErrorMessage(categories.error);

  return (
    <PageWrapper pageKey="budgets" className="space-y-6">
      <PageHeader eyebrow="Discipline Layer" title="Budgets" description="Track category limits and spot overspending early." />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <FinanceCard interactive={false}>
          <form
            className="space-y-3"
            onSubmit={handleSubmit((values) => {
              const requestedAmount = Number(values.amount || 0);
              const nextBudgetAmount = Number((existingBudgetAmount + requestedAmount).toFixed(2));
              const payload = {
                categoryId: values.categoryId,
                amount: values.amount,
                budgetMonth: Number(values.budgetMonth),
                budgetYear: Number(values.budgetYear)
              };

              if (existingBudget) {
                const shouldUpdate = window.confirm(
                  `Budget already exists for ${existingBudget.categoryName}. Current budget is ${formatCurrency(existingBudgetAmount)}. Add ${formatCurrency(requestedAmount)} and update it to ${formatCurrency(nextBudgetAmount)}?`
                );

                if (!shouldUpdate) {
                  return;
                }

                updateBudget.mutate({
                  id: existingBudget.id,
                  payload: {
                    ...payload,
                    amount: nextBudgetAmount.toFixed(2)
                  }
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
                A budget already exists for this category in the selected month. New entries will be added to the current budget.
                {enteredAmount > 0 ? ` Current: ${formatCurrency(existingBudgetAmount)}. New total: ${formatCurrency(combinedBudgetAmount)}.` : ''}
              </div>
            ) : null}
            <MotionButton type="submit" className="w-full" disabled={!categoryOptions.length || createBudget.isPending || updateBudget.isPending}>
              {createBudget.isPending || updateBudget.isPending ? 'Saving...' : existingBudget ? 'Add to budget' : 'Add budget'}
            </MotionButton>
            {!categoryOptions.length && <p className="text-sm text-slate-500">Create an expense category first from Categories (created automatically on signup).</p>}
          </form>
        </FinanceCard>
        <FinanceCard interactive={false} className="overflow-auto list-fade-mask">
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
        </FinanceCard>
      </div>
    </PageWrapper>
  );
}

function DashboardPage() {
  return (
    <PageWrapper pageKey="dashboard">
      <Dashboard />
    </PageWrapper>
  );
}

function ReportsPage() {
  const from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to = new Date().toISOString().slice(0,10);
  const categoryChartRef = useRef<HTMLDivElement | null>(null);
  const trendChartRef = useRef<HTMLDivElement | null>(null);
  const savingsChartRef = useRef<HTMLDivElement | null>(null);
  const netWorthChartRef = useRef<HTMLDivElement | null>(null);
  const category = useQuery({ queryKey: ['report-category'], queryFn: () => fetcher(`/reports/category-spend?from=${from}&to=${to}`) });
  const trend = useQuery({ queryKey: ['report-trend'], queryFn: () => fetcher(`/reports/income-vs-expense?from=${from}&to=${to}`) });
  const advancedTrends = useQuery({ queryKey: ['advanced-trends'], queryFn: () => fetcher(`/reports/trends?from=${new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().slice(0,10)}&to=${to}`) });
  const netWorth = useQuery({ queryKey: ['net-worth'], queryFn: () => fetcher('/reports/net-worth') });
  const categoryData = (Array.isArray(category.data) ? category.data : []).slice().sort((left: any, right: any) => Number(right.amount ?? 0) - Number(left.amount ?? 0));
  const trendData = Array.isArray(trend.data) ? trend.data : [];
  const advancedTrendData = Array.isArray(advancedTrends.data) ? advancedTrends.data : [];
  const netWorthData = Array.isArray(netWorth.data) ? netWorth.data : [];
  const totalCategorySpend = categoryData.reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
  const latestTrend = trendData[trendData.length - 1];
  const latestSavingsPoint = advancedTrendData[advancedTrendData.length - 1];
  const bestSavingsPoint = advancedTrendData.reduce((best: any, point: any) => {
    if (!best || Number(point.savingsRate ?? 0) > Number(best.savingsRate ?? 0)) {
      return point;
    }
    return best;
  }, null);
  const latestNetWorth = netWorthData[netWorthData.length - 1];
  const previousNetWorth = netWorthData[netWorthData.length - 2];
  const netWorthChange = latestNetWorth && previousNetWorth
    ? Number(latestNetWorth.netWorth ?? 0) - Number(previousNetWorth.netWorth ?? 0)
    : null;
  const categoryDetails = [
    `Total expense shown in this range: ${formatCurrency(totalCategorySpend)}.`,
    categoryData[0]
      ? `Top category is ${categoryData[0].category} at ${formatCurrency(categoryData[0].amount)}.`
      : 'No category spend data is available yet.',
    `Categories included in the chart: ${categoryData.length}.`
  ];
  const trendDetails = [
    latestTrend
      ? `Latest month ${formatMonthLabel(latestTrend.month)} shows income of ${formatCurrency(latestTrend.income)} and expense of ${formatCurrency(latestTrend.expense)}.`
      : 'No monthly income or expense data is available yet.',
    latestTrend
      ? `Net movement for the latest month is ${formatCurrency(Number(latestTrend.income ?? 0) - Number(latestTrend.expense ?? 0))}.`
      : 'Net movement will appear once monthly data is available.',
    `Months included in this view: ${trendData.length}.`
  ];
  const savingsDetails = [
    latestSavingsPoint
      ? `Latest savings rate is ${formatPercentLabel(latestSavingsPoint.savingsRate)} for ${formatMonthLabel(latestSavingsPoint.period)}.`
      : 'No savings trend data is available yet.',
    bestSavingsPoint
      ? `Best savings month in this range is ${formatMonthLabel(bestSavingsPoint.period)} at ${formatPercentLabel(bestSavingsPoint.savingsRate)}.`
      : 'A best savings month will appear once enough data exists.',
    latestSavingsPoint?.topCategory
      ? `Top spend category in the latest point is ${latestSavingsPoint.topCategory} at ${formatCurrency(latestSavingsPoint.topCategoryAmount)}.`
      : 'No top spend category is available for the latest trend point.'
  ];
  const netWorthDetails = [
    latestNetWorth
      ? `Latest estimated net worth is ${formatCurrency(latestNetWorth.netWorth)} in ${formatMonthLabel(latestNetWorth.month)}.`
      : 'No net worth data is available yet.',
    netWorthChange !== null
      ? `Change from the previous month is ${formatCurrency(netWorthChange)}.`
      : 'Net worth change will appear after at least two monthly points exist.',
    latestNetWorth
      ? `Current assets baseline is ${formatCurrency(latestNetWorth.assets)}.`
      : 'Current assets will appear once account data is available.'
  ];
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
  const pdfExportMutation = useMutation({
    mutationFn: async () =>
      downloadReportsPdf({
        from,
        to,
        categoryData,
        trendData,
        advancedTrendData,
        netWorthData,
        charts: [
          {
            title: 'Category Spend',
            description: "Highest expense buckets for the selected period.",
            details: categoryDetails,
            element: categoryChartRef.current
          },
          {
            title: 'Income vs Expense',
            description: 'Monthly inflow and outflow comparison.',
            details: trendDetails,
            element: trendChartRef.current
          },
          {
            title: 'Savings Rate Trend',
            description: 'Monthly savings rate movement across the selected period.',
            details: savingsDetails,
            element: savingsChartRef.current
          },
          {
            title: 'Net Worth Tracking',
            description: 'Estimated balance trajectory over time.',
            details: netWorthDetails,
            element: netWorthChartRef.current
          }
        ]
      })
  });
  const errorMessage = extractErrorMessage(category.error) || extractErrorMessage(trend.error) || extractErrorMessage(advancedTrends.error) || extractErrorMessage(netWorth.error) || extractErrorMessage(exportMutation.error) || extractErrorMessage(pdfExportMutation.error);

  return (
    <PageWrapper pageKey="reports" className="space-y-6">
      <PageHeader
        eyebrow="Advanced Reporting"
        title="Spending, savings, and net worth over time."
        description="Compare category trends, savings rate, and balance movement with simpler visuals."
        actions={
          <div className="flex flex-wrap gap-3">
            <MotionButton variant="secondary" onClick={() => pdfExportMutation.mutate()} disabled={pdfExportMutation.isPending}>
              {pdfExportMutation.isPending ? 'Preparing PDF...' : 'Download PDF report'}
            </MotionButton>
            <MotionButton onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
              {exportMutation.isPending ? 'Preparing CSV...' : 'Download CSV export'}
            </MotionButton>
          </div>
        }
      />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-2">
        <FinanceCard className="h-[26rem] chart-panel">
          <SectionTitle title="Category spend" description="Top expense buckets in the selected period" />
          <div ref={categoryChartRef} className="h-[20rem] w-full">
            <ResponsiveContainer>
              <BarChart data={categoryData.slice(0, 6)} layout="vertical" margin={{ top: 8, right: 18, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCompactCurrency} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="category" type="category" width={110} tickFormatter={(value) => truncateLabel(value, 14)} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#0f766e" radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FinanceCard>
        <FinanceCard className="h-[26rem] chart-panel">
          <SectionTitle title="Income vs expense" description="Monthly inflow versus outflow with clearer scaling" />
          <div ref={trendChartRef} className="h-[20rem] w-full">
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 8, right: 12, left: 6, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonthLabel} minTickGap={24} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="income" tickFormatter={formatCompactCurrency} width={64} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="expense" orientation="right" tickFormatter={formatCompactCurrency} width={64} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  labelFormatter={formatMonthLabel}
                  formatter={(value, name) => [formatCurrency(value), name === 'income' ? 'Income' : 'Expense']}
                />
                <Legend />
                <Line yAxisId="income" type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line yAxisId="expense" type="monotone" dataKey="expense" name="Expense" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </FinanceCard>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <FinanceCard className="h-[26rem] chart-panel">
          <SectionTitle title="Savings rate trend" description="A cleaner view of monthly saving momentum" />
          <div ref={savingsChartRef} className="h-[20rem] w-full">
            <ResponsiveContainer>
              <LineChart data={advancedTrendData} margin={{ top: 8, right: 12, left: 6, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tickFormatter={formatMonthLabel} minTickGap={24} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={formatPercentLabel} width={54} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={formatMonthLabel} formatter={(value) => formatPercentLabel(value)} />
                <Line type="monotone" dataKey="savingsRate" stroke="#0891b2" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </FinanceCard>
        <FinanceCard className="h-[26rem] chart-panel">
          <SectionTitle title="Net worth tracking" description="Estimated balance trajectory with clearer spacing" />
          <div ref={netWorthChartRef} className="h-[20rem] w-full">
            <ResponsiveContainer>
              <LineChart data={netWorthData} margin={{ top: 8, right: 12, left: 6, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonthLabel} minTickGap={24} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatCompactCurrency} width={64} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip labelFormatter={formatMonthLabel} formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="netWorth" stroke="#7c3aed" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </FinanceCard>
      </div>
    </PageWrapper>
  );
}

function InsightsPage() {
  const healthScore = useQuery({ queryKey: ['insights-health'], queryFn: () => fetcher('/insights/health-score') });
  const insights = useQuery({ queryKey: ['insights-list'], queryFn: () => fetcher('/insights') });
  const trends = useQuery({ queryKey: ['insights-trends'], queryFn: () => fetcher(`/reports/trends?from=${new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().slice(0,10)}&to=${today}`) });
  const errorMessage = extractErrorMessage(healthScore.error) || extractErrorMessage(insights.error) || extractErrorMessage(trends.error);

  return (
    <PageWrapper pageKey="insights" className="space-y-6">
      <PageHeader eyebrow="Insight Engine" title="One score, with simple reasons behind it." description="See what is improving, what is slipping, and what to do next." />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <FinanceCard interactive={false}>
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
        </FinanceCard>
        <FinanceCard className="h-96 chart-panel">
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
        </FinanceCard>
      </div>
      <FinanceCard>
        <SectionTitle title="Suggestions" description="High-impact next steps based on the score" />
        <div className="grid gap-3 md:grid-cols-2">
          {(healthScore.data?.suggestions || []).map((suggestion: string) => (
            <div key={suggestion} className="insight-card text-sm text-slate-700">{suggestion}</div>
          ))}
        </div>
      </FinanceCard>
      <div className="grid gap-4 md:grid-cols-3">
        {(insights.data || []).map((item: any) => (
          <FinanceCard key={item.title}>
            <div className="text-sm font-semibold">{item.title}</div>
            <div className="mt-2 text-sm text-slate-600">{item.message}</div>
          </FinanceCard>
        ))}
      </div>
    </PageWrapper>
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
    <PageWrapper pageKey="rules" className="space-y-6">
      <PageHeader eyebrow="Automation Layer" title="Create simple rules for recurring money actions." description="Use merchant, amount, and category rules for categorization, tags, and alerts." />
      {errorMessage && <ErrorBanner message={errorMessage} />}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <FinanceCard>
          <form
            className="space-y-3"
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
            <MotionButton type="submit" className="w-full" disabled={createRule.isPending}>Create rule</MotionButton>
          </form>
        </FinanceCard>
        <FinanceCard interactive={false} className="overflow-auto list-fade-mask">
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
                      <MotionButton
                        type="button"
                        variant="secondary"
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
                      </MotionButton>
                      <MotionButton type="button" variant="secondary" onClick={() => deleteRule.mutate(rule.id)}>Delete</MotionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FinanceCard>
      </div>
    </PageWrapper>
  );
}

function SettingsPage() {
  const { user, logout, setAuth } = useAuthStore();
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors }
  } = useForm<{ displayName: string; email: string }>({
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || ''
    }
  });
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    setError: setPasswordError,
    formState: { errors: passwordErrors }
  } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    resetProfile({
      displayName: user?.displayName || '',
      email: user?.email || ''
    });
  }, [user, resetProfile]);

  const onSaveProfile = handleProfileSubmit((values) => {
    if (!user?.id) {
      setProfileMessage('Please re-login to update your profile.');
      return;
    }
    const nextUser = {
      id: user.id,
      displayName: values.displayName,
      email: values.email
    };
    setAuth({ user: nextUser });
    setProfileMessage('Saved.');
    window.setTimeout(() => setProfileMessage(null), 2000);
  });

  const onChangePassword = handlePasswordSubmit((values) => {
    if (values.newPassword !== values.confirmPassword) {
      setPasswordError('confirmPassword', { type: 'validate', message: 'Passwords do not match.' });
      return;
    }
    setPasswordMessage('Password update saved locally. Server sync coming soon.');
    resetPassword();
    window.setTimeout(() => setPasswordMessage(null), 2400);
  });

  return (
    <PageWrapper pageKey="settings" className="space-y-6">
      <PageHeader
        eyebrow="Profile & Security"
        title="Settings"
        description="Edit your profile and update your password."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <FinanceCard className="space-y-5">
          <SectionTitle title="Profile" description="Update your name and email." />
          {profileMessage ? (
            <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              {profileMessage}
            </div>
          ) : null}
          <form className="space-y-4" onSubmit={onSaveProfile}>
            <div>
              <label className="label">Display name</label>
              <input className="input" {...registerProfile('displayName', { required: 'Display name is required.' })} />
              {profileErrors.displayName ? (
                <div className="mt-2 text-xs text-rose-500">{profileErrors.displayName.message}</div>
              ) : null}
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" {...registerProfile('email', { required: 'Email is required.' })} />
              {profileErrors.email ? (
                <div className="mt-2 text-xs text-rose-500">{profileErrors.email.message}</div>
              ) : (
                <div className="mt-2 text-xs text-slate-400">Email changes will require verification.</div>
              )}
            </div>
            <MotionButton type="submit" variant="primary" className="w-full sm:w-auto">
              Save profile
            </MotionButton>
          </form>
        </FinanceCard>

        <FinanceCard className="space-y-5">
          <SectionTitle title="Password" description="Use your current password to set a new one." />
          {passwordMessage ? (
            <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              {passwordMessage}
            </div>
          ) : null}
          <form className="space-y-4" onSubmit={onChangePassword}>
            <div>
              <label className="label">Current password</label>
              <input className="input" type="password" {...registerPassword('currentPassword', { required: 'Current password is required.' })} />
              {passwordErrors.currentPassword ? (
                <div className="mt-2 text-xs text-rose-500">{passwordErrors.currentPassword.message}</div>
              ) : null}
            </div>
            <div>
              <label className="label">New password</label>
              <input
                className="input"
                type="password"
                {...registerPassword('newPassword', { required: 'New password is required.', minLength: { value: 8, message: 'Minimum 8 characters.' } })}
              />
              {passwordErrors.newPassword ? (
                <div className="mt-2 text-xs text-rose-500">{passwordErrors.newPassword.message}</div>
              ) : null}
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" {...registerPassword('confirmPassword', { required: 'Please confirm your new password.' })} />
              {passwordErrors.confirmPassword ? (
                <div className="mt-2 text-xs text-rose-500">{passwordErrors.confirmPassword.message}</div>
              ) : null}
            </div>
            <MotionButton type="submit" variant="primary" className="w-full sm:w-auto">
              Update password
            </MotionButton>
            <div className="text-xs text-slate-400">Password updates will be verified on the server once email verification is enabled.</div>
          </form>
        </FinanceCard>
      </div>

      <FinanceCard className="max-w-xl">
        <SectionTitle title="Session" description="Manage your current session." />
        <MotionButton type="button" variant="secondary" className="w-full sm:w-auto" onClick={logout}>
          Logout
        </MotionButton>
      </FinanceCard>
    </PageWrapper>
  );
}

function Protected() {
  const auth = useAuthStore();
  if (!auth.accessToken) return <Navigate to="/login" replace />;
  return <Layout><Routes><Route path="/" element={<DashboardPage />} /><Route path="/transactions" element={<TransactionsPage />} /><Route path="/budgets" element={<BudgetsPage />} /><Route path="/goals" element={<ResourcePage title="Goals" endpoint="/goals" fields={[{ name: 'name', label: 'Name' }, { name: 'targetAmount', label: 'Target', type: 'number' }, { name: 'currentAmount', label: 'Current', type: 'number' }]} />} /><Route path="/reports" element={<ReportsPage />} /><Route path="/insights" element={<InsightsPage />} /><Route path="/rules" element={<RulesPage />} /><Route path="/recurring" element={<ResourcePage title="Recurring transactions" endpoint="/recurring" fields={[{ name: 'title', label: 'Title' }, { name: 'transactionType', label: 'Type', options: transactionTypeOptions }, { name: 'frequency', label: 'Frequency', options: recurringFrequencyOptions }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'startDate', label: 'Start', type: 'date' }]} />} /><Route path="/accounts" element={<ResourcePage title="Accounts" endpoint="/accounts" fields={[{ name: 'name', label: 'Name' }, { name: 'type', label: 'Type', options: accountTypeOptions }, { name: 'openingBalance', label: 'Opening balance', type: 'number' }]} />} /><Route path="/settings" element={<SettingsPage />} /></Routes></Layout>;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll<HTMLElement>('[data-scroll-root="true"]').forEach((element) => {
      element.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [pathname]);

  return null;
}

export function App() {
  const auth = useAuthStore();
  return (
    <>
      <ScrollToTop />
      <ThemeTransition />
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/" element={auth.accessToken ? <Protected /> : <LandingPage />} />
        <Route path="*" element={<Protected />} />
      </Routes>
    </>
  );
}

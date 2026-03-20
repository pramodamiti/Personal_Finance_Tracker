import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, CartesianGrid, LineChart, Line, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';

const nav = [
  ['/', 'Dashboard'], ['/transactions', 'Transactions'], ['/budgets', 'Budgets'], ['/goals', 'Goals'], ['/reports', 'Reports'], ['/recurring', 'Recurring'], ['/accounts', 'Accounts'], ['/settings', 'Settings']
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

const transactionTypeOptions = ['EXPENSE', 'INCOME', 'TRANSFER'].map(toOption);
const accountTypeOptions = ['BANK_ACCOUNT', 'CREDIT_CARD', 'CASH_WALLET', 'SAVINGS_ACCOUNT'].map(toOption);
const recurringFrequencyOptions = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map(toOption);
const paymentMethodOptions = ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_WALLET', 'OTHER'].map(toOption);
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

function extractErrorMessage(error: any): string | undefined {
  const data = error?.response?.data;

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (data?.errors && typeof data.errors === 'object') {
    return Object.entries(data.errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return undefined;
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

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-primary p-6 text-white">
        <div className="mb-8 text-2xl font-bold">Finance Tracker</div>
        <nav className="space-y-2">{nav.map(([href, label]) => <NavLink key={href} to={href} className="block rounded-xl px-3 py-2 hover:bg-white/10">{label}</NavLink>)}</nav>
        <div className="mt-10 rounded-xl bg-white/10 p-4 text-sm">Signed in as {user?.displayName || 'User'}</div>
        <button className="btn-secondary mt-4 w-full" onClick={logout}>Logout</button>
      </aside>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}

function AuthPage({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<Record<string, string>>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const mutation = useMutation({
    mutationFn: (payload: any) => api.post(`/auth/${mode === 'register' ? 'register' : mode === 'forgot' ? 'forgot-password' : 'login'}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      if (mode !== 'forgot') { setAuth(data); navigate('/'); }
      else alert('If the email exists, a reset token was emitted to the backend console/MailHog.');
    }
  });
  const errorMessage = extractErrorMessage(mutation.error);

  return <div className="mx-auto mt-16 max-w-md card"><h1 className="mb-6 text-2xl font-semibold capitalize">{mode === 'forgot' ? 'Forgot password' : mode}</h1><form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>{mode !== 'forgot' && mode !== 'login' && <div><label className="label">Display name</label><input className="input" {...register('displayName')} /></div>}<div><label className="label">Email</label><input className="input" {...register('email')} /></div>{mode !== 'forgot' && <div><label className="label">Password</label><input type="password" className="input" {...register('password')} /></div>}{errorMessage && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}<button className="btn-primary w-full">Submit</button></form><div className="mt-4 flex flex-wrap gap-3 text-sm"><NavLink className="text-primary underline" to="/login">Login</NavLink><NavLink className="text-primary underline" to="/register">Create account</NavLink><NavLink className="text-primary underline" to="/forgot-password">Forgot password</NavLink></div></div>;
}

function ResourcePage({ title, endpoint, fields }: { title: string; endpoint: string; fields: Field[] }) {
  const { register, handleSubmit, reset } = useForm<Record<string, string>>();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: [endpoint], queryFn: () => fetcher(endpoint) });
  const mutation = useMutation({ mutationFn: (payload: any) => api.post(endpoint, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: [endpoint] }); reset(); } });
  const rows = Array.isArray(query.data) ? query.data : query.data?.content ?? [];
  const errorMessage = extractErrorMessage(mutation.error) || extractErrorMessage(query.error);

  return <div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-3xl font-semibold">{title}</h1></div>{errorMessage && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}<div className="grid gap-6 lg:grid-cols-[320px_1fr]"><form className="card space-y-3" onSubmit={handleSubmit((values) => mutation.mutate(values))}>{fields.map((f) => <div key={f.name}><label className="label">{f.label}</label><FieldInput field={f} register={register} /></div>)}<button className="btn-primary w-full">Add</button></form><div className="card overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b">{fields.map((f) => <th key={f.name} className="py-2">{f.label}</th>)}</tr></thead><tbody>{rows.map((row: any) => <tr key={row.id} className="border-b last:border-b-0">{fields.map((f) => <td key={f.name} className="py-3">{String(row[f.name] ?? '')}</td>)}</tr>)}</tbody></table></div></div></div>;
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Transactions</h1>
      </div>
      {errorMessage && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}
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
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
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
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="py-3">{String(row.type ?? '')}</td>
                  <td className="py-3">{String(row.amount ?? '')}</td>
                  <td className="py-3">{String(row.transactionDate ?? '')}</td>
                  <td className="py-3">{String(row.merchant ?? '')}</td>
                  <td className="py-3">{String(row.accountId ?? '')}</td>
                  <td className="py-3">{String(row.categoryId ?? '')}</td>
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
  const mutation = useMutation({
    mutationFn: (payload: any) => api.post('/budgets', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/budgets', month, year] });
    }
  });

  const categoryOptions = (categories.data || [])
    .filter((category: any) => category.type === 'EXPENSE')
    .map((category: any) => ({ value: category.id, label: category.name }));

  const rows = Array.isArray(budgets.data) ? budgets.data : budgets.data?.content ?? [];
  const errorMessage = extractErrorMessage(mutation.error) || extractErrorMessage(budgets.error) || extractErrorMessage(categories.error);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Budgets</h1>
      </div>
      {errorMessage && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          className="card space-y-3"
          onSubmit={handleSubmit((values) =>
            mutation.mutate({
              categoryId: values.categoryId,
              amount: values.amount,
              budgetMonth: Number(values.budgetMonth),
              budgetYear: Number(values.budgetYear)
            })
          )}
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
          <button className="btn-primary w-full" disabled={!categoryOptions.length}>
            Add
          </button>
          {!categoryOptions.length && <p className="text-sm text-slate-500">Create an expense category first from Categories (created automatically on signup).</p>}
        </form>
        <div className="card overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
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
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="py-3">{String(row.categoryName ?? '')}</td>
                  <td className="py-3">{String(row.amount ?? '')}</td>
                  <td className="py-3">{String(row.spent ?? '')}</td>
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
  const summary = useQuery({ queryKey: ['summary'], queryFn: () => fetcher('/dashboard/summary') });
  const spending = useQuery({ queryKey: ['spending'], queryFn: () => fetcher('/dashboard/spending-by-category') });
  const trend = useQuery({ queryKey: ['trend'], queryFn: () => fetcher('/dashboard/income-vs-expense-trend') });
  const goals = useQuery({ queryKey: ['goals'], queryFn: () => fetcher('/dashboard/goals-overview') });
  const budgets = useQuery({ queryKey: ['budgets'], queryFn: () => fetcher('/dashboard/budget-overview') });
  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Dashboard</h1><div className="grid gap-4 md:grid-cols-4">{['income','expense','net','totalBalances'].map((key) => <div className="card" key={key}><div className="text-sm text-slate-500">{key}</div><div className="mt-2 text-2xl font-bold">${summary.data?.[key] ?? 0}</div></div>)}</div><div className="grid gap-6 lg:grid-cols-2"><div className="card h-80"><h2 className="mb-4 font-semibold">Spending by category</h2><ResponsiveContainer><PieChart><Pie data={spending.data || []} dataKey="amount" nameKey="category" outerRadius={90}>{(spending.data || []).map((_: any, i: number) => <Cell key={i} fill={['#1d4ed8','#16a34a','#f59e0b','#dc2626','#8b5cf6'][i % 5]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="card h-80"><h2 className="mb-4 font-semibold">Income vs expense trend</h2><ResponsiveContainer><LineChart data={trend.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="income" stroke="#16a34a" /><Line type="monotone" dataKey="expense" stroke="#dc2626" /></LineChart></ResponsiveContainer></div></div><div className="grid gap-6 lg:grid-cols-2"><div className="card"><h2 className="mb-4 font-semibold">Budget overview</h2><div className="space-y-3">{(budgets.data || []).map((b: any) => <div key={b.id}><div className="mb-1 flex justify-between text-sm"><span>{b.categoryName}</span><span>${b.spent} / ${b.amount}</span></div><div className="h-3 rounded-full bg-slate-200"><div className="h-3 rounded-full bg-primary" style={{ width: `${Math.min((Number(b.spent) / Number(b.amount || 1)) * 100, 100)}%` }} /></div></div>)}</div></div><div className="card"><h2 className="mb-4 font-semibold">Goal progress</h2><div className="space-y-3">{(goals.data || []).map((g: any) => <div key={g.id}><div className="mb-1 flex justify-between text-sm"><span>{g.name}</span><span>{g.percentage}%</span></div><div className="h-3 rounded-full bg-slate-200"><div className="h-3 rounded-full bg-success" style={{ width: `${Math.min(Number(g.percentage), 100)}%` }} /></div></div>)}</div></div></div></div>;
}

function ReportsPage() {
  const from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
  const to = new Date().toISOString().slice(0,10);
  const category = useQuery({ queryKey: ['report-category'], queryFn: () => fetcher(`/reports/category-spend?from=${from}&to=${to}`) });
  const trend = useQuery({ queryKey: ['report-trend'], queryFn: () => fetcher(`/reports/income-vs-expense?from=${from}&to=${to}`) });
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
  const errorMessage = extractErrorMessage(category.error) || extractErrorMessage(trend.error) || extractErrorMessage(exportMutation.error);

  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Reports</h1>{errorMessage && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}<div className="grid gap-6 lg:grid-cols-2"><div className="card h-80"><ResponsiveContainer><BarChart data={category.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" /><YAxis /><Tooltip /><Bar dataKey="amount" fill="#1d4ed8" /></BarChart></ResponsiveContainer></div><div className="card h-80"><ResponsiveContainer><LineChart data={trend.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line dataKey="income" stroke="#16a34a" /><Line dataKey="expense" stroke="#dc2626" /></LineChart></ResponsiveContainer></div></div><button className="btn-primary" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>{exportMutation.isPending ? 'Preparing CSV...' : 'Download CSV export'}</button></div>;
}

function SettingsPage() {
  const { user } = useAuthStore();
  return <div className="card max-w-xl"><h1 className="mb-4 text-3xl font-semibold">Settings</h1><p className="text-sm text-slate-500">Profile details and environment assumptions for local development.</p><div className="mt-4 space-y-2 text-sm"><div><strong>Name:</strong> {user?.displayName}</div><div><strong>Email:</strong> {user?.email}</div><div><strong>Reset flow:</strong> MailHog or backend console token output.</div></div></div>;
}

function Protected() {
  const auth = useAuthStore();
  if (!auth.accessToken) return <Navigate to="/login" replace />;
  return <Layout><Routes><Route path="/" element={<DashboardPage />} /><Route path="/transactions" element={<TransactionsPage />} /><Route path="/budgets" element={<BudgetsPage />} /><Route path="/goals" element={<ResourcePage title="Goals" endpoint="/goals" fields={[{ name: 'name', label: 'Name' }, { name: 'targetAmount', label: 'Target', type: 'number' }, { name: 'currentAmount', label: 'Current', type: 'number' }]} />} /><Route path="/reports" element={<ReportsPage />} /><Route path="/recurring" element={<ResourcePage title="Recurring transactions" endpoint="/recurring" fields={[{ name: 'title', label: 'Title' }, { name: 'transactionType', label: 'Type', options: transactionTypeOptions }, { name: 'frequency', label: 'Frequency', options: recurringFrequencyOptions }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'startDate', label: 'Start', type: 'date' }]} />} /><Route path="/accounts" element={<ResourcePage title="Accounts" endpoint="/accounts" fields={[{ name: 'name', label: 'Name' }, { name: 'type', label: 'Type', options: accountTypeOptions }, { name: 'openingBalance', label: 'Opening balance', type: 'number' }]} />} /><Route path="/settings" element={<SettingsPage />} /></Routes></Layout>;
}

export function App() {
  return <Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/forgot-password" element={<AuthPage mode="forgot" />} /><Route path="*" element={<Protected />} /></Routes>;
}

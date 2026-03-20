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
  const { register, handleSubmit } = useForm();
  const setAuth = useAuthStore((s) => s.setAuth);
  const mutation = useMutation({
    mutationFn: (payload: any) => api.post(`/auth/${mode === 'register' ? 'register' : mode === 'forgot' ? 'forgot-password' : 'login'}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      if (mode !== 'forgot') { setAuth(data); navigate('/'); }
      else alert('If the email exists, a reset token was emitted to the backend console/MailHog.');
    }
  });
  return <div className="mx-auto mt-16 max-w-md card"><h1 className="mb-6 text-2xl font-semibold capitalize">{mode === 'forgot' ? 'Forgot password' : mode}</h1><form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>{mode !== 'forgot' && mode !== 'login' && <div><label className="label">Display name</label><input className="input" {...register('displayName')} /></div>}<div><label className="label">Email</label><input className="input" {...register('email')} /></div>{mode !== 'forgot' && <div><label className="label">Password</label><input type="password" className="input" {...register('password')} /></div>}<button className="btn-primary w-full">Submit</button></form></div>;
}

function ResourcePage({ title, endpoint, fields }: { title: string; endpoint: string; fields: { name: string; label: string; type?: string }[] }) {
  const { register, handleSubmit, reset } = useForm();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: [endpoint], queryFn: () => fetcher(endpoint) });
  const mutation = useMutation({ mutationFn: (payload: any) => api.post(endpoint, payload), onSuccess: () => { qc.invalidateQueries({ queryKey: [endpoint] }); reset(); } });
  const rows = Array.isArray(query.data) ? query.data : query.data?.content ?? [];
  return <div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-3xl font-semibold">{title}</h1></div><div className="grid gap-6 lg:grid-cols-[320px_1fr]"><form className="card space-y-3" onSubmit={handleSubmit((values) => mutation.mutate(values))}>{fields.map((f) => <div key={f.name}><label className="label">{f.label}</label><input type={f.type || 'text'} className="input" {...register(f.name)} /></div>)}<button className="btn-primary w-full">Add</button></form><div className="card overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b">{fields.map((f) => <th key={f.name} className="py-2">{f.label}</th>)}</tr></thead><tbody>{rows.map((row: any) => <tr key={row.id} className="border-b last:border-b-0">{fields.map((f) => <td key={f.name} className="py-3">{String(row[f.name] ?? '')}</td>)}</tr>)}</tbody></table></div></div></div>;
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
  return <div className="space-y-6"><h1 className="text-3xl font-semibold">Reports</h1><div className="grid gap-6 lg:grid-cols-2"><div className="card h-80"><ResponsiveContainer><BarChart data={category.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" /><YAxis /><Tooltip /><Bar dataKey="amount" fill="#1d4ed8" /></BarChart></ResponsiveContainer></div><div className="card h-80"><ResponsiveContainer><LineChart data={trend.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line dataKey="income" stroke="#16a34a" /><Line dataKey="expense" stroke="#dc2626" /></LineChart></ResponsiveContainer></div></div><a className="btn-primary" href={`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'}/reports/export/csv?from=${from}&to=${to}`}>Download CSV export</a></div>;
}

function SettingsPage() {
  const { user } = useAuthStore();
  return <div className="card max-w-xl"><h1 className="mb-4 text-3xl font-semibold">Settings</h1><p className="text-sm text-slate-500">Profile details and environment assumptions for local development.</p><div className="mt-4 space-y-2 text-sm"><div><strong>Name:</strong> {user?.displayName}</div><div><strong>Email:</strong> {user?.email}</div><div><strong>Reset flow:</strong> MailHog or backend console token output.</div></div></div>;
}

function Protected() {
  const auth = useAuthStore();
  if (!auth.accessToken) return <Navigate to="/login" replace />;
  return <Layout><Routes><Route path="/" element={<DashboardPage />} /><Route path="/transactions" element={<ResourcePage title="Transactions" endpoint="/transactions" fields={[{ name: 'type', label: 'Type' }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'transactionDate', label: 'Date', type: 'date' }, { name: 'merchant', label: 'Merchant' }]} />} /><Route path="/budgets" element={<ResourcePage title="Budgets" endpoint={`/budgets?month=${new Date().getMonth()+1}&year=${new Date().getFullYear()}`} fields={[{ name: 'categoryId', label: 'Category Id' }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'budgetMonth', label: 'Month', type: 'number' }, { name: 'budgetYear', label: 'Year', type: 'number' }]} />} /><Route path="/goals" element={<ResourcePage title="Goals" endpoint="/goals" fields={[{ name: 'name', label: 'Name' }, { name: 'targetAmount', label: 'Target', type: 'number' }, { name: 'currentAmount', label: 'Current', type: 'number' }]} />} /><Route path="/reports" element={<ReportsPage />} /><Route path="/recurring" element={<ResourcePage title="Recurring transactions" endpoint="/recurring" fields={[{ name: 'title', label: 'Title' }, { name: 'transactionType', label: 'Type' }, { name: 'frequency', label: 'Frequency' }, { name: 'amount', label: 'Amount', type: 'number' }, { name: 'startDate', label: 'Start', type: 'date' }]} />} /><Route path="/accounts" element={<ResourcePage title="Accounts" endpoint="/accounts" fields={[{ name: 'name', label: 'Name' }, { name: 'type', label: 'Type' }, { name: 'openingBalance', label: 'Opening balance', type: 'number' }]} />} /><Route path="/settings" element={<SettingsPage />} /></Routes></Layout>;
}

export function App() {
  return <Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/forgot-password" element={<AuthPage mode="forgot" />} /><Route path="*" element={<Protected />} /></Routes>;
}

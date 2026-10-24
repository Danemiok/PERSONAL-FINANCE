import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  LayoutDashboard, ReceiptText, Wallet, Target, ChartNoAxesCombined, Settings,
  Plus, Search, Bell, ArrowDownLeft, ArrowUpRight, PiggyBank, CalendarDays,
  Utensils, Car, ShoppingBag, HeartPulse, GraduationCap, House, BriefcaseBusiness,
  MoreHorizontal, Download, Upload, Trash2, X, Check, Menu, CircleAlert,
  TrendingUp, ChevronDown, ShieldCheck
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AppData, CATEGORIES, Category, Currency, DEFAULT_DATA, Goal, Transaction, TransactionType } from './types'
import { loadData, saveData, exportData, importData } from './storage'
import { availableBalanceKHR, categoryTotals, dayTransactions, formatMoney, lastSevenDays, monthExpenseKHR, monthISO, sumKHR, todayISO, toKHR } from './finance'

type Page = 'Dashboard' | 'Transactions' | 'Budgets' | 'Savings goals' | 'Reports' | 'Settings'
const navItems: { name: Page; icon: typeof LayoutDashboard }[] = [
  { name: 'Dashboard', icon: LayoutDashboard }, { name: 'Transactions', icon: ReceiptText },
  { name: 'Budgets', icon: Wallet }, { name: 'Savings goals', icon: Target },
  { name: 'Reports', icon: ChartNoAxesCombined }, { name: 'Settings', icon: Settings }
]
const categoryIcon: Record<string, typeof Utensils> = {
  Food: Utensils, Transport: Car, Shopping: ShoppingBag, Health: HeartPulse,
  Education: GraduationCap, Bills: House, Salary: BriefcaseBusiness, Allowance: Wallet,
  Family: HeartPulse, Entertainment: MoreHorizontal, Other: MoreHorizontal
}
const chartColors = ['#5B6CFF', '#16A085', '#F59E0B', '#E879F9', '#F97316', '#64748B', '#06B6D4', '#A3A3A3']

function money(n: number, currency: Currency, rate: number) { return formatMoney(n, currency, rate) }
function id() { return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}` }
function todayLong() { return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [page, setPage] = useState<Page>('Dashboard')
  const [currency, setCurrency] = useState<Currency>('KHR')
  const [showAdd, setShowAdd] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterMonth, setFilterMonth] = useState(monthISO())
  const [showAlerts, setShowAlerts] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => { saveData(data) }, [data])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const rate = data.budget.exchangeRate
  const todayTx = dayTransactions(data.transactions)
  const todaySpent = sumKHR(todayTx, rate, 'expense')
  const monthSpent = monthExpenseKHR(data)
  const balance = availableBalanceKHR(data)
  const monthSavings = sumKHR(data.transactions.filter(t => t.date.startsWith(monthISO())), rate, 'saving')
  const monthlyLimitKHR = data.budget.monthlyLimitUSD * rate
  const alerts = [
    ...(todaySpent > data.budget.dailyLimitKHR ? [`You've spent ៛${Math.round(todaySpent - data.budget.dailyLimitKHR).toLocaleString()} over today's guide.`] : []),
    ...(monthSpent > monthlyLimitKHR ? ['Your monthly expense budget has been exceeded.'] : []),
    ...(balance < data.budget.emergencyTargetKHR ? ['Your available balance is below your emergency fund target.'] : [])
  ]

  function update(patch: Partial<AppData>) { setData(prev => ({ ...prev, ...patch })) }
  function addTransaction(t: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) {
    setData(prev => {
      const tx: Transaction = { ...t, id: existingId ?? id(), createdAt: new Date().toISOString() }
      return { ...prev, transactions: existingId ? prev.transactions.map(old => old.id === existingId ? tx : old) : [tx, ...prev.transactions] }
    })
    setShowAdd(false); setEditing(null); setToast(existingId ? 'Transaction updated' : 'Transaction saved')
  }
  function deleteTransaction(transactionId: string) {
    if (!window.confirm('Delete this transaction? This cannot be undone unless you have a backup.')) return
    update({ transactions: data.transactions.filter(t => t.id !== transactionId) })
    setToast('Transaction deleted')
  }
  function deleteGoal(goalId: string) {
    if (!window.confirm('Delete this savings goal?')) return
    update({ goals: data.goals.filter(g => g.id !== goalId) })
  }
  async function handleImport(file?: File) {
    if (!file) return
    try { update(await importData(file)); setToast('Backup restored successfully') }
    catch { setToast('Could not import this file. Choose a valid My Money backup.') }
    if (importRef.current) importRef.current.value = ''
  }
  const filteredTransactions = useMemo(() => data.transactions.filter(t => {
    const matchesSearch = `${t.note} ${t.category} ${t.type}`.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || t.type === filterType
    const matchesMonth = !filterMonth || t.date.startsWith(filterMonth)
    return matchesSearch && matchesType && matchesMonth
  }), [data.transactions, search, filterType, filterMonth])

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Wallet size={21}/></div><div><strong>my money</strong><span>PERSONAL FINANCE</span></div><button className="icon-btn close-mobile" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="profile"><div className="avatar">D</div><div><strong>My finances</strong><span>Personal workspace</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{navItems.map(item => <button key={item.name} className={`nav-item ${page === item.name ? 'active' : ''}`} onClick={() => { setPage(item.name); setMobileNav(false) }}><item.icon size={19}/><span>{item.name}</span>{item.name === 'Transactions' && <small>{data.transactions.length}</small>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="side-tip"><div className="tip-icon"><PiggyBank size={19}/></div><strong>Small steps count</strong><p>Every riel you save brings you closer to your goal.</p><button onClick={() => setPage('Savings goals')}>View savings goals <ArrowUpRight size={14}/></button></div><div className="privacy-note"><ShieldCheck size={15}/> Saved only in this browser</div></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)}/>}
    <main className="main">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu/></button><div><div className="breadcrumb">Personal finance <span>/</span> <b>{page}</b></div><h1>{page === 'Dashboard' ? 'Good to see you!' : page}</h1></div></div><div className="top-actions"><div className="currency-switch"><button className={currency === 'KHR' ? 'selected' : ''} onClick={() => setCurrency('KHR')}>៛ KHR</button><button className={currency === 'USD' ? 'selected' : ''} onClick={() => setCurrency('USD')}>$ USD</button></div><div className="alert-wrap"><button className="icon-btn alert-button" onClick={() => setShowAlerts(v => !v)} aria-label="View alerts"><Bell size={19}/>{alerts.length > 0 && <i/>}</button>{showAlerts && <div className="alert-popover"><strong>Budget alerts</strong>{alerts.length ? alerts.map((a,i) => <p key={i}><CircleAlert size={15}/>{a}</p>) : <p className="muted">You're doing well. No alerts right now.</p>}</div>}</div><button className="primary-btn top-add" onClick={() => { setEditing(null); setShowAdd(true) }}><Plus size={17}/> Add transaction</button></div></header>
      <div className="page-content">
        {page === 'Dashboard' && <Dashboard data={data} currency={currency} rate={rate} todaySpent={todaySpent} monthSpent={monthSpent} balance={balance} monthSavings={monthSavings} onAdd={() => setShowAdd(true)} onPage={setPage} onEdit={t => { setEditing(t); setShowAdd(true) }} />}
        {page === 'Transactions' && <Transactions transactions={filteredTransactions} allCount={data.transactions.length} search={search} setSearch={setSearch} filterType={filterType} setFilterType={setFilterType} filterMonth={filterMonth} setFilterMonth={setFilterMonth} currency={currency} rate={rate} onAdd={() => setShowAdd(true)} onEdit={t => { setEditing(t); setShowAdd(true) }} onDelete={deleteTransaction} />}
        {page === 'Budgets' && <Budgets data={data} update={update} currency={currency} rate={rate} monthSpent={monthSpent} onToast={setToast}/>}
        {page === 'Savings goals' && <Savings data={data} update={update} currency={currency} rate={rate} onToast={setToast} onDelete={deleteGoal}/>}
        {page === 'Reports' && <Reports data={data} currency={currency} rate={rate} month={filterMonth} setMonth={setFilterMonth}/>}
        {page === 'Settings' && <SettingsPage data={data} update={update} onToast={setToast} onExport={() => exportData(data)} onImport={() => importRef.current?.click()} />}
      </div>
      <footer className="footer"><span>My Money <b>·</b> Personal finance, made simple</span><span><ShieldCheck size={14}/> Your data stays in this browser</span></footer>
    </main>
    <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={e => void handleImport(e.target.files?.[0])}/>
    {showAdd && <TransactionModal initial={editing} rate={rate} onClose={() => { setShowAdd(false); setEditing(null) }} onSave={addTransaction}/>}
    {toast && <div className="toast"><Check size={17}/>{toast}</div>}
  </div>
}

function StatCard({ label, value, sub, icon: Icon, tone, progress }: { label: string; value: string; sub: string; icon: typeof Wallet; tone: string; progress?: number }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={18}/></span></div><strong className="stat-value">{value}</strong><div className="stat-sub">{sub}</div>{progress !== undefined && <div className="progress-track"><div className={`progress-fill ${tone}`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}/></div>}</div>
}
function Dashboard({ data, currency, rate, todaySpent, monthSpent, balance, monthSavings, onAdd, onPage, onEdit }: {
  data: AppData; currency: Currency; rate: number; todaySpent: number; monthSpent: number; balance: number; monthSavings: number; onAdd: () => void; onPage: (p: Page) => void; onEdit: (t: Transaction) => void
}) {
  const monthlyLimit = data.budget.monthlyLimitUSD * rate
  const todayPercent = todaySpent / data.budget.dailyLimitKHR * 100
  const monthPercent = monthSpent / monthlyLimit * 100
  const recent = [...data.transactions].sort((a,b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0,5)
  const chart = lastSevenDays(data.transactions, rate)
  const cat = categoryTotals(data.transactions.filter(t => t.date.startsWith(monthISO())), rate).slice(0,5)
  const total = cat.reduce((s,x) => s+x.amount, 0)
  return <>
    <div className="welcome-row"><div><p className="eyebrow">{todayLong()}</p><h2>Your money, in one place.</h2><p className="muted">Every small decision helps you build better money habits.</p></div><button className="primary-btn" onClick={onAdd}><Plus size={17}/> Add transaction</button></div>
    <div className="stats-grid">
      <StatCard label="Available balance" value={money(currency === 'KHR' ? balance : balance/rate, currency, rate)} sub="Starting money + income − expenses − savings" icon={Wallet} tone="purple"/>
      <StatCard label="Spent this month" value={money(currency === 'KHR' ? monthSpent : monthSpent/rate, currency, rate)} sub={`${Math.max(0, Math.round(100-monthPercent))}% of monthly budget left`} icon={ArrowUpRight} tone="orange" progress={monthPercent}/>
      <StatCard label="Spent today" value={money(currency === 'KHR' ? todaySpent : todaySpent/rate, currency, rate)} sub={todaySpent > data.budget.dailyLimitKHR ? 'Above your daily guide' : `${money(currency === 'KHR' ? Math.max(0,data.budget.dailyLimitKHR-todaySpent) : Math.max(0,data.budget.dailyLimitKHR-todaySpent)/rate,currency,rate)} daily guide left`} icon={ReceiptText} tone="blue" progress={todayPercent}/>
      <StatCard label="Saved this month" value={money(currency === 'KHR' ? monthSavings : monthSavings/rate, currency, rate)} sub="Money moved into savings" icon={PiggyBank} tone="green"/>
    </div>
    <div className="content-grid main-charts">
      <section className="panel spending-panel"><div className="panel-heading"><div><h3>Spending overview</h3><p>Daily expenses over the last 7 days</p></div><span className="pill"><CalendarDays size={13}/> This week</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8991a7', fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: '#8991a7', fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : `${v}`}/><Tooltip formatter={(v) => [`៛${Number(v).toLocaleString()}`, 'Spent']} contentStyle={{ borderRadius: 12, border: '1px solid #e9edf5', fontSize: 12 }}/><Bar dataKey="spent" fill="#6675F5" radius={[6,6,0,0]} maxBarSize={32}/></BarChart></ResponsiveContainer></div><div className="chart-foot"><span><i className="legend-dot purple-dot"/> Daily spending</span><strong>{money(currency === 'KHR' ? chart.reduce((s,d)=>s+d.spent,0) : chart.reduce((s,d)=>s+d.spent,0)/rate,currency,rate)} <small>this week</small></strong></div></section>
      <section className="panel budget-panel"><div className="panel-heading"><div><h3>Budget progress</h3><p>Keep your spending on track</p></div><button className="text-button" onClick={() => onPage('Budgets')}>Edit budget <ArrowUpRight size={14}/></button></div>
        <div className="budget-progress-block"><div className="progress-label"><span>Daily spending guide</span><b>{Math.min(100,Math.round(todayPercent))}%</b></div><div className="progress-track large"><div className={`progress-fill ${todayPercent>100?'danger':'blue'}`} style={{width:`${Math.min(100,todayPercent)}%`}}/></div><div className="progress-numbers"><span>{money(currency==='KHR'?todaySpent:todaySpent/rate,currency,rate)} spent</span><span>{money(currency==='KHR'?data.budget.dailyLimitKHR:data.budget.dailyLimitKHR/rate,currency,rate)} limit</span></div></div>
        <div className="budget-progress-block"><div className="progress-label"><span>Monthly budget</span><b>{Math.min(100,Math.round(monthPercent))}%</b></div><div className="progress-track large"><div className={`progress-fill ${monthPercent>100?'danger':'green'}`} style={{width:`${Math.min(100,monthPercent)}%`}}/></div><div className="progress-numbers"><span>{money(currency==='KHR'?monthSpent:monthSpent/rate,currency,rate)} spent</span><span>{money(currency==='KHR'?monthlyLimit:monthlyLimit/rate,currency,rate)} limit</span></div></div>
        <div className="budget-tip"><div><CircleAlert size={17}/></div><p>{todaySpent === 0 ? 'No spending recorded today. Remember to add expenses when you make them.' : todaySpent <= data.budget.dailyLimitKHR ? 'You are within your daily guide. Keep recording every expense.' : 'You are above your daily guide today. Review your balance before spending more.'}</p></div>
      </section>
    </div>
    <div className="content-grid lower-grid">
      <section className="panel recent-panel"><div className="panel-heading"><div><h3>Recent transactions</h3><p>Your latest money activity</p></div><button className="text-button" onClick={() => onPage('Transactions')}>View all <ArrowUpRight size={14}/></button></div>
        {recent.length ? <div className="transaction-list">{recent.map(t => <TransactionRow key={t.id} t={t} rate={rate} onEdit={onEdit}/>)}</div> : <Empty icon={ReceiptText} title="No transactions yet" text="Add your first expense or income to get started." action="Add transaction" onAction={onAdd}/>}
      </section>
      <section className="panel categories-panel"><div className="panel-heading"><div><h3>Top spending categories</h3><p>Where your money goes this month</p></div><button className="text-button" onClick={() => onPage('Reports')}>Reports <ArrowUpRight size={14}/></button></div>
        {cat.length ? <><div className="category-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={cat} dataKey="amount" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="none">{cat.map((_,i)=><Cell key={i} fill={chartColors[i%chartColors.length]}/>)}</Pie><Tooltip formatter={v=>[`៛${Number(v).toLocaleString()}`,'Spent']}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(currency==='KHR'?total:total/rate,currency,rate)}</strong><span>total spent</span></div></div><div className="category-legend">{cat.map((c,i)=><div key={c.name}><span><i style={{background:chartColors[i%chartColors.length]}}/>{c.name}</span><b>{money(currency==='KHR'?c.amount:c.amount/rate,currency,rate)}</b></div>)}</div></> : <Empty icon={ChartNoAxesCombined} title="No spending data" text="Your categories will appear after you record expenses."/>}
      </section>
    </div>
    <div className="quick-actions"><button onClick={onAdd}><span className="qa-icon expense"><ArrowUpRight/></span><span><b>Add expense</b><small>Record what you spent</small></span><Plus size={17}/></button><button onClick={onAdd}><span className="qa-icon income"><ArrowDownLeft/></span><span><b>Add income</b><small>Record money received</small></span><Plus size={17}/></button><button onClick={() => onPage('Savings goals')}><span className="qa-icon savings"><Target/></span><span><b>Set a savings goal</b><small>Plan for your future</small></span><ArrowUpRight size={17}/></button></div>
  </>
}

function Empty({ icon: Icon, title, text, action, onAction }: { icon: typeof Wallet; title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22}/></div><strong>{title}</strong><p>{text}</p>{action && onAction && <button className="secondary-btn" onClick={onAction}>{action}</button>}</div>
}
function TransactionRow({ t, rate, onEdit, onDelete }: { t: Transaction; rate: number; onEdit?: (t: Transaction) => void; onDelete?: (id: string) => void }) {
  const Icon = categoryIcon[t.category] ?? MoreHorizontal
  const isPositive = t.type === 'income'
  const label = t.type === 'saving' ? 'Savings transfer' : t.category
  return <div className="transaction-row"><div className={`tx-icon ${t.type}`}><Icon size={17}/></div><div className="tx-description"><strong>{t.note.trim() || label}</strong><span>{label} · {new Date(`${t.date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span></div><div className={`tx-amount ${isPositive?'positive':t.type==='expense'?'negative':''}`}>{isPositive?'+':t.type==='expense'?'−':'−'}{money(t.amount,t.currency,rate)}</div>{onEdit && <button className="row-action" aria-label="Edit transaction" onClick={() => onEdit(t)}><MoreHorizontal size={17}/></button>}{onDelete && <button className="row-action delete-action" aria-label="Delete transaction" onClick={() => onDelete(t.id)}><Trash2 size={15}/></button>}</div>
}

function Transactions({ transactions, allCount, search, setSearch, filterType, setFilterType, filterMonth, setFilterMonth, currency, rate, onAdd, onEdit, onDelete }: {
  transactions: Transaction[]; allCount: number; search: string; setSearch: (s: string) => void; filterType: string; setFilterType: (s: string) => void; filterMonth: string; setFilterMonth: (s: string) => void; currency: Currency; rate: number; onAdd: () => void; onEdit: (t: Transaction) => void; onDelete: (id: string) => void
}) {
  const total = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+toKHR(t.amount,t.currency,rate),0)
  return <><div className="page-intro"><div><h2>Transaction history</h2><p>Search, filter, and manage your money activity.</p></div><button className="primary-btn" onClick={onAdd}><Plus size={17}/> Add transaction</button></div>
    <div className="stats-grid compact-stats"><StatCard label="Matching records" value={String(transactions.length)} sub={`Of ${allCount} total transactions`} icon={ReceiptText} tone="purple"/><StatCard label="Expenses in view" value={money(currency==='KHR'?total:total/rate,currency,rate)} sub="Based on selected filters" icon={ArrowUpRight} tone="orange"/></div>
    <section className="panel"><div className="filters"><div className="search-field"><Search size={17}/><input placeholder="Search note or category..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={filterType} onChange={e=>setFilterType(e.target.value)}><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option><option value="saving">Savings</option></select><input aria-label="Filter month" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}/><button className="secondary-btn" onClick={()=>{setSearch('');setFilterType('all');setFilterMonth('')}}>Clear filters</button></div>
      {transactions.length ? <div className="transaction-list full-list">{transactions.map(t=><TransactionRow key={t.id} t={t} rate={rate} onEdit={onEdit} onDelete={onDelete}/>)}</div> : <Empty icon={Search} title="No matching transactions" text="Try changing your search or filters, or add a new transaction." action="Add transaction" onAction={onAdd}/>}
    </section>
  </>
}

function Budgets({ data, update, currency, rate, monthSpent, onToast }: { data: AppData; update: (p: Partial<AppData>)=>void; currency: Currency; rate: number; monthSpent: number; onToast: (s:string)=>void }) {
  const [monthly,setMonthly] = useState(String(data.budget.monthlyLimitUSD))
  const [daily,setDaily] = useState(String(data.budget.dailyLimitKHR))
  const [emergency,setEmergency] = useState(String(data.budget.emergencyTargetKHR))
  const [saved,setSaved] = useState(String(data.emergencySavedKHR))
  const limit = Number(monthly)||0
  const monthlyPercent = monthSpent/(limit*rate||1)*100
  function save() {
    update({ budget: {...data.budget, monthlyLimitUSD: Math.max(0,limit), dailyLimitKHR: Math.max(0,Number(daily)||0), emergencyTargetKHR: Math.max(0,Number(emergency)||0)}, emergencySavedKHR: Math.max(0,Number(saved)||0) })
    onToast('Budget settings saved')
  }
  return <><div className="page-intro"><div><h2>Your budget plan</h2><p>Set realistic limits and keep money aside for emergencies.</p></div><button className="primary-btn" onClick={save}><Check size={17}/> Save budget</button></div>
    <div className="stats-grid"><StatCard label="Monthly limit" value={money(currency==='KHR'?limit*rate:limit,currency,rate)} sub="Your monthly spending target" icon={Wallet} tone="purple"/><StatCard label="Monthly budget left" value={money(currency==='KHR'?limit*rate-monthSpent:limit-monthSpent/rate,currency,rate)} sub={`${Math.round(monthlyPercent)}% of budget used`} icon={TrendingUp} tone="green" progress={monthlyPercent}/><StatCard label="Daily guide" value={money(currency==='KHR'?Number(daily)||0:(Number(daily)||0)/rate,currency,rate)} sub="A guide, not a strict rule" icon={CalendarDays} tone="blue"/></div>
    <div className="content-grid"><section className="panel form-panel"><div className="panel-heading"><div><h3>Budget settings</h3><p>Adjust these values any time.</p></div></div><div className="field"><label>Monthly spending limit (USD)</label><input type="number" min="0" step="0.01" value={monthly} onChange={e=>setMonthly(e.target.value)}/><small>Approx. {money(limit*rate,'KHR',rate)}</small></div><div className="field"><label>Daily spending guide (KHR)</label><input type="number" min="0" step="500" value={daily} onChange={e=>setDaily(e.target.value)}/><small>Some days can be higher or zero. Record the real amount.</small></div><div className="field"><label>Emergency fund target (KHR)</label><input type="number" min="0" step="1000" value={emergency} onChange={e=>setEmergency(e.target.value)}/></div><div className="field"><label>Emergency money already set aside (KHR)</label><input type="number" min="0" step="500" value={saved} onChange={e=>setSaved(e.target.value)}/></div><button className="primary-btn full-width" onClick={save}>Save changes</button></section>
      <section className="panel"><div className="panel-heading"><div><h3>Budget status</h3><p>Current month overview</p></div></div><div className="budget-status"><div className="status-icon purple"><Wallet/></div><div><span>Spent this month</span><strong>{money(currency==='KHR'?monthSpent:monthSpent/rate,currency,rate)}</strong></div></div><div className="progress-track large"><div className={`progress-fill ${monthlyPercent>100?'danger':'purple'}`} style={{width:`${Math.min(100,monthlyPercent)}%`}}/></div><div className="progress-numbers"><span>{Math.round(monthlyPercent)}% used</span><span>{money(currency==='KHR'?Math.max(0,limit*rate-monthSpent):Math.max(0,limit-monthSpent/rate),currency,rate)} left</span></div><div className="budget-status"><div className="status-icon orange"><ShieldCheck/></div><div><span>Emergency fund</span><strong>{money(currency==='KHR'?data.emergencySavedKHR:data.emergencySavedKHR/rate,currency,rate)} / {money(currency==='KHR'?Number(emergency)||0:(Number(emergency)||0)/rate,currency,rate)}</strong></div></div><div className="progress-track large"><div className="progress-fill green" style={{width:`${Math.min(100,(Number(emergency)>0?data.emergencySavedKHR/Number(emergency)*100:0))}%`}}/></div><p className="muted small-note">Your emergency fund is tracked separately from the spending balance. Only count money here if you have actually set it aside.</p></section></div>
  </>
}

function Savings({ data, update, currency, rate, onToast, onDelete }: { data: AppData; update: (p: Partial<AppData>)=>void; currency: Currency; rate: number; onToast: (s:string)=>void; onDelete: (id:string)=>void }) {
  const [name,setName] = useState('')
  const [target,setTarget] = useState('17500')
  const [deadline,setDeadline] = useState('')
  const [goalAmount,setGoalAmount] = useState<Record<string,string>>({})
  const [emergencyAdd,setEmergencyAdd] = useState('')
  function addGoal(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || Number(target)<=0) return
    const goal: Goal = {id:id(),name:name.trim(),targetKHR:Number(target),savedKHR:0,deadline}
    update({goals:[...data.goals,goal]}); setName('');setTarget('17500');setDeadline('');onToast('Savings goal created')
  }
  function addSavings(goal:Goal) {
    const amount = Number(goalAmount[goal.id]||0)
    if (amount<=0) { onToast('Enter a savings amount greater than zero'); return }
    const tx: Transaction = {id:id(),type:'saving',amount,currency:'KHR',category:'Other',note:`Saved for ${goal.name}`,date:todayISO(),createdAt:new Date().toISOString()}
    update({goals:data.goals.map(g=>g.id===goal.id?{...g,savedKHR:g.savedKHR+amount}:g),transactions:[tx,...data.transactions]})
    setGoalAmount(prev=>({...prev,[goal.id]:''}));onToast('Savings recorded')
  }
  function addEmergency() {
    const amount=Number(emergencyAdd)
    if(amount<=0){onToast('Enter an amount greater than zero');return}
    const tx: Transaction={id:id(),type:'saving',amount,currency:'KHR',category:'Other',note:'Emergency fund contribution',date:todayISO(),createdAt:new Date().toISOString()}
    update({emergencySavedKHR:data.emergencySavedKHR+amount,transactions:[tx,...data.transactions]})
    setEmergencyAdd('');onToast('Emergency fund updated')
  }
  const totalGoals = data.goals.reduce((s,g)=>s+g.savedKHR,0)
  return <><div className="page-intro"><div><h2>Save for what matters</h2><p>Build savings one small amount at a time.</p></div></div><div className="stats-grid"><StatCard label="Saved toward goals" value={money(currency==='KHR'?totalGoals:totalGoals/rate,currency,rate)} sub="Across all savings goals" icon={PiggyBank} tone="green"/><StatCard label="Emergency fund" value={money(currency==='KHR'?data.emergencySavedKHR:data.emergencySavedKHR/rate,currency,rate)} sub={`Target ${money(currency==='KHR'?data.budget.emergencyTargetKHR:data.budget.emergencyTargetKHR/rate,currency,rate)}`} icon={ShieldCheck} tone="purple" progress={data.emergencySavedKHR/(data.budget.emergencyTargetKHR||1)*100}/></div>
    <section className="panel emergency-panel"><div className="emergency-illustration"><ShieldCheck size={28}/></div><div className="emergency-info"><h3>Emergency fund</h3><p>Money reserved for unexpected expenses. Keep it separate from your everyday spending.</p><div className="progress-track large"><div className="progress-fill green" style={{width:`${Math.min(100,data.emergencySavedKHR/(data.budget.emergencyTargetKHR||1)*100)}%`}}/></div><div className="progress-numbers"><span>{money(currency==='KHR'?data.emergencySavedKHR:data.emergencySavedKHR/rate,currency,rate)} saved</span><span>{money(currency==='KHR'?data.budget.emergencyTargetKHR:data.budget.emergencyTargetKHR/rate,currency,rate)} target</span></div></div><div className="emergency-add"><label>Add money (KHR)</label><div className="inline-add"><input type="number" min="1" value={emergencyAdd} onChange={e=>setEmergencyAdd(e.target.value)} placeholder="e.g. 2000"/><button className="primary-btn" onClick={addEmergency}>Add</button></div></div></section>
    <div className="page-intro goals-heading"><div><h2>Savings goals</h2><p>Create goals and record each contribution.</p></div></div><div className="goals-grid">{data.goals.map(g=><div className="goal-card" key={g.id}><div className="goal-top"><div className="goal-icon"><Target/></div><button className="row-action" onClick={()=>onDelete(g.id)} aria-label="Delete goal"><Trash2 size={15}/></button></div><h3>{g.name}</h3><p className="goal-date">{g.deadline?`Target date: ${g.deadline}`:'No target date set'}</p><div className="goal-amounts"><strong>{money(currency==='KHR'?g.savedKHR:g.savedKHR/rate,currency,rate)}</strong><span>of {money(currency==='KHR'?g.targetKHR:g.targetKHR/rate,currency,rate)}</span></div><div className="progress-track large"><div className="progress-fill purple" style={{width:`${Math.min(100,g.savedKHR/(g.targetKHR||1)*100)}%`}}/></div><div className="progress-numbers"><span>{Math.round(g.savedKHR/(g.targetKHR||1)*100)}% complete</span><span>{money(currency==='KHR'?Math.max(0,g.targetKHR-g.savedKHR):Math.max(0,g.targetKHR-g.savedKHR)/rate,currency,rate)} to go</span></div><div className="inline-add goal-contribute"><input type="number" min="1" placeholder="Amount in KHR" value={goalAmount[g.id]??''} onChange={e=>setGoalAmount(prev=>({...prev,[g.id]:e.target.value}))}/><button className="secondary-btn" onClick={()=>addSavings(g)}>Add savings</button></div></div>)}
      <form className="goal-card new-goal-card" onSubmit={addGoal}><div className="goal-icon dashed"><Plus/></div><h3>Create a goal</h3><div className="field"><label>Goal name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. New bicycle" required/></div><div className="field"><label>Target amount (KHR)</label><input type="number" min="1" value={target} onChange={e=>setTarget(e.target.value)} required/></div><div className="field"><label>Target date (optional)</label><input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)}/></div><button className="primary-btn full-width" type="submit">Create savings goal</button></form>
    </div>
  </>
}

function Reports({ data, currency, rate, month, setMonth }: { data: AppData; currency: Currency; rate: number; month: string; setMonth: (m:string)=>void }) {
  const items = data.transactions.filter(t=>t.date.startsWith(month))
  const expenses=sumKHR(items,rate,'expense'), income=sumKHR(items,rate,'income'), savings=sumKHR(items,rate,'saving')
  const cats=categoryTotals(items,rate)
  const days = Array.from({length: new Date(Number(month.slice(0,4))||new Date().getFullYear(), Number(month.slice(5,7))||new Date().getMonth()+1, 0).getDate()},(_,i)=>{
    const date=`${month}-${String(i+1).padStart(2,'0')}`
    return {day:String(i+1),spent:sumKHR(items.filter(t=>t.date===date),rate,'expense')}
  })
  return <><div className="page-intro"><div><h2>Understand your money</h2><p>Review your spending patterns and progress.</p></div><input className="month-input" type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div>
    <div className="stats-grid"><StatCard label="Total expenses" value={money(currency==='KHR'?expenses:expenses/rate,currency,rate)} sub={`${items.filter(t=>t.type==='expense').length} expense records`} icon={ArrowUpRight} tone="orange"/><StatCard label="Income received" value={money(currency==='KHR'?income:income/rate,currency,rate)} sub="Income recorded this month" icon={ArrowDownLeft} tone="green"/><StatCard label="Moved to savings" value={money(currency==='KHR'?savings:savings/rate,currency,rate)} sub="Savings transactions this month" icon={PiggyBank} tone="purple"/></div>
    <div className="content-grid"><section className="panel report-chart"><div className="panel-heading"><div><h3>Daily expenses</h3><p>Spending by day for the selected month</p></div></div><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={days} margin={{top:10,right:8,left:-15,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6"/><XAxis dataKey="day" interval={Math.max(0,Math.floor(days.length/10)-1)} axisLine={false} tickLine={false} tick={{fill:'#8991a7',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8991a7',fontSize:11}} tickFormatter={v=>v>=1000?`${Math.round(v/1000)}k`:String(v)}/><Tooltip formatter={v=>[`៛${Number(v).toLocaleString()}`,'Spent']}/><Bar dataKey="spent" fill="#6675F5" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></section>
      <section className="panel"><div className="panel-heading"><div><h3>By category</h3><p>Expense breakdown</p></div></div>{cats.length ? <div className="report-categories">{cats.map((c,i)=><div className="report-cat" key={c.name}><div className="report-cat-top"><span><i style={{background:chartColors[i%chartColors.length]}}/>{c.name}</span><b>{money(currency==='KHR'?c.amount:c.amount/rate,currency,rate)}</b></div><div className="progress-track"><div className="progress-fill" style={{background:chartColors[i%chartColors.length],width:`${expenses?c.amount/expenses*100:0}%`}}/></div><small>{expenses?Math.round(c.amount/expenses*100):0}% of expenses</small></div>)}</div> : <Empty icon={ChartNoAxesCombined} title="No report data yet" text="Add expenses to see your spending breakdown."/>}</section></div>
    <section className="panel report-summary"><div className="panel-heading"><div><h3>Monthly summary</h3><p>Selected period: {month || 'all time'}</p></div></div><div className="summary-line"><span>Total income</span><strong className="positive">{money(currency==='KHR'?income:income/rate,currency,rate)}</strong></div><div className="summary-line"><span>Total expenses</span><strong className="negative">−{money(currency==='KHR'?expenses:expenses/rate,currency,rate)}</strong></div><div className="summary-line"><span>Moved to savings</span><strong>−{money(currency==='KHR'?savings:savings/rate,currency,rate)}</strong></div><div className="summary-line total"><span>Income minus expenses and savings</span><strong>{money(currency==='KHR'?income-expenses-savings:(income-expenses-savings)/rate,currency,rate)}</strong></div></section>
  </>
}

function SettingsPage({ data, update, onToast, onExport, onImport }: { data: AppData; update:(p:Partial<AppData>)=>void; onToast:(s:string)=>void; onExport:()=>void; onImport:()=>void }) {
  const [starting,setStarting]=useState(String(data.startingBalanceUSD))
  const [exchange,setExchange]=useState(String(data.budget.exchangeRate))
  const [daily,setDaily]=useState(String(data.budget.dailyLimitKHR))
  const [monthly,setMonthly]=useState(String(data.budget.monthlyLimitUSD))
  function save() {
    if(Number(exchange)<=0 || Number(starting)<0 || Number(daily)<0 || Number(monthly)<0){onToast('Please enter valid positive settings');return}
    update({startingBalanceUSD:Number(starting),budget:{...data.budget,exchangeRate:Number(exchange),dailyLimitKHR:Number(daily),monthlyLimitUSD:Number(monthly)}})
    onToast('Settings saved')
  }
  return <><div className="page-intro"><div><h2>Make it yours</h2><p>Set your money preferences and protect your records.</p></div><button className="primary-btn" onClick={save}><Check size={17}/> Save settings</button></div>
    <div className="content-grid settings-grid"><section className="panel form-panel"><div className="panel-heading"><div><h3>Money preferences</h3><p>Values used in calculations throughout the app.</p></div></div><div className="field"><label>Starting balance (USD)</label><input type="number" min="0" step="0.01" value={starting} onChange={e=>setStarting(e.target.value)}/><small>Default: $25. Use this for your starting money, not new income.</small></div><div className="field"><label>Exchange rate (KHR per $1)</label><input type="number" min="1" step="1" value={exchange} onChange={e=>setExchange(e.target.value)}/><small>Current app rate: $1 = ៛{Number(exchange||0).toLocaleString()}</small></div><div className="field"><label>Daily spending guide (KHR)</label><input type="number" min="0" value={daily} onChange={e=>setDaily(e.target.value)}/></div><div className="field"><label>Monthly spending budget (USD)</label><input type="number" min="0" step="0.01" value={monthly} onChange={e=>setMonthly(e.target.value)}/></div><button className="primary-btn full-width" onClick={save}>Save preferences</button></section>
      <section className="panel data-panel"><div className="panel-heading"><div><h3>Your data</h3><p>Back up or restore your financial records.</p></div></div><div className="data-action"><div className="data-action-icon"><Download/></div><div><strong>Export backup</strong><p>Download your transactions, budgets, and goals as a JSON file.</p><button className="secondary-btn" onClick={onExport}>Export data</button></div></div><div className="data-action"><div className="data-action-icon"><Upload/></div><div><strong>Import backup</strong><p>Restore a previous My Money JSON backup. Current records will be replaced.</p><button className="secondary-btn" onClick={()=>{if(window.confirm('Importing a backup replaces your current data. Continue?'))onImport()}}>Choose backup file</button></div></div><div className="privacy-card"><ShieldCheck size={20}/><div><strong>Local storage privacy</strong><p>Your data is saved in this browser on this device. Anyone with access to your browser profile may be able to view it. Export backups regularly and avoid using a shared computer.</p></div></div><button className="danger-outline" onClick={()=>{if(window.confirm('This will permanently delete all local My Money records. Export a backup first if needed. Continue?')){update({...DEFAULT_DATA,hasSeeded:true});onToast('All local records cleared')}}}><Trash2 size={16}/> Delete all local data</button></section></div>
  </>
}

function TransactionModal({ initial, rate, onClose, onSave }: { initial: Transaction|null; rate:number; onClose:()=>void; onSave:(t:Omit<Transaction,'id'|'createdAt'>,existingId?:string)=>void }) {
  const [type,setType]=useState<TransactionType>(initial?.type??'expense')
  const [amount,setAmount]=useState(initial?String(initial.amount):'')
  const [currency,setCurrency]=useState<Currency>(initial?.currency??'KHR')
  const [category,setCategory]=useState<Category>(initial?.category??'Food')
  const [note,setNote]=useState(initial?.note??'')
  const [date,setDate]=useState(initial?.date??todayISO())
  const [error,setError]=useState('')
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[onClose])
  function submit(e:FormEvent){e.preventDefault();const n=Number(amount);if(!Number.isFinite(n)||n<=0){setError('Enter an amount greater than zero.');return}if(!date){setError('Choose a date.');return}onSave({type,amount:n,currency,category,note:note.trim(),date},initial?.id)}
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><form className="modal" onSubmit={submit}><div className="modal-heading"><div><span className="eyebrow">{initial?'UPDATE RECORD':'NEW RECORD'}</span><h2>{initial?'Edit transaction':'Add transaction'}</h2><p>Record it now so your balance stays accurate.</p></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X/></button></div>
    <div className="type-tabs">{(['expense','income','saving'] as TransactionType[]).map(t=><button key={t} type="button" className={type===t?`active ${t}`:''} onClick={()=>{setType(t);if(t==='income'&&category!=='Salary'&&category!=='Allowance')setCategory('Other');if(t!=='income'&&(category==='Salary'||category==='Allowance'))setCategory('Food')}}>{t==='expense'?'Expense':t==='income'?'Income':'Savings'}</button>)}</div>
    <div className="field"><label>Amount</label><div className="amount-input"><span>{currency==='KHR'?'៛':'$'}</span><input autoFocus type="number" min="0.01" step={currency==='KHR'?'1':'0.01'} value={amount} onChange={e=>setAmount(e.target.value)} placeholder={currency==='KHR'?'3000':'1.00'} required/><select value={currency} onChange={e=>setCurrency(e.target.value as Currency)}><option value="KHR">KHR</option><option value="USD">USD</option></select></div>{amount&&Number(amount)>0&&<small>Equivalent: {money(currency==='KHR'?Number(amount)/rate:Number(amount),'USD',rate)} · {money(currency==='USD'?Number(amount)*rate:Number(amount),'KHR',rate)}</small>}</div>
    <div className="form-two-col"><div className="field"><label>Category</label><select value={category} onChange={e=>setCategory(e.target.value as Category)}>{CATEGORIES.filter(c=>type==='income'?['Salary','Allowance','Other'].includes(c):!['Salary','Allowance'].includes(c)).map(c=><option key={c}>{c}</option>)}</select></div><div className="field"><label>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></div></div>
    <div className="field"><label>Note (optional)</label><input value={note} onChange={e=>setNote(e.target.value)} placeholder={type==='expense'?'e.g. Breakfast and lunch':'e.g. Monthly allowance'}/></div>
    {error&&<p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button type="submit" className="primary-btn"><Check size={17}/>{initial?'Save changes':'Save transaction'}</button></div>
  </form></div>
}
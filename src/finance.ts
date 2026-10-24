import { AppData, Currency, Transaction } from './types'

export const todayISO = () => new Date().toISOString().slice(0, 10)
export const monthISO = (date = todayISO()) => date.slice(0, 7)

export function toKHR(amount: number, currency: Currency, rate: number): number {
  return currency === 'USD' ? amount * rate : amount
}
export function toUSD(amount: number, currency: Currency, rate: number): number {
  return currency === 'KHR' ? amount / rate : amount
}
export function formatMoney(amount: number, currency: Currency, _rate: number): string {
  if (currency === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount)
  return `៛${Math.round(amount).toLocaleString('en-US')}`
}
export function sumKHR(items: Transaction[], rate: number, type?: Transaction['type']): number {
  return items.filter(t => !type || t.type === type).reduce((sum, t) => sum + toKHR(t.amount, t.currency, rate), 0)
}
export function monthTransactions(items: Transaction[], month = monthISO()): Transaction[] {
  return items.filter(t => t.date.startsWith(month))
}
export function dayTransactions(items: Transaction[], date = todayISO()): Transaction[] {
  return items.filter(t => t.date === date)
}
export function availableBalanceKHR(data: AppData): number {
  const tx = data.transactions
  const income = sumKHR(tx, data.budget.exchangeRate, 'income')
  const expenses = sumKHR(tx, data.budget.exchangeRate, 'expense')
  const savings = sumKHR(tx, data.budget.exchangeRate, 'saving')
  const starting = data.startingBalanceUSD * data.budget.exchangeRate
  return starting + income - expenses - savings
}
export function monthExpenseKHR(data: AppData, month = monthISO()): number {
  return sumKHR(monthTransactions(data.transactions, month), data.budget.exchangeRate, 'expense')
}
export function categoryTotals(items: Transaction[], rate: number): { name: string; amount: number }[] {
  const map = new Map<string, number>()
  items.filter(t => t.type === 'expense').forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + toKHR(t.amount, t.currency, rate)))
  return [...map.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
}
export function lastSevenDays(items: Transaction[], rate: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const iso = d.toISOString().slice(0, 10)
    const spent = sumKHR(items.filter(t => t.date === iso), rate, 'expense')
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), spent }
  })
}
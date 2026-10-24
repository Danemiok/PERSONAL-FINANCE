export type Currency = 'USD' | 'KHR'
export type TransactionType = 'expense' | 'income' | 'saving' | 'transfer'
export type Category = 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Health' | 'Education' | 'Entertainment' | 'Family' | 'Salary' | 'Allowance' | 'Other'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: Currency
  category: Category
  note: string
  date: string
  createdAt: string
}

export interface Budget {
  monthlyLimitUSD: number
  dailyLimitKHR: number
  exchangeRate: number
  emergencyTargetKHR: number
  savingsTargetKHR: number
  monthStartDay: number
}

export interface Goal {
  id: string
  name: string
  targetKHR: number
  savedKHR: number
  deadline: string
}

export interface AppData {
  transactions: Transaction[]
  budget: Budget
  goals: Goal[]
  emergencySavedKHR: number
  startingBalanceUSD: number
  hasSeeded: boolean
}

export const DEFAULT_DATA: AppData = {
  transactions: [],
  budget: {
    monthlyLimitUSD: 25,
    dailyLimitKHR: 3000,
    exchangeRate: 4100,
    emergencyTargetKHR: 10000,
    savingsTargetKHR: 17500,
    monthStartDay: 1
  },
  goals: [
    { id: 'starter-goal', name: 'Monthly savings', targetKHR: 17500, savedKHR: 0, deadline: '' }
  ],
  emergencySavedKHR: 0,
  startingBalanceUSD: 25,
  hasSeeded: false
}

export const CATEGORIES: Category[] = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Education',
  'Entertainment', 'Family', 'Salary', 'Allowance', 'Other'
]
import { AppData, DEFAULT_DATA } from './types'

const STORAGE_KEY = 'my-money-finance-v1'

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_DATA)
    const parsed = JSON.parse(raw) as Partial<AppData>
    return {
      ...structuredClone(DEFAULT_DATA),
      ...parsed,
      budget: { ...DEFAULT_DATA.budget, ...(parsed.budget ?? {}) },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : DEFAULT_DATA.goals
    }
  } catch {
    return structuredClone(DEFAULT_DATA)
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function exportData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `my-money-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<AppData> {
  const text = await file.text()
  const parsed = JSON.parse(text) as AppData
  if (!parsed || !Array.isArray(parsed.transactions) || !parsed.budget) {
    throw new Error('This file does not look like a My Money backup.')
  }
  return {
    ...structuredClone(DEFAULT_DATA),
    ...parsed,
    budget: { ...DEFAULT_DATA.budget, ...parsed.budget },
    goals: Array.isArray(parsed.goals) ? parsed.goals : []
  }
}
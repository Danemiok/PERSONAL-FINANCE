# My Money — Personal Finance System

A responsive personal finance tracker built with React, TypeScript, Vite, Recharts, and browser localStorage.

## Requirements
- Node.js 20+ recommended
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

## Production build
```bash
npm run build
npm run preview
```

## Features
- Dashboard with current balance, spending today, spending this month, savings, charts, and budget progress
- Add, edit, delete, search, and filter transactions
- Expense, income, and savings transaction types
- USD and KHR display and entry with editable exchange rate
- Monthly and daily budget guides
- Savings goals and emergency fund tracker
- Reports by month and category
- Budget alerts
- JSON export/import backup
- Local-only storage; no backend or account required

## Initial configuration
- Starting balance: $25
- Exchange rate: $1 = ៛4,100 (editable)
- Daily guide: ៛3,000
- Monthly budget: $25
- Emergency target: ៛10,000
- Savings target: ៛17,500

## Important accounting notes
- Starting balance is a baseline. Do not record the same starting $25 again as income.
- Income increases available balance.
- Expenses reduce available balance.
- Savings transactions reduce available balance because money is treated as moved out of spendable funds.
- The savings goal progress and emergency fund counters are separate trackers. Add only money that you really set aside.
- The app stores data in the current browser profile on this device. Browser clearing or device loss can erase it. Export JSON backups regularly.
- LocalStorage is not encrypted and is not appropriate for highly sensitive financial account information.

## Suggested future improvements
- Unit tests for finance calculations and validation
- Better month-boundary and timezone handling
- IndexedDB migration for larger datasets
- Optional PIN / encrypted backup
- PWA install support and offline assets
- Automated scheduled transaction support
- Recurring expense templates
- Multi-device sync through an authenticated backend

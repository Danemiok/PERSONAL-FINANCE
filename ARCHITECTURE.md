# Architecture and Data Model

## Architecture
- `src/App.tsx`: application shell, navigation, screens, modal forms, local state
- `src/types.ts`: TypeScript types and defaults
- `src/finance.ts`: currency conversion, totals, balance and report helpers
- `src/storage.ts`: localStorage persistence and JSON backup import/export
- `src/styles.css`: responsive visual system

## Local data schema
The current app persists a single `AppData` object under `my-money-finance-v1` in browser localStorage.

```ts
interface AppData {
  transactions: Transaction[];
  budget: Budget;
  goals: Goal[];
  emergencySavedKHR: number;
  startingBalanceUSD: number;
  hasSeeded: boolean;
}
interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'saving' | 'transfer';
  amount: number;
  currency: 'USD' | 'KHR';
  category: string;
  note: string;
  date: string;       // YYYY-MM-DD
  createdAt: string;  // ISO timestamp
}
interface Budget {
  monthlyLimitUSD: number;
  dailyLimitKHR: number;
  exchangeRate: number;
  emergencyTargetKHR: number;
  savingsTargetKHR: number;
  monthStartDay: number;
}
interface Goal {
  id: string;
  name: string;
  targetKHR: number;
  savedKHR: number;
  deadline: string;
}
```

## Core calculations
- KHR amount = USD amount × configured exchange rate
- USD amount = KHR amount ÷ configured exchange rate
- Available balance (KHR) = starting balance in KHR + income − expenses − savings transfers
- Monthly spending = expense transactions whose date starts with selected `YYYY-MM`
- Daily spending = expense transactions with today's `YYYY-MM-DD`
- Savings progress = amount marked saved ÷ goal target

## Recommended future relational database schema
If the app later needs accounts or sync, these tables provide a migration path:

### `users`
- `id` UUID primary key
- `name` varchar
- `email` unique nullable
- `password_hash` nullable (never store raw passwords)
- `created_at`, `updated_at`

### `wallets`
- `id` UUID primary key
- `user_id` UUID foreign key → users.id
- `name` varchar
- `currency` enum (`USD`, `KHR`)
- `opening_balance_minor` bigint (amount in cents for USD; riel integer for KHR)
- `created_at`, `updated_at`

### `transactions`
- `id` UUID primary key
- `user_id` UUID foreign key → users.id
- `wallet_id` UUID foreign key → wallets.id
- `type` enum (`expense`, `income`, `saving`, `transfer`)
- `amount_minor` bigint
- `currency` enum (`USD`, `KHR`)
- `category_id` UUID nullable foreign key
- `note` varchar nullable
- `transaction_date` date
- `exchange_rate_snapshot` decimal(12,4)
- `created_at`, `updated_at`, `deleted_at` nullable

### `categories`
- `id` UUID primary key
- `user_id` UUID nullable (null means built-in)
- `name` varchar
- `type` enum (`expense`, `income`, `saving`)
- `icon` varchar nullable
- `created_at`, `updated_at`

### `budgets`
- `id` UUID primary key
- `user_id` UUID foreign key
- `name` varchar
- `period` enum (`daily`, `weekly`, `monthly`)
- `amount_minor` bigint
- `currency` enum (`USD`, `KHR`)
- `start_date` date
- `end_date` date nullable
- `created_at`, `updated_at`

### `savings_goals`
- `id` UUID primary key
- `user_id` UUID foreign key
- `name` varchar
- `target_amount_minor` bigint
- `currency` enum (`USD`, `KHR`)
- `target_date` date nullable
- `created_at`, `updated_at`

### `savings_contributions`
- `id` UUID primary key
- `goal_id` UUID foreign key → savings_goals.id
- `transaction_id` UUID nullable foreign key → transactions.id
- `amount_minor` bigint
- `contribution_date` date
- `created_at`

### `app_settings`
- `user_id` UUID primary key / foreign key
- `base_currency` enum (`USD`, `KHR`)
- `exchange_rate` decimal(12,4)
- `daily_limit_minor` bigint
- `monthly_limit_minor` bigint
- `emergency_target_minor` bigint
- `created_at`, `updated_at`

## Implementation phases
1. MVP: local transactions, budgets, savings, reports, backup/import.
2. Reliability: unit tests, validation, robust date handling, import schema versioning.
3. Offline/PWA: app manifest, service worker, install support.
4. Optional secure sync: Laravel API, authentication, server-side validation, PostgreSQL, encrypted transport, account export/deletion.

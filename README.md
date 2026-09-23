# Expense Tracker

A React + TypeScript web app for tracking personal expenses, built with Vite.
All data lives in the browser's `localStorage` — there is no backend, no
account, and no network calls.

## Features

- **Add, edit, and delete expenses** — amount, category, date, and an optional
  description.
- **Seven fixed categories** — Food, Transport, Entertainment, Shopping, Bills,
  Health, Other, each with its own colour.
- **Dashboard** — all-time and current-month spending totals, plus a donut chart
  breaking spending down by category.
- **Sorted list** — expenses are always shown newest-first by date.
- **Client-side validation** — amount must be greater than 0, category and date
  are required.
- **Persistence** — every change is written to `localStorage` under the key
  `expenses-app-data`.

## Requirements

- A current Node.js LTS (Vite 8 drops older releases)
- npm

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Scripts

| Script            | What it does                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server with hot module replacement.               |
| `npm run build`   | Type-check the project (`tsc -b`) and emit a production build.       |
| `npm run preview` | Serve the built `dist/` output locally to sanity-check a build.      |
| `npm run lint`    | Run ESLint over the repository.                                      |

There is no test suite in this repository yet.

## Tech Stack

- **React 19** with function components and hooks
- **TypeScript 6** in strict bundler mode (`noEmit`, `verbatimModuleSyntax`)
- **Vite 8** for dev server and bundling
- **Recharts 3** for the category donut chart
- **CSS Modules** for component-scoped styling
- **ESLint 10** (flat config) with `typescript-eslint`, `react-hooks`, and
  `react-refresh`

## Project Layout

```
src/
  main.tsx                  React entry point; mounts <App/> in StrictMode
  App.tsx                   Shell: ExpenseProvider + header + page
  App.css                   Global resets and app-shell styles
  types/
    expense.ts              Category union and Expense interface
  utils/
    storage.ts              localStorage load/save helpers
    categories.ts           Category metadata (labels, colours) and lookups
  context/
    ExpenseContext.tsx      useReducer store + provider + useExpenses() hook
  pages/
    ExpensesPage.tsx        Wires the store to the dashboard, form, and list
  components/
    Dashboard/              SummaryCards, CategoryChart
    ExpenseForm/            Add/edit form with validation
    ExpenseList/            ExpenseList, ExpenseItem
public/                     Static assets served as-is (favicon, icons)
.github/workflows/          CI: automated code review and secret audit
```

## Documentation

- [Architecture](docs/architecture.md) — data model, state management, and how
  data flows through the app.
- [Components](docs/components.md) — a reference for every component, its props,
  and its behaviour.
- [Development](docs/development.md) — local setup, conventions, CI, and common
  extension tasks.

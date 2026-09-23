# Architecture

The app is a single-page, single-route React application with no backend. It has
three layers: a **data model** (`src/types`, `src/utils`), a **store**
(`src/context`), and a **view tree** (`src/pages`, `src/components`).

## Data model

`src/types/expense.ts` defines the only two types the app cares about.

```ts
export type Category =
  | 'Food' | 'Transport' | 'Entertainment'
  | 'Shopping' | 'Bills' | 'Health' | 'Other';

export interface Expense {
  id: string;          // crypto.randomUUID()
  amount: number;      // positive, in dollars
  category: Category;
  date: string;        // ISO date string (YYYY-MM-DD)
  description: string; // may be an empty string
}
```

`Category` is a closed union, so adding a category is a type-level change — see
[Development › Adding a category](development.md#adding-a-category).

### Category metadata

`src/utils/categories.ts` is the single source of truth for how categories are
presented:

- `CATEGORIES: CategoryInfo[]` — ordered list of `{ name, label, color }`. The
  array order determines both the dropdown order in the form and the slice order
  in the chart.
- `CATEGORY_NAMES: Category[]` — names only, used to render the form's `<select>`.
- `getCategoryColor(category)` — colour lookup with a grey (`#6b7280`) fallback,
  used by the list item badges.

Colours are Tailwind-palette hex values kept in this file rather than in CSS, so
that both the chart (which needs them as JS values) and the badges use one
definition.

## State management

State lives in a single `useReducer` store inside `ExpenseProvider`
(`src/context/ExpenseContext.tsx`). There is no external state library.

```
                       ┌──────────────────────────────┐
  loadExpenses() ─────▶│  useReducer(expenseReducer)  │
  (lazy init)          │  state: Expense[]            │
                       └───────────┬──────────────────┘
                                   │ every state change
                                   ▼
                          useEffect ─▶ saveExpenses()
```

The reducer handles three actions:

| Action   | Payload   | Effect                                             |
| -------- | --------- | -------------------------------------------------- |
| `ADD`    | `Expense` | Prepends the expense to the array.                  |
| `UPDATE` | `Expense` | Replaces the entry whose `id` matches.              |
| `DELETE` | `string`  | Removes the entry with that `id`.                   |

The provider exposes `{ expenses, addExpense, updateExpense, deleteExpense }`.
Consumers reach it through the `useExpenses()` hook, which throws if called
outside an `ExpenseProvider` — that error is the intended signal that a component
was mounted in the wrong place.

### Persistence

`src/utils/storage.ts` wraps `localStorage` under the key `expenses-app-data`:

- `loadExpenses()` — parses the stored JSON, returning `[]` if the key is absent
  or the contents fail to parse. Used as the reducer's lazy initialiser, so the
  read happens once on mount.
- `saveExpenses(expenses)` — serialises the whole array.

Both functions swallow errors and log to the console, so a corrupt or
unavailable `localStorage` (private browsing, quota exhaustion) degrades to an
empty in-memory session rather than crashing the app.

Note that `loadExpenses()` casts the parsed JSON to `Expense[]` without
validating it. Data written by an older or hand-edited version of the app is
trusted as-is.

The save effect runs on every state change, including the initial mount, so the
storage key is written even before the first expense is added.

## Data flow

```
App
└── ExpenseProvider              owns Expense[], persists it
    └── ExpensesPage             owns `editingExpense` (UI-only state)
        ├── SummaryCards         derives totals from expenses
        ├── CategoryChart        derives per-category totals from expenses
        ├── ExpenseForm          emits a complete Expense on submit
        └── ExpenseList
            └── ExpenseItem      emits edit / delete intents
```

Only `ExpensesPage` talks to the store. Every component below it is a pure
function of its props and reports upward through callbacks, which keeps them
trivially reusable and testable.

### Add vs. edit

`ExpensesPage` keeps a single piece of local state, `editingExpense`, and uses it
as a mode switch:

1. Clicking **Edit** on an item sets `editingExpense` and smooth-scrolls to the
   top of the page.
2. `ExpenseForm` sees a non-`undefined` `expense` prop, re-populates its fields
   from it, switches its title and submit label, and renders a Cancel button.
3. On submit, `handleSubmit` dispatches `UPDATE` (reusing the existing `id`) and
   clears `editingExpense`; otherwise it dispatches `ADD` with a freshly
   generated `crypto.randomUUID()`.

The form owns its own field state and only produces a fully-formed `Expense`
once validation passes, so no partially-valid data ever reaches the store.

### Derived values

Nothing is cached or memoised — totals, the chart dataset, and the sort order are
all recomputed on each render from `expenses`:

- **All-time total** — sum of every `amount`.
- **This month** — filtered by comparing `getMonth()`/`getFullYear()` of
  `new Date(e.date)` against today. Because `YYYY-MM-DD` strings parse as UTC
  while `getMonth()` reads local time, dates on the first or last day of a month
  can fall into the adjacent month for users west of UTC.
- **Chart data** — a `Map<Category, number>` of sums, then filtered and ordered
  by `CATEGORIES` so slice colours and ordering stay stable.
- **List order** — `ExpenseList` copies the array before sorting (newest date
  first), so the store's own ordering is never mutated.

At the scale this app is built for (a personal expense list), recomputation is
cheaper than the complexity of memoisation.

## Styling

`src/App.css` holds the global reset and app-shell rules. Everything else uses
CSS Modules co-located with the component that needs them
(`Dashboard.module.css`, `ExpenseForm.module.css`, `ExpenseList.module.css`,
`ExpensesPage.module.css`), so class names are locally scoped and collisions are
impossible.

## Rendering entry point

`src/main.tsx` mounts `<App/>` into `#root` inside `<StrictMode>`. StrictMode
double-invokes reducers and effects in development; the reducer is pure and
`saveExpenses` is idempotent, so this is harmless here.

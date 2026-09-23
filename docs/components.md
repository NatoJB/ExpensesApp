# Component Reference

Every component is a default-exported function component. Props interfaces are
declared immediately above each component in its own file.

---

## `App` — `src/App.tsx`

The application shell. Wraps everything in `ExpenseProvider`, renders the header
(`💰 Expense Tracker`) and a `<main>` containing `ExpensesPage`. Takes no props.

---

## `ExpenseProvider` / `useExpenses` — `src/context/ExpenseContext.tsx`

| Export                    | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `ExpenseProvider`         | Provider component; props: `{ children: ReactNode }`.              |
| `useExpenses()`           | Hook returning the context value. Throws outside a provider.       |

Context value:

```ts
interface ExpenseContextValue {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;   // matched by id
  deleteExpense: (id: string) => void;
}
```

The provider is the only component that reads from or writes to `localStorage`.

---

## `ExpensesPage` — `src/pages/ExpensesPage.tsx`

The single page. Takes no props; pulls state from `useExpenses()`.

Local state: `editingExpense?: Expense` — `undefined` means the form is in "add"
mode.

| Handler            | Behaviour                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| `handleSubmit`     | `updateExpense` + clear editing state when editing, otherwise `addExpense`. |
| `handleEdit`       | Sets `editingExpense` and smooth-scrolls the window to the top.             |
| `handleCancelEdit` | Clears `editingExpense`. Passed to the form only while editing.             |

Layout order: dashboard (`SummaryCards`, `CategoryChart`), then an `Expenses`
heading, then `ExpenseForm`, then `ExpenseList`.

---

## `SummaryCards` — `src/components/Dashboard/SummaryCards.tsx`

```ts
interface SummaryCardsProps { expenses: Expense[] }
```

Renders two cards:

- **Total Spending (All Time)** — sum of all amounts.
- **This Month** — sum of amounts whose month and year match today's.

Both are formatted with `toFixed(2)` and prefixed with `$`. With no expenses the
cards show `$0.00` rather than an empty state.

---

## `CategoryChart` — `src/components/Dashboard/CategoryChart.tsx`

```ts
interface CategoryChartProps { expenses: Expense[] }
```

A Recharts donut (`PieChart` with `innerRadius={60}`, `outerRadius={100}`) inside
a `ResponsiveContainer` fixed at 300px tall, with a tooltip that formats values
as `$0.00` and a legend.

Behaviour notes:

- With an empty `expenses` array it returns an early "No expenses to display
  yet." placeholder instead of the chart.
- Only categories that actually have expenses become slices.
- Slices are ordered and coloured by the `CATEGORIES` array, so a given category
  always gets the same colour across renders.
- Slice values are rounded to 2 decimals before being handed to Recharts.

---

## `ExpenseForm` — `src/components/ExpenseForm/ExpenseForm.tsx`

```ts
interface ExpenseFormProps {
  expense?: Expense;                      // present ⇒ edit mode
  onSubmit: (expense: Expense) => void;   // receives a complete, valid Expense
  onCancel?: () => void;                  // rendered only in edit mode
}
```

Controlled inputs for amount (`type="number"`, `step="0.01"`), category
(`<select>` built from `CATEGORY_NAMES`), date (`type="date"`), and an optional
free-text description.

**Mode switching.** A `useEffect` keyed on `expense` repopulates the fields when
an expense is passed in and resets them when it becomes `undefined`. The title
and submit label switch between *Add Expense* and *Edit Expense* / *Save
Changes*.

**Validation** runs on submit and blocks `onSubmit` if anything fails:

| Field    | Rule                                              | Message                          |
| -------- | ------------------------------------------------- | -------------------------------- |
| Amount   | Non-empty, parses as a number, and is `> 0`        | `Amount must be greater than 0`  |
| Category | Must be selected                                   | `Please select a category`       |
| Date     | Must be set                                        | `Date is required`               |

Errors render inline beneath their field. Description is optional and is trimmed
before submission.

**Id handling.** `id` reuses `expense?.id` when editing, otherwise a new
`crypto.randomUUID()`. The form clears itself after a successful add but keeps
its values after a save, since the page unmounts edit mode anyway.

---

## `ExpenseList` — `src/components/ExpenseList/ExpenseList.tsx`

```ts
interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}
```

Copies `expenses` and sorts the copy by date descending, then renders one
`ExpenseItem` per entry keyed by `id`. When the list is empty it renders the
message "No expenses yet. Add your first expense above!" instead.

---

## `ExpenseItem` — `src/components/ExpenseList/ExpenseItem.tsx`

```ts
interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}
```

A single row: the amount (`$0.00`), a category badge tinted with
`getCategoryColor()`, the raw ISO date string, and the description on a second
line when non-empty. Edit and Delete buttons sit on the right; **Delete** first
asks for confirmation via `window.confirm` and only then calls `onDelete`.

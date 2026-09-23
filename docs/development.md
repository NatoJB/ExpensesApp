# Development Guide

## Setup

```bash
npm install
npm run dev     # http://localhost:5173
```

Use a current Node.js LTS; Vite 8 drops older releases, so check its
`engines.node` field after `npm install` if your Node is more than a year old.

Before opening a pull request:

```bash
npm run lint
npm run build   # runs `tsc -b` first, so this is also the type-check
```

There is no test suite yet, so `lint` and `build` are the full local gate.

## TypeScript configuration

`tsconfig.json` is a solution file referencing `tsconfig.app.json` (application
code under `src/`) and `tsconfig.node.json` (the Vite config itself). App
settings worth knowing about:

- `noEmit` with `moduleResolution: "bundler"` — Vite does the emitting; `tsc` is
  only a checker.
- `verbatimModuleSyntax` — type-only imports **must** use `import type`. This is
  why the codebase writes `import type { Expense } from '../types/expense'`.
- `erasableSyntaxOnly` — no enums, no parameter properties, no namespaces.
- `noUnusedLocals` / `noUnusedParameters` — unused bindings fail the build, not
  just the lint.

## Conventions

- **Components**: one component per file, default export, function declaration.
  Props interfaces are named `<Component>Props` and declared above the component.
- **Styling**: CSS Modules only, co-located with the component
  (`Foo.module.css`, imported as `styles`). Global rules belong in `App.css`.
- **State**: the store is the `useReducer` in `ExpenseContext`. Only
  `ExpensesPage` consumes it; presentational components take props and report up
  through callbacks. Keep it that way unless the tree gets meaningfully deeper.
- **Imports**: relative paths — no path aliases are configured.
- **Money**: stored as a plain `number` of dollars and rendered with
  `toFixed(2)`. There is no currency handling or locale formatting.

## Linting

ESLint 10 flat config (`eslint.config.js`) applies to `**/*.{ts,tsx}` with
`js.configs.recommended`, `tseslint.configs.recommended`, the React Hooks
recommended rules, and `react-refresh`'s Vite preset. `dist` is globally
ignored.

`react-refresh/only-export-components` is the rule most likely to bite: a module
that exports a component should not also export non-component values. Note that
`ExpenseContext.tsx` exports both `ExpenseProvider` and `useExpenses` — hooks are
allowed by the rule's defaults, but adding, say, an exported constant to that
file would trip it.

## Common tasks

### Adding a category

1. Add the name to the `Category` union in `src/types/expense.ts`.
2. Add a `{ name, label, color }` entry to `CATEGORIES` in
   `src/utils/categories.ts`, positioned where you want it to appear in the form
   dropdown and chart legend.

Nothing else needs changing: the form's `<select>`, the chart slices, and the
list badge colours are all derived from those two sources. Because the union is
closed, `tsc` will flag any switch or map that has not been updated.

Expenses already stored under a category you *remove* will still load from
`localStorage` — `loadExpenses()` does not validate — and will render with the
grey fallback colour from `getCategoryColor()`.

### Changing where data is stored

`src/utils/storage.ts` is the only module that touches `localStorage`. Swap the
bodies of `loadExpenses`/`saveExpenses` (for an API, IndexedDB, etc.) and the
rest of the app is unaffected — though an async backend would also require
changing the reducer's lazy initialiser in `ExpenseContext.tsx`, which currently
assumes a synchronous read.

The storage key is `expenses-app-data`. Clearing it (DevTools → Application →
Local Storage) resets the app.

### Adding a new dashboard widget

Create the component under `src/components/Dashboard/`, give it an
`expenses: Expense[]` prop, derive whatever it needs, and render it inside the
`styles.dashboard` block in `ExpensesPage.tsx`. Follow `SummaryCards` for the
shape.

## Known rough edges

- **Month boundaries in "This Month".** `new Date('2026-09-01')` parses as UTC
  midnight, but `SummaryCards` compares using local-time `getMonth()`. In
  negative-UTC-offset timezones, the first of the month reads as the previous
  month. Fixing it means parsing the `YYYY-MM-DD` string as local time (split on
  `-`, or compare the string prefix).
- **Unvalidated stored data.** `loadExpenses()` casts parsed JSON straight to
  `Expense[]`. Malformed data from a hand-edit or a future schema change will
  reach the render tree unchecked.
- **Dead CSS.** `Dashboard.module.css` still defines `.recent*` classes for a
  "recent expenses" section that no component renders.
- **No tests.** There is no test runner, script, or dependency in
  `package.json`.

## CI

Three GitHub Actions workflows live in `.github/workflows/`:

| Workflow            | Trigger                                   | Purpose                                              |
| ------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `code-review.yml`   | PRs to `main` (opened, synchronize)       | Automated code review comments on the diff.           |
| `secret-audit.yml`  | PRs to `main` (opened, synchronize)       | Scans the diff for committed secrets.                 |
| `Junie.yaml`        | Issue/PR comments mentioning `@junie-agent` | Runs the Junie agent on demand.                     |

Note that none of these run `npm run lint` or `npm run build` — there is no
build/test CI gate, so run both locally before pushing.

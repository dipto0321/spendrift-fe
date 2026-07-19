# Frontend Architecture

## Architecture Style

The frontend follows:

- Domain-Driven Design (DDD)
- Feature-based architecture
- Shared UI primitives

---

# Goals

- Scalability
- Maintainability
- Reusability
- Strong separation of concerns
- Clean domain boundaries

---

# Main Structure

```text
src/
 ├── features/        # dashboard, expenses, budgets, reports, trackers, preferences
 ├── shared/          # api, ui, hooks, utils
 ├── components/ui/   # ShadCN-generated primitives (CLI-owned)
 ├── routes/          # TanStack Start file-based routes
 │   └── expenses.tsx # declares the `?bulk=1` search schema consumed by
 │                    #   the dashboard's CatchUpBanner deep-link
 └── styles.css
```

Each feature is split into three layers:

```text
features/<feature>/
 ├── domain/        # types + pure business logic (services.ts)
 ├── data/          # repository.ts, dto.ts, queryKeys.ts
 └── presentation/  # pages + React Query hooks (use*.ts)
```

---

# Domains

## dashboard

Responsible for:

- overview UI
- dashboard widgets
- summary cards
- **CatchUpBanner** — ambient "last entry" line / calm nudge ≥2d;
  deep-links to `/expenses?bulk=1` via `useLastEntryDate` +
  `daysSinceEntry` from the expenses domain

---

## expenses

Responsible for:

- expense list
- expense form
- expense filters
- expense calculations
- **BulkExpenseForm + BulkExpenseModal** — shared-date row grid
  (`useFieldArray`); saves in parallel via `Promise.allSettled`,
  with per-row failure retry. Wired through `useBulkCreateExpenses`
  → `partitionSettled` domain helper.
- **SmartPasteSection** — collapsible AI parser above the bulk grid.
  Calls `useParseExpenses` → `expenseParseRepository.parseText`
  (`POST /ai/parse-expenses`); parsed rows are appended to the bulk
  grid for mandatory review (the AI never persists directly).

---

## budgets

Responsible for:

- budget setup
- savings targets
- budget status

---

## reports

Responsible for:

- analytics
- charts
- yearly comparison
- report summaries

---

## trackers

Responsible for:

- tracker selection
- currency-specific workspace
- tracker settings

---

## preferences

Responsible for:

- `GET|PUT /preferences` (Budget alerts / Weekly summary / Round amounts)
- `usePreferences()` + `useUpdatePreferences()` (optimistic, rollback)
- `useFormatCurrency()` — wraps `formatCurrency` with the user's
  `roundAmounts` flag so every money surface respects the preference
  without callers threading it manually
- Gates consumers on toggles (e.g. `useBudgetAlerts` skips its query when
  `preferences.budgetAlerts` is off)

---

# Shared Layer

## shared/api

The API client: `apiFetch` (base URL, auth header, JSON, single-flight
refresh-on-401, error normalization) and JWT token storage. Every feature
repository calls through here.

---

## shared/ui

Reusable, app-level UI (composed from the ShadCN primitives in
`components/ui`): `AppSidebar`, `StatCard`, `ThemeToggle`, `PageHeader`, …

---

## shared/hooks

Reusable hooks.

---

## shared/utils

Pure helper functions (e.g. currency/date formatting).

---

# State Management Philosophy

- **Server state** lives in **TanStack Query** — per-feature `use*` hooks own
  fetching, caching, and invalidation (keyed by `trackerId`).
- **UI/local state** stays in component `useState`; global app state is kept
  minimal.

Avoid introducing complex client-state libraries — most "state" here is server
state, which the query cache already manages.

---

# Data / API Strategy

All features are backed by the real **Spendrift API**. Each feature reaches it
through its `data/repository.ts` — the single swap seam — with `data/dto.ts`
mapping `snake_case ↔ camelCase` and Decimal-money strings `↔ number`. Pages and
hooks never call `fetch` directly. See
[`docs/patterns/repository-pattern.md`](../patterns/repository-pattern.md).

Recent additions follow the same seam:

- `expenseParseRepository.parseText` — AI smart-paste (`POST /ai/parse-expenses`).
  Returns candidate rows only; persistence still goes through
  `expenseRepository.create` after user review.
- `expenseRepository.getLastEntryDate` — `GET /trackers/:id/expenses?sort=date_desc&limit=1`
  for the dashboard's catch-up banner.

> The project started mock-first (in-memory repositories + fixtures) before the
> backend existed; that scaffolding has been removed now that every feature is
> server-backed.

---

# Routing Philosophy

Routes should remain:

- minimal
- readable
- feature-oriented

---

# Design Philosophy

The application should feel:

- calm
- modern
- minimal
- data-focused

---

# Scalability Strategy

Start simple.

Refactor only when:

- duplication becomes painful
- complexity becomes repeated
- scaling requires abstraction

Avoid premature optimization.

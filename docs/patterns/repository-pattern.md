# Repository Pattern

## Goal

Every feature talks to the backend through a single, swappable seam so that pages
and hooks never call `fetch` directly. This keeps UI decoupled from transport and
gives one place to evolve API calls, mapping, and error handling.

> Historical note: the project began mock-first (in-memory repositories before the
> backend existed). That phase is over — all features are now backed by the real
> **Spendrift API** — but the seam below is exactly what made the swap a
> one-file-per-feature change.

---

## The seam

```text
Page → presentation/use*.ts (TanStack Query) → data/repository.ts → shared/api/client.ts
```

Each feature owns three data files under `data/`:

- **`repository.ts`** — the only place that calls the API (`apiFetch`). Exposes
  domain-shaped methods (`getAll`, `create`, `update`, `delete`, …).
- **`dto.ts`** — the wire boundary. Maps the API's `snake_case` shapes to the
  domain's `camelCase`, and Decimal-money **strings** (`"12.50"`) to `number`.
- **`queryKeys.ts`** — centralized, tracker-scoped React Query keys so
  invalidation is typo-proof.

---

## Example

```ts
// data/dto.ts — translate at the boundary, never leak DTO shapes past data/
export function mapExpense(dto: ExpenseResponseDto): Expense {
  return {
    id: dto.id,
    trackerId: dto.tracker_id,
    amount: Number(dto.amount), // Decimal string → number
    categoryId: dto.category_id,
    date: dto.date,
    type: dto.type,
  };
}

// data/repository.ts — the single API seam
export const expenseRepository = {
  async getAll(trackerId: string): Promise<Expense[]> {
    const dtos = await apiFetch<ExpenseResponseDto[]>(
      `/trackers/${trackerId}/expenses`,
    );
    return dtos.map(mapExpense);
  },
};

// presentation/useExpenses.ts — pages stay thin
export function useExpenses(trackerId?: string) {
  return useQuery({
    queryKey: expenseKeys.all(trackerId!),
    queryFn: () => expenseRepository.getAll(trackerId!),
    enabled: Boolean(trackerId),
  });
}
```

---

## Preferences — special case

`features/preferences` follows the same seam, but **pages do not call the
repository directly** — they go through `usePreferences()` and
`useUpdatePreferences()`. The mutation hook applies optimistic updates and
rolls back on error, which is why the repository call is one level deeper
than usual. Consumers of preferences (e.g. `useBudgetAlerts`) read the flag
from the cached query rather than re-fetching, so toggling a switch is
visible to every dependent query in the same render.

---

## Rules

- Never `fetch`/axios from pages, hooks, or components — go through the repository.
- Map `snake_case ↔ camelCase` and Decimal-string `↔ number` in `dto.ts`; don't
  do math on the raw strings and don't leak DTO types past `data/`.
- Keep query keys in `queryKeys.ts`, scoped by `trackerId`.
- Mutations invalidate via the key factories; generic success/error toasts live
  in the `use*` hooks.

---

## Benefits

- One swap seam per feature (mock → HTTP was a single-file change).
- UI is isolated from transport and response shape.
- Caching/invalidation centralized in the hooks + query keys.
- Pure domain types — easy to unit-test the `domain/services` functions.

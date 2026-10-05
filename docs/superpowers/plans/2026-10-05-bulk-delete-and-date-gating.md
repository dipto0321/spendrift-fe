# Bulk Delete + Date-Edit Gating — Implementation Plan

> **Status:** Approved — ready for execution.
> **Goal:** (1) Gate the existing bulk date-edit so it's only available when every selected expense shares the same date; (2) add bulk **delete** for the multi-selection (allowed regardless of dates).

---

## 1. Context (current behavior)

From the previous feature (`feat/expenses/bulk-edit-dates`, merged):

- `ExpensePage` holds `selectedIds: Set<string>` + `toggleSelect` / `toggleSelectAll`, and renders an action bar when `selectedIds.size > 0` with two buttons: **Change date** and **Clear**.
- `BulkDateEditModal` sets *all* selected expenses to a single new date via `useBulkUpdateExpenseDates` (parallel `PATCH { date }`).
- Single-row delete exists (`useDeleteExpense` → `deleteMutation.mutate(id)`), but there is **no bulk delete**.

**Problem:** the date-edit flow was built for the "smart paste put everything on the wrong date" case (all rows share one date). Selecting rows on *different* dates and hitting "Change date" collapses them onto one date, which is usually a mistake. The user wants that blocked, and instead wants multi-delete available in that scenario.

---

## 2. Feature A — Gate bulk date-edit on a shared date

**Rule:** the **Change date** button is enabled only when every selected expense has the identical `date` value. Otherwise it is disabled with a hint.

- Selection is always a subset of the current `sortedExpenses` (selection clears on filter/page change), so we can derive:

```ts
const selectedExpenses = sortedExpenses.filter((e) => selectedIds.has(e.id));
const allSameDate =
  selectedExpenses.length > 0 &&
  selectedExpenses.every((e) => e.date === selectedExpenses[0].date);
```

- Action bar button becomes `disabled={!allSameDate}` with `title="Selected expenses have different dates"`, plus a short inline hint when dates differ.

## 3. Feature B — Bulk delete

- New hook `useBulkDeleteExpenses(trackerId)` mirroring `useBulkUpdateExpenseDates`: `Promise.allSettled` over `expenseRepository.delete(trackerId, id)`, `partitionSettled`, invalidate `expenseKeys.all`, per-id failure toast.
- New **Delete** action in the selection bar (always enabled when `selectedIds.size > 0`, regardless of dates).
- Confirmation via `AlertDialog` (count-aware), mirroring the existing single-delete dialog in `ExpenseRow`.
- Handler keeps failed ids selected for retry; full success clears selection and closes the dialog.

---

## 4. Files to change

| File | Change |
|---|---|
| `src/features/expenses/presentation/useExpenses.ts` | add `useBulkDeleteExpenses` |
| `src/features/expenses/presentation/ExpensePage.tsx` | `selectedExpenses` + `allSameDate` derivation; gate + hint; Delete button + confirm dialog; `bulkDeleteMutation` + handler |

## 5. Behavior details

- **Change date:** disabled when `!allSameDate`; hint text "Dates differ" shown in the bar.
- **Delete:** opens `AlertDialog` ("Delete N expenses?" / "This permanently removes N expenses. This action cannot be undone." / destructive "Delete N"). On confirm → `handleBulkDelete`.
- **Partial failure (either action):** keep failed ids selected; close dialog only on full success.

## 6. Testing

- `pnpm test` (existing pure-function suite unaffected; hooks/UI are manual per repo test policy).
- `biome check` on touched files.
- `tsc --noEmit` clean on touched files.
- Manual: select same-date rows → Change date enabled; select mixed-date rows → Change date disabled + Delete works; bulk delete removes all selected and clears selection.

## 7. Commits

- `feat(expenses): gate bulk date edit on a shared date and add bulk delete`

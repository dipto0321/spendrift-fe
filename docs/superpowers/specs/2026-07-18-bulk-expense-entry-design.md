# Bulk Expense Entry — Design

**Date:** 2026-07-18
**Status:** Approved
**Problem:** Adding N expenses for the same day requires N trips through the
single-expense modal. With ~8 expenses/day this is the main friction point in
daily use.

## Decisions (locked)

1. Two-phase delivery: batch grid first (frontend-only), AI smart paste second.
2. AI parsing runs behind a FastAPI proxy endpoint — the provider key never
   reaches the browser. Provider: Gemini Flash (free tier) with JSON output.
3. Batch save uses parallel single `POST /trackers/:id/expenses` calls
   (`Promise.allSettled`), not a new bulk endpoint. Per-row failure + retry UX
   covers the lack of atomicity.
4. One shared date per batch (defaults to today). Rows needing a different
   date use the existing single-expense form.
5. AI output never writes to the API directly — parsed rows always land in the
   review grid and are saved by the user.

## Phase 1 — Batch quick-add grid

**Entry point:** "Add multiple" button in the expenses toolbar
(`ExpenseToolbar.tsx`), next to the existing Add Expense. Opens a wider
dialog: `BulkExpenseModal`.

**Form model:**

- Shared `date` field at the top (DatePicker, defaults today).
- `useFieldArray` grid of rows: `amount`, `description`, `categoryId`,
  `type` (need/want). Starts with 3 empty rows.
- "Add row" button; Enter in the last field of the last row appends a row;
  per-row remove button. Tab order flows left-to-right, row-by-row.
- Row validation reuses the field rules from `domain/schema.ts` (V10:
  amount > 0 numeric; category, description non-empty) inside
  `z.array(rowSchema).min(1)`.

**Save flow:**

- New `useBulkCreateExpenses` in `presentation/useExpenses.ts`:
  `Promise.allSettled` over the existing `expenseRepository.create`.
- Fulfilled rows are removed from the grid; rejected rows remain with an
  inline error and a "Retry failed" action. Retry re-submits only remaining
  rows — no double inserts.
- Single expense-list query invalidation after the batch settles.
- All rows succeed → close modal + success toast with count.

**No changes** to `data/repository.ts`, dto, or backend in this phase.

## Phase 2 — AI smart paste

**UI:** collapsible "Smart paste" section at the top of `BulkExpenseModal`.
Textarea + "Parse" button. Parsed rows are **appended** to the Phase-1 grid
pre-filled; the user reviews/edits, then uses the normal Save all.

**API contract** (backend work, separate repo):

```text
POST /ai/parse-expenses
{
  "text": "coffee 120, bus 40, lunch 350 need ...",
  "default_date": "2026-07-18",
  "categories": [{ "id": "...", "name": "Food" }, ...]
}
→ 200
{
  "expenses": [
    { "amount": "120.00", "description": "coffee",
      "category_id": "..." | null, "type": "want" | "need",
      "date": "2026-07-18" }
  ]
}
```

Backend calls Gemini Flash with structured JSON output; the category list in
the request lets the model map descriptions to real category ids. Money stays
a decimal string on the wire per V14.

**Frontend seam:** `parseExpensesText({ text, defaultDate, categories })`
(endpoint is not tracker-scoped) added to
`features/expenses/data/repository.ts` via `apiFetch`, with dto mapping in
`data/dto.ts` (snake_case → camelCase, decimal-string → number). No direct
fetch from components (V1).

**Errors:** parse failure → toast with API error, pasted text preserved,
manual grid unaffected. `category_id: null` → row's category select left
empty, fails row validation until the user picks one.

## Testing

Vitest, pure functions only (per SPEC §C):

- bulk row/array schema validation (empty batch, bad amount, missing fields)
- parse-response dto mapping (snake_case, decimal strings, null category)

## Follow-ups (out of scope)

- Amend SPEC.md via `ck:spec`: new §I endpoint `POST /ai/parse-expenses`,
  §T tasks for Phase 1/2, new §V invariant "AI-parsed rows must pass through
  the review grid before any POST".
- Optional later: bulk backend endpoint if atomicity ever matters; regex
  fallback parser; receipt-photo (vision) input.

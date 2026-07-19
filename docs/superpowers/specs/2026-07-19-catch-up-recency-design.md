# Catch-Up Recency Indicator — Design

**Date:** 2026-07-19
**Status:** Approved
**Problem:** Knowing "when did I last log expenses / how far behind am I"
requires opening `/expenses`, selecting the month, and scanning the table.
The fact should be ambient; falling behind should nudge.

## Decisions (locked)

1. Frontend-only. Data comes from the existing expenses list endpoint via
   `sort=date_desc&limit=1` (no month filter) — no backend changes.
2. One dashboard element, two moods:
   - **Caught up** (last entry 0–1 days ago): a single muted text line,
     no box, no color — e.g. `Last entry: today` / `yesterday`.
   - **Behind** (≥ `NUDGE_AFTER_DAYS = 2`): a slim, calm banner
     (primary-tinted, not destructive — this is a nudge, not an alert):
     `Last entry Jul 8 — 11 days ago` + one **Catch up** button.
3. Catch up navigates to `/expenses?bulk=1`; `ExpensePage` opens the bulk
   modal once and strips the param. Bulk modal date defaults to today as
   usual (user is catching up several days; the shared date picker is the
   first field).
4. Zero expenses ever (new tracker) → render nothing.
5. Known limitation (accepted): a genuine no-spend day is
   indistinguishable from an unlogged day; copy says "last entry", and
   the 2-day threshold keeps single quiet days from nagging.

## Components

- `expenseRepository.getLastEntryDate(trackerId): Promise<string | null>`
  — `GET /trackers/:id/expenses?sort=date_desc&limit=1`, maps to the
  expense's `date` or `null` on empty (V1/V14 at the dto boundary).
- `daysSinceEntry(lastDate: string, today: string): number` — pure fn in
  `features/expenses/domain/services.ts`, vitest-tested (day math,
  today/yesterday boundaries, future-date guard → 0).
- `useLastEntryDate(trackerId)` — TanStack Query hook in the dashboard
  feature; invalidated by the existing expense mutations' invalidation of
  `expenseKeys.all` only if keyed under expenses — key it as an expenses
  list key (`expenseKeys.list`-style with a `lastEntry` marker) so any
  expense create/update/delete refreshes it automatically.
- `CatchUpBanner` — `features/dashboard/presentation/CatchUpBanner.tsx`,
  mounted in `DashboardPage` under the header, above stats. Renders quiet
  line / nudge banner / nothing.
- `ExpensePage`: read `?bulk=1` via TanStack Router search params, open
  the bulk modal once, replace the URL without the param.

## Testing

Vitest, pure functions only: `daysSinceEntry` cases (same day, yesterday,
11-day gap, month boundary, future date). Repository/hook/component are
covered by typecheck + manual verification.

## Out of scope (future ideas)

Calendar heatmap of gap days; explicit "no-spend day" marking; backend
`last_expense_date` on the dashboard endpoint (only if a second consumer
appears).

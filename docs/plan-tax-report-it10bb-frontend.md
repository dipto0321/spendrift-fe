# IT-10BB Tax Report — Frontend Implementation Plan

> Spec-driven. This plan extends `front-end/SPEC.md` (same `§G/§C/§I/§V/§T/§B` convention — OpenSpec is NOT installed, do NOT add it). Implementation must update `SPEC.md` alongside code and follow the existing feature-based DDD + shadcn/ui + TanStack patterns.

## Goal

A new `/tax-report` page where the user picks a Bangladesh financial year, the app calls the backend (which get-or-creates the persisted IT-10BB report), and renders the **9 IT-10BB heads** with English labels and editable amounts, plus copy-to-clipboard and regenerate actions. Dark-first, shadcn/ui, calm fintech styling per the existing design system.

## Why Bangladesh

This feature is scoped to Bangladeshi income tax because **IT-10BB is the Bangladesh National Board of Revenue (NBR) form** that declares an individual's annual statement of assets, liabilities, and living expenses. The user runs a **BDT (Bangladeshi Taka) tracker**, and the requirement is: *when the tracker currency is BDT, apply Bangladeshi tax rules*. Those rules are what map the tracker's expense categories into the form's 9 fixed heads, and they dictate the **income year** boundary of **July 1 → June 30** (e.g. income year `2025-26`). The trigger is currency-based, so a non-BDT tracker shows an informational notice but the form structure stays the same (the 9 heads are fixed by the form itself).

## Key facts (confirmed with user)

- AI/classification happens **server-side** (backend Gemini). The FE only calls the REST endpoints — no BYO-key LLM wiring here (unlike Smart Report).
- Reports are **persisted** server-side, so the FE just POSTs the fiscal year and renders whatever comes back (existing or newly generated).
- Labels are **English only** (no Bangla copy in the UI).

---

## API surface (backend, for reference)

| Method | Path | Body | Purpose |
|---|---|---|---|
| POST | `/trackers/{id}/tax-reports` | `{ fiscal_year }` | get-or-create (primary call) |
| GET | `/trackers/{id}/tax-reports` | — | list saved years |
| GET | `/trackers/{id}/tax-reports/{fiscal_year}` | — | fetch existing |
| PATCH | `/trackers/{id}/tax-reports/{fiscal_year}` | `{ heads:[{head_code,amount}] }` | save manual amount edits |
| POST | `/trackers/{id}/tax-reports/{fiscal_year}/regenerate` | — | force re-run |

Response (`TaxReportResponse`): `{ id, tracker_id, fiscal_year, start_date, end_date, currency, total_amount, heads: [{ head_code, head_name, description, amount, category_allocations: [{category_name, amount}] }], created_at, updated_at }`.

---

## New route

`src/routes/tax-report.tsx` (flat, like `reports.tsx` / `reports-ai.tsx`):

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import TaxReportPage from "@/features/tax-report/presentation/TaxReportPage";

export const Route = createFileRoute("/tax-report")({
  beforeLoad: requireAuth,
  component: TaxReportPage,
});
```

Registration (two files):
- `src/routes/__root.tsx` → add `"/tax-report": "Tax Report"` to `PAGE_TITLES`.
- `src/shared/ui/AppSidebar.tsx` → add `{ to: "/tax-report", label: "Tax Report", icon: Landmark, exact: false }` to `NAV_ITEMS` (`Landmark` from lucide-react; pick a fitting icon like `ReceiptText`/`Scale`/`FileSpreadsheet` if `Landmark` doesn't fit the set).

---

## New feature: `src/features/tax-report/` (3-layer DDD)

```
src/features/tax-report/
├── data/
│   ├── dto.ts            # snake_case wire shapes + mappers (decimal-string → number)
│   ├── queryKeys.ts      # taxReportKeys factory
│   └── repository.ts     # taxReportRepository (apiFetch calls)
├── domain/
│   ├── types.ts          # TaxReport, TaxHead, TaxCategoryAllocation, FiscalYear
│   ├── schema.ts         # zod schema for head amount edits (amount >= 0)
│   ├── fiscalYears.ts    # pure helper: list recent fiscal years + their date ranges
│   └── fiscalYears.test.ts
└── presentation/
    ├── TaxReportPage.tsx
    ├── useTaxReport.ts   # query + mutation hooks
    └── TaxHeadList.tsx   # renders/edits the 9 heads
```

### `data/dto.ts`

Mirror `features/reports/data/dto.ts`: snake_case DTOs + mapper to camelCase domain types, `Number(dto.amount)` at the boundary.

```ts
export type TaxHeadDto = {
  head_code: string; head_name: string; description: string;
  amount: string; category_allocations: { category_name: string; amount: string }[];
};
export type TaxReportDto = {
  id: string; tracker_id: string; fiscal_year: string; start_date: string; end_date: string;
  currency: string; total_amount: string; heads: TaxHeadDto[]; created_at: string; updated_at: string;
};
// mapTaxReport(dto) -> TaxReport (camelCase, Number() for amounts)
```

### `data/queryKeys.ts`

```ts
export const taxReportKeys = {
  report: (trackerId, fiscalYear) => ["tax-report", trackerId, fiscalYear] as const,
  list: (trackerId) => ["tax-report", trackerId, "list"] as const,
};
```

### `data/repository.ts`

Mirror `features/reports/data/repository.ts`:

```ts
export const taxReportRepository = {
  getOrCreate(trackerId, fiscalYear) {
    return apiFetch<TaxReportDto>(`/trackers/${trackerId}/tax-reports`,
      { method: "POST", body: { fiscal_year: fiscalYear } }).then(mapTaxReport);
  },
  list(trackerId) { return apiFetch<TaxReportSummaryDto[]>(...).then(mapSummaries); },
  get(trackerId, fiscalYear) { return apiFetch<TaxReportDto>(...).then(mapTaxReport); },
  updateHeads(trackerId, fiscalYear, heads) { PATCH ... { heads } },
  regenerate(trackerId, fiscalYear) { POST .../regenerate },
};
```

### `domain/types.ts`

`FiscalYear { key: "2025-26"; startDate: "2025-07-01"; endDate: "2026-06-30"; label: string }`, `TaxHead`, `TaxReport`, `TaxCategoryAllocation`, `TaxReportSummary`.

### `domain/fiscalYears.ts` (pure, unit-tested)

`buildFiscalYears(count = 5, now = new Date()): FiscalYear[]` — produces the last N income years. **Income year `YYYY-YY` = Jul 1 `YYYY` → Jun 30 `YYYY+1`.** Label includes the date range so there's no income/assessment-year ambiguity, e.g. `"2025-26 (1 Jul 2025 – 30 Jun 2026)"`. Pure function → `vitest` test.

### `domain/schema.ts` (zod)

`headAmountSchema = z.coerce.number().min(0)` and `taxHeadEditSchema = z.object({ head_code: z.string(), amount: z.coerce.number().min(0) })`.

### `presentation/useTaxReport.ts`

- `useTaxReportList(trackerId)` → `useQuery` on `taxReportKeys.list`.
- `useGenerateTaxReport(trackerId)` → `useMutation` calling `getOrCreate`; on success `invalidateQueries(taxReportKeys.report)` + `taxReportKeys.list`; toasts via `sonner`.
- `useUpdateTaxReportHeads(trackerId, fiscalYear)` → `useMutation` (PATCH), optimistic + rollback, `toast.success("Saved")` / `toast.error(...)`.
- `useRegenerateTaxReport(trackerId, fiscalYear)` → `useMutation`, invalidate + toast.

Active tracker + currency come from `useTracker()` (`features/trackers/presentation/TrackerContext.tsx`).

### `presentation/TaxReportPage.tsx`

Layout follows page shell convention: `<main className="flex flex-col gap-6 px-4 pb-14 pt-6">` with a full-width inner wrapper (reports uses full-width; keep it). Structure:

1. `PageHeader` — `kicker="Tax"`, `title="IT-10BB Tax Report"`, `description` referencing the Bangladesh income year, `actions` = copy-all button (disabled when no report).
2. **Fiscal-year selector** — shadcn `Select` (`src/components/ui/select.tsx`) listing `buildFiscalYears()` options, labeled with the date range; show a small "saved" `Badge` for years already in `useTaxReportList`. On change → `useGenerateTaxReport`.
3. **Currency guard** — if `activeTracker?.currency !== "BDT"`, show a soft `Alert` (`src/components/ui/alert.tsx`): "IT-10BB applies to Bangladeshi tax residents. This tracker uses {currency}." (non-blocking — user can still view).
4. **Report body** — `useQuery` on `taxReportKeys.report` (enabled when a year is selected). While generating/loading show `Skeleton` rows (`src/components/ui/skeleton.tsx`). Once loaded, render `TaxHeadList` + a total row.

### `presentation/TaxHeadList.tsx`

Render the 9 heads as shadcn `Card` (`src/components/ui/card.tsx`) rows or a `Table`. Each row:

- English name (headline) + description (muted secondary).
- Amount rendered with `useFormatCurrency()` (`features/preferences/presentation/useFormatCurrency.ts`) — BDT already maps to `৳` in `shared/utils/currency.ts`.
- Editable amount: `Input` (`src/components/ui/input.tsx`) with `react-hook-form` + zod, save on blur / a per-row Save or a single "Save changes" button calling `useUpdateTaxReportHeads`. Heads 8 (`personal_loan_interest`) and 9 (`environmental_surcharge`) default to 0 and are clearly editable for manual entry.
- Expandable per-head **category breakdown** (the `category_allocations` evidence) — `Collapsible`/`Popover` or a simple `<details>`-style toggle listing `category_name → amount`, so the user can sanity-check the AI mapping.
- A **Regenerate** button (calls `useRegenerateTaxReport`) with a confirm `AlertDialog` (`src/components/ui/alert-dialog.tsx`) since it re-runs the LLM.

Copy action: a "Copy" button that copies the 9 amounts (and/or `TSV`) to the clipboard via `navigator.clipboard.writeText`, with a `toast.success("Copied")`. Use a tiny pure helper in `domain/` (unit-testable) to format the copy text.

### Styling

Follow `styles.css` tokens only (zinc base, `--card`, `--muted-foreground`, `--primary`, `--success`, `--warning`), dark-first, Manrope font, `cn()` from `@/lib/utils`. No new global CSS; global selectors stay in `@layer base` (V19). Reuse `EmptyState` (`shared/ui/EmptyState.tsx`) for "select a year" and "no expenses this year" states.

---

## SPEC.md updates (frontend)

- `§I` — add `ui: /tax-report` route + the five `api: ... /tax-reports` endpoints.
- `§V` — new invariants, e.g.:
  - `V23`: IT-10BB report data accessed only via `taxReportRepository` (V1); keyed by `trackerId` in path (V6).
  - `V24`: amounts edited only through `useUpdateTaxReportHeads` (optimistic + rollback); render via `useFormatCurrency()` (V17).
  - `V25`: fiscal years are income-year `YYYY-YY` (Jul 1 → Jun 30) generated by a pure `buildFiscalYears` helper.
  - `V26`: manual head edits require `amount >= 0` (zod); regenerate guarded by confirm dialog.
- `§T` — add `T23 |x| tax report: /tax-report page, FY selector, editable IT-10BB heads, copy + regenerate | V23,V24,V25,V26,I.tax`.

---

## Tests

`domain/fiscalYears.test.ts` (vitest) — income-year boundaries across year rollover, label formatting, count. Optionally a `domain/copyText` helper test. Run `pnpm test`, `pnpm check` (biome), `pnpm lint`.

---

## Verification

1. `pnpm dev` (backend running with `GEMINI_API_KEY` + a BDT tracker with expenses spanning the chosen year).
2. Navigate to `/tax-report`: pick `2025-26` → POST fires → skeleton → 9 heads render with exact totals + per-head category breakdown.
3. Re-select the same year → report loads instantly from cache (no re-generation; backend returns persisted copy).
4. Edit a head amount (e.g. set heads 8/9) → Save → PATCH persists; reload confirms.
5. Regenerate → confirm dialog → re-runs generation.
6. Copy → clipboard holds the 9 amounts.
7. Switch to a non-BDT tracker → currency notice appears.
8. `pnpm check` / `pnpm lint` clean.

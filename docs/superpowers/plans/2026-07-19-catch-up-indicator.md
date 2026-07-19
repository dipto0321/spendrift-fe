# Catch-Up Recency Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An ambient "last entry" line on the dashboard that becomes a calm catch-up nudge (with a one-click path into the bulk-add modal) when the user is 2+ days behind on logging.

**Architecture:** Frontend-only. `expenseRepository.getLastEntryDate` asks the existing expenses endpoint for the single newest expense (`sort=date_desc&limit=1`); a pure `daysSinceEntry` computes the gap; `CatchUpBanner` renders quiet line / nudge / nothing; the nudge links to `/expenses?bulk=1`, which `ExpensePage` consumes once to auto-open the bulk modal.

**Tech Stack:** React 19, TanStack Query + Router, ShadCN UI, vitest, biome.

**Spec:** `docs/superpowers/specs/2026-07-19-catch-up-recency-design.md`

## Global Constraints

- Data access through `features/expenses/data/repository.ts` only (SPEC V1); dto conversion stays in `data/dto.ts` (V14).
- Tests: vitest, pure functions only — `daysSinceEntry` is the only unit-tested piece.
- Tabs, biome (`pnpm exec biome check <files>` — project-wide `pnpm check` has a known pre-existing error baseline).
- Threshold constant `NUDGE_AFTER_DAYS = 2` lives with the banner component.
- Zero-expenses tracker → banner renders nothing.
- Branch `feat/catch-up-indicator` from `main`; conventional commits; PR at the end.

---

### Task 1: `daysSinceEntry` domain function

**Files:**
- Modify: `src/features/expenses/domain/services.ts`
- Test: `src/features/expenses/domain/services.test.ts`

**Interfaces:**
- Produces: `daysSinceEntry(lastDate: string, today: string): number` — ISO date strings in, whole days out; invalid input or `lastDate >= today` → 0.

- [ ] **Step 1: Write the failing tests** (append to `services.test.ts`, add `daysSinceEntry` to the `./services` import):

```ts
describe("daysSinceEntry", () => {
	it("returns 0 for the same day and 1 for yesterday", () => {
		expect(daysSinceEntry("2026-07-19", "2026-07-19")).toBe(0);
		expect(daysSinceEntry("2026-07-18", "2026-07-19")).toBe(1);
	});

	it("counts an 11-day gap and crosses month boundaries", () => {
		expect(daysSinceEntry("2026-07-08", "2026-07-19")).toBe(11);
		expect(daysSinceEntry("2026-06-28", "2026-07-03")).toBe(5);
	});

	it("clamps future or invalid dates to 0", () => {
		expect(daysSinceEntry("2026-07-20", "2026-07-19")).toBe(0);
		expect(daysSinceEntry("not-a-date", "2026-07-19")).toBe(0);
	});
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm test src/features/expenses/domain/services.test.ts` → FAIL (`daysSinceEntry` not exported).

- [ ] **Step 3: Implement** (append to `services.ts`):

```ts
// Whole days between the last logged entry and "today" (both ISO dates,
// compared in UTC so DST shifts can't produce off-by-one gaps). Future or
// unparseable dates clamp to 0 — the caller treats 0 as "caught up".
export function daysSinceEntry(lastDate: string, today: string): number {
	const last = Date.parse(`${lastDate}T00:00:00Z`);
	const now = Date.parse(`${today}T00:00:00Z`);
	if (Number.isNaN(last) || Number.isNaN(now) || last >= now) return 0;
	return Math.round((now - last) / 86_400_000);
}
```

- [ ] **Step 4: Run to verify pass** — same command → PASS.
- [ ] **Step 5: Commit** — `feat(expenses): add daysSinceEntry domain helper`

---

### Task 2: `getLastEntryDate` repository seam + hook

**Files:**
- Modify: `src/features/expenses/domain/repository.ts` (add to `ExpenseRepository`)
- Modify: `src/features/expenses/data/repository.ts`
- Modify: `src/features/expenses/data/queryKeys.ts`
- Create: `src/features/dashboard/presentation/useLastEntryDate.ts`

**Interfaces:**
- Consumes: existing `apiFetch`, `ExpenseResponseDto`, `expensesPath`.
- Produces: `expenseRepository.getLastEntryDate(trackerId: string): Promise<string | null>`; `expenseKeys.lastEntry(trackerId)`; hook `useLastEntryDate(trackerId: string | undefined)` returning a query of `string | null`.

- [ ] **Step 1: Domain interface** — add to `ExpenseRepository` in `domain/repository.ts`:

```ts
	/** ISO date of the newest expense in the tracker, or null when empty. */
	getLastEntryDate(trackerId: string): Promise<string | null>;
```

- [ ] **Step 2: Data implementation** — add to `expenseRepository` in `data/repository.ts`:

```ts
	async getLastEntryDate(trackerId) {
		// The BE list endpoint already supports sorting; one newest row is all
		// we need, unfiltered by month.
		const dtos = await apiFetch<ExpenseResponseDto[]>(
			`${expensesPath(trackerId)}?sort=date_desc&limit=1`,
		);
		return dtos[0]?.date ?? null;
	},
```

- [ ] **Step 3: Query key** — add to `expenseKeys` in `data/queryKeys.ts` (prefix-compatible with `expenseKeys.all`, so every existing expense mutation's invalidation refreshes it automatically):

```ts
	lastEntry: (trackerId: string) =>
		["expenses", trackerId, "last-entry"] as const,
```

- [ ] **Step 4: Hook** — create `src/features/dashboard/presentation/useLastEntryDate.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { expenseKeys } from "@/features/expenses/data/queryKeys";
import { expenseRepository } from "@/features/expenses/data/repository";

export function useLastEntryDate(trackerId: string | undefined) {
	return useQuery({
		queryKey: expenseKeys.lastEntry(trackerId as string),
		queryFn: () => expenseRepository.getLastEntryDate(trackerId as string),
		enabled: Boolean(trackerId),
	});
}
```

- [ ] **Step 5: Verify** — `pnpm test` PASS, `pnpm exec biome check` on the four files clean.
- [ ] **Step 6: Commit** — `feat(expenses): add getLastEntryDate repository seam`

---

### Task 3: `CatchUpBanner` on the dashboard

**Files:**
- Create: `src/features/dashboard/presentation/CatchUpBanner.tsx`
- Modify: `src/features/dashboard/presentation/DashboardPage.tsx`

**Interfaces:**
- Consumes: `daysSinceEntry` (Task 1), `useLastEntryDate` (Task 2), ShadCN `Button`, router `Link`.
- Produces: `CatchUpBanner` with props `{ lastEntryDate: string | null | undefined }` and exported `NUDGE_AFTER_DAYS = 2`.

- [ ] **Step 1: Component** — create `CatchUpBanner.tsx`:

```tsx
import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysSinceEntry } from "@/features/expenses/domain/services";

export const NUDGE_AFTER_DAYS = 2;

type CatchUpBannerProps = {
	// undefined = still loading; null = tracker has no expenses yet.
	lastEntryDate: string | null | undefined;
};

// Ambient logging recency: a muted one-liner while caught up, a calm
// primary-tinted nudge once NUDGE_AFTER_DAYS days have passed. Renders
// nothing for empty trackers — nudging a brand-new tracker is just noise.
export function CatchUpBanner({ lastEntryDate }: Readonly<CatchUpBannerProps>) {
	if (!lastEntryDate) return null;

	const today = new Date().toISOString().split("T")[0];
	const days = daysSinceEntry(lastEntryDate, today);

	if (days < NUDGE_AFTER_DAYS) {
		return (
			<p className="text-xs text-muted-foreground">
				Last entry: {days === 0 ? "today" : "yesterday"}
			</p>
		);
	}

	const formatted = new Date(`${lastEntryDate}T00:00:00`).toLocaleDateString(
		undefined,
		{ month: "short", day: "numeric" },
	);

	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
			<div className="flex items-center gap-2 text-sm">
				<CalendarClock className="size-4 text-primary" />
				<span>
					Last entry {formatted}
					<span className="text-muted-foreground"> — {days} days ago</span>
				</span>
			</div>
			<Button asChild size="sm">
				<Link to="/expenses" search={{ bulk: 1 }}>
					Catch up
				</Link>
			</Button>
		</div>
	);
}
```

- [ ] **Step 2: Mount** — in `DashboardPage.tsx` add imports:

```ts
import { CatchUpBanner } from "./CatchUpBanner";
import { useLastEntryDate } from "./useLastEntryDate";
```

add next to the other queries:

```ts
	const { data: lastEntryDate } = useLastEntryDate(trackerId);
```

and render as the first child of `<main>`, above `BudgetAlertBanner`:

```tsx
			<CatchUpBanner lastEntryDate={lastEntryDate} />
```

- [ ] **Step 3: Verify** — `pnpm test` PASS; biome clean on both files. (`search={{ bulk: 1 }}` will only typecheck after Task 4 defines the route's search schema — run `pnpm build` after Task 4, not here.)
- [ ] **Step 4: Commit** — `feat(dashboard): add catch-up recency banner`

---

### Task 4: `/expenses?bulk=1` auto-opens the bulk modal

**Files:**
- Modify: `src/routes/expenses.tsx`
- Modify: `src/features/expenses/presentation/ExpensePage.tsx`

**Interfaces:**
- Consumes: `bulkOpen` state + `setBulkOpen` already in `ExpensePage` (from the bulk-entry feature).
- Produces: route search schema `{ bulk?: 1 }` on `/expenses`.

- [ ] **Step 1: Route search schema** — `src/routes/expenses.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import { ExpensePage } from "@/features/expenses/presentation/ExpensePage";

type ExpensesSearch = {
	bulk?: 1;
};

export const Route = createFileRoute("/expenses")({
	beforeLoad: requireAuth,
	// `?bulk=1` opens the bulk-add modal once (used by the dashboard's
	// catch-up nudge); anything else normalizes to no search params.
	validateSearch: (search: Record<string, unknown>): ExpensesSearch =>
		search.bulk === 1 || search.bulk === "1" ? { bulk: 1 } : {},
	component: ExpensePage,
});
```

- [ ] **Step 2: Consume once in `ExpensePage.tsx`** — extend the router import and add the effect after the `bulkOpen` state declaration:

```ts
import { useNavigate, useSearch } from "@tanstack/react-router";
```

```ts
	const search = useSearch({ from: "/expenses" });
	const navigate = useNavigate();
	// The dashboard's catch-up nudge deep-links here with ?bulk=1: open the
	// bulk modal once, then strip the param so refresh/back doesn't re-open.
	useEffect(() => {
		if (search.bulk === 1) {
			setBulkOpen(true);
			void navigate({ to: "/expenses", search: {}, replace: true });
		}
	}, [search.bulk, navigate]);
```

- [ ] **Step 3: Verify** — `pnpm test` PASS; `pnpm build` succeeds (this also typechecks Task 3's `search={{ bulk: 1 }}` link).
- [ ] **Step 4: Commit** — `feat(expenses): auto-open bulk modal via ?bulk=1`

---

### Task 5: SPEC amendment, verification, PR

**Files:**
- Modify: `SPEC.md` (via `ck:spec` — run in main session)

- [ ] **Step 1: Amend SPEC.md** — §I add `- ui: /expenses?bulk=1 → auto-open bulk modal once, param stripped (dashboard catch-up nudge deep-link)`; §T add `T22|x|catch-up recency: CatchUpBanner on dashboard (quiet line <2d, nudge ≥2d → /expenses?bulk=1); getLastEntryDate via sort=date_desc&limit=1|V1,I.expenses`.
- [ ] **Step 2: Full verification** — `pnpm test && pnpm build`, biome clean on all changed files, biome error count vs `main` unchanged.
- [ ] **Step 3: Manual check** — dev server: dashboard shows the quiet line (you logged today) or nudge; "Catch up" lands on `/expenses` with the bulk modal open and the URL param stripped.
- [ ] **Step 4: Commit + PR** — `docs(spec): record catch-up recency indicator`; push `feat/catch-up-indicator`; PR into `main` listing the manual checks.

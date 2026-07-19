import type {
	Category,
	DateRange,
	Expense,
	ExpenseFilter,
	GroupedExpenses,
	NeedsWantsSplit,
} from "./types";

export function filterExpenses(
	expenses: Expense[],
	filter: ExpenseFilter,
): Expense[] {
	return expenses
		.filter((expense) => matchesDateRange(expense, filter))
		.filter((expense) => matchesCategoryFilter(expense, filter))
		.filter((expense) => matchesTypeFilter(expense, filter))
		.filter((expense) => matchesSearchFilter(expense, filter));
}

function matchesDateRange(expense: Expense, filter: ExpenseFilter): boolean {
	const range = filter.dateRange;
	if (!range) return true;
	if (range.start && expense.date < range.start) return false;
	if (range.end && expense.date > range.end) return false;
	return true;
}

function matchesCategoryFilter(
	expense: Expense,
	filter: ExpenseFilter,
): boolean {
	if (!filter.categoryIds || filter.categoryIds.length === 0) return true;

	return filter.categoryIds.includes(expense.categoryId);
}

function matchesTypeFilter(expense: Expense, filter: ExpenseFilter): boolean {
	if (!filter.types || filter.types.length === 0) return true;

	return filter.types.includes(expense.type);
}

function matchesSearchFilter(expense: Expense, filter: ExpenseFilter): boolean {
	if (!filter.search) return true;

	const term = filter.search.toLowerCase();
	const matchesDescription = expense.description?.toLowerCase().includes(term);

	return matchesDescription ?? false;
}

export function groupByCategory<T extends Expense>(
	expenses: T[],
): GroupedExpenses<T> {
	const map = new Map<string, T[]>();
	for (const expense of expenses) {
		const existing = map.get(expense.categoryId) ?? [];
		map.set(expense.categoryId, [...existing, expense]);
	}
	return map;
}

export function groupByMonth<T extends Expense>(
	expenses: T[],
): GroupedExpenses<T> {
	const map = new Map<string, T[]>();
	for (const expense of expenses) {
		const month = expense.date.slice(0, 7);
		const existing = map.get(month) ?? [];
		map.set(month, [...existing, expense]);
	}
	return map;
}

export function calculateTotal(expenses: Expense[]): number {
	return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function formatDateInputValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export function getTodayRange(): DateRange {
	const today = formatDateInputValue(new Date());

	return { start: today, end: today };
}

export function getThisMonthRange(referenceDate = new Date()): DateRange {
	return getMonthRange(
		referenceDate.getFullYear(),
		referenceDate.getMonth() + 1,
	);
}

export function isSameDateRange(left?: DateRange, right?: DateRange): boolean {
	if (!left || !right) return false;
	return left.start === right.start && left.end === right.end;
}

export function calculateNeedsWantsSplit(expenses: Expense[]): NeedsWantsSplit {
	const needs = expenses
		.filter((e) => e.type === "need")
		.reduce((sum, e) => sum + e.amount, 0);

	const wants = expenses
		.filter((e) => e.type === "want")
		.reduce((sum, e) => sum + e.amount, 0);

	const total = needs + wants;

	return {
		needs,
		wants,
		percentage: {
			needs: total === 0 ? 0 : Math.round((needs / total) * 100),
			wants: total === 0 ? 0 : Math.round((wants / total) * 100),
		},
	};
}

export function sortExpensesByDate<T extends Expense>(
	expenses: T[],
	direction: "asc" | "desc" = "desc",
): T[] {
	return [...expenses].sort((a, b) => {
		const cmp = a.date.localeCompare(b.date);
		return direction === "desc" ? -cmp : cmp;
	});
}

export function buildCategoryMap(
	categories: Category[],
): Map<string, Category> {
	return new Map(categories.map((c) => [c.id, c]));
}

export function isWithinDateRange(date: string, range: DateRange): boolean {
	if (range.start && date < range.start) return false;
	if (range.end && date > range.end) return false;
	return true;
}

export function getMonthRange(year: number, month: number): DateRange {
	const start = `${year}-${String(month).padStart(2, "0")}-01`;
	const lastDay = new Date(year, month, 0).getDate();
	const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
	return { start, end };
}

// Build the visible page-number slots for the expenses pagination control.
// Always shows the first and last page, the current page and its neighbours,
// with ellipses filling the gaps. Mirrors the shadcn pagination example.
export function buildPageList(
	current: number,
	last: number,
): Array<number | "ellipsis"> {
	if (last <= 1) return [1];
	const pages = new Set<number>([1, last, current, current - 1, current + 1]);
	const sorted = [...pages]
		.filter((p) => p >= 1 && p <= last)
		.sort((a, b) => a - b);

	const out: Array<number | "ellipsis"> = [];
	let prev = 0;
	for (const p of sorted) {
		if (prev && p - prev > 1) out.push("ellipsis");
		out.push(p);
		prev = p;
	}
	return out;
}

export function pageCount(total: number, pageSize: number): number {
	if (total <= 0 || pageSize <= 0) return 1;
	return Math.max(1, Math.ceil(total / pageSize));
}

export type BulkCreateResult = {
	succeeded: number[];
	failed: number[];
};

// Index-based partition of Promise.allSettled results so the bulk-save UI can
// keep failed rows (by position) in the grid for retry.
export function partitionSettled<T>(
	results: PromiseSettledResult<T>[],
): BulkCreateResult {
	const succeeded: number[] = [];
	const failed: number[] = [];
	results.forEach((result, index) => {
		(result.status === "fulfilled" ? succeeded : failed).push(index);
	});
	return { succeeded, failed };
}

// Whole days between the last logged entry and "today" (both ISO dates,
// compared in UTC so DST shifts can't produce off-by-one gaps). Future or
// unparseable dates clamp to 0 — the caller treats 0 as "caught up".
export function daysSinceEntry(lastDate: string, today: string): number {
	const last = Date.parse(`${lastDate}T00:00:00Z`);
	const now = Date.parse(`${today}T00:00:00Z`);
	if (Number.isNaN(last) || Number.isNaN(now) || last >= now) return 0;
	return Math.round((now - last) / 86_400_000);
}

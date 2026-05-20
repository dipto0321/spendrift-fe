import type {
	Category,
	DateRange,
	Expense,
	ExpenseFilter,
	ExpenseType,
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
	if (!filter.dateRange) return true;

	return (
		expense.date >= filter.dateRange.start &&
		expense.date <= filter.dateRange.end
	);
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
	return (
		Boolean(left) &&
		Boolean(right) &&
		left.start === right.start &&
		left.end === right.end
	);
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
	return date >= range.start && date <= range.end;
}

export function getMonthRange(year: number, month: number): DateRange {
	const start = `${year}-${String(month).padStart(2, "0")}-01`;
	const lastDay = new Date(year, month, 0).getDate();
	const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
	return { start, end };
}

export function formatExpenseType(type: ExpenseType): string {
	return type === "need" ? "Need" : "Want";
}

export function getCategoryById(
	categories: Category[],
	id: string,
): Category | undefined {
	return categories.find((c) => c.id === id);
}

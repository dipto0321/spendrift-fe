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
	return expenses.filter((expense) => {
		if (filter.dateRange) {
			if (expense.date < filter.dateRange.start) return false;
			if (expense.date > filter.dateRange.end) return false;
		}

		if (filter.categoryIds && filter.categoryIds.length > 0) {
			if (!filter.categoryIds.includes(expense.categoryId)) return false;
		}

		if (filter.types && filter.types.length > 0) {
			if (!filter.types.includes(expense.type)) return false;
		}

		if (filter.search) {
			const term = filter.search.toLowerCase();
			const matchesDescription = expense.description
				?.toLowerCase()
				.includes(term);
			if (!matchesDescription) return false;
		}

		return true;
	});
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

export function calculateNeedsWantsSplit(
	expenses: Expense[],
): NeedsWantsSplit {
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
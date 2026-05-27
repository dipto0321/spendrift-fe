import type { Category, Expense } from "@/features/expenses/domain/types";
import type {
	AnalyticsResult,
	CategoryBreakdown,
	PeriodData,
	YearComparison,
} from "./types";

export function computeAnalytics(expenses: Expense[]): AnalyticsResult {
	if (expenses.length === 0) {
		return { total: 0, min: 0, max: 0, avg: 0, count: 0 };
	}

	const amounts = expenses.map((e) => e.amount);
	const total = amounts.reduce((sum, a) => sum + a, 0);

	return {
		total,
		min: Math.min(...amounts),
		max: Math.max(...amounts),
		avg: Math.round((total / expenses.length) * 100) / 100,
		count: expenses.length,
	};
}

export function groupByWeek(expenses: Expense[]): PeriodData[] {
	const weeks = new Map<string, { total: number; count: number }>();

	for (const expense of expenses) {
		const date = new Date(`${expense.date}T12:00:00`);
		const weekStart = getWeekStart(date);
		const key = weekStart.toISOString().split("T")[0];

		const existing = weeks.get(key) ?? { total: 0, count: 0 };
		weeks.set(key, {
			total: existing.total + expense.amount,
			count: existing.count + 1,
		});
	}

	return Array.from(weeks.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([label, data]) => ({ label, ...data }));
}

export function groupByMonth(expenses: Expense[]): PeriodData[] {
	const months = new Map<string, { total: number; count: number }>();

	for (const expense of expenses) {
		const month = expense.date.slice(0, 7);
		const existing = months.get(month) ?? { total: 0, count: 0 };
		months.set(month, {
			total: existing.total + expense.amount,
			count: existing.count + 1,
		});
	}

	return Array.from(months.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([label, data]) => ({ label, ...data }));
}

export function groupByYear(expenses: Expense[]): PeriodData[] {
	const years = new Map<string, { total: number; count: number }>();

	for (const expense of expenses) {
		const year = expense.date.slice(0, 4);
		const existing = years.get(year) ?? { total: 0, count: 0 };
		years.set(year, {
			total: existing.total + expense.amount,
			count: existing.count + 1,
		});
	}

	return Array.from(years.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([label, data]) => ({ label, ...data }));
}

export function multiYearComparison(expenses: Expense[]): YearComparison[] {
	const byYear = new Map<string, { total: number; count: number }>();

	for (const expense of expenses) {
		const year = expense.date.slice(0, 4);
		const existing = byYear.get(year) ?? { total: 0, count: 0 };
		byYear.set(year, {
			total: existing.total + expense.amount,
			count: existing.count + 1,
		});
	}

	return Array.from(byYear.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([year, data]) => ({
			year,
			total: data.total,
			avg: data.count > 0 ? Math.round((data.total / 12) * 100) / 100 : 0,
			count: data.count,
		}));
}

export function computeCategoryBreakdown(
	expenses: Expense[],
	categories: Category[],
): CategoryBreakdown[] {
	const categoryMap = new Map(categories.map((c) => [c.id, c]));
	const byCategory = new Map<string, { total: number; count: number }>();

	for (const expense of expenses) {
		const existing = byCategory.get(expense.categoryId) ?? {
			total: 0,
			count: 0,
		};
		byCategory.set(expense.categoryId, {
			total: existing.total + expense.amount,
			count: existing.count + 1,
		});
	}

	const grandTotal = Array.from(byCategory.values()).reduce(
		(sum, d) => sum + d.total,
		0,
	);

	return Array.from(byCategory.entries())
		.map(([categoryId, data]) => {
			const cat = categoryMap.get(categoryId);
			return {
				categoryId,
				categoryName: cat?.name ?? "Uncategorized",
				categoryColor: cat?.color ?? "#78716C",
				total: data.total,
				percentage:
					grandTotal > 0 ? Math.round((data.total / grandTotal) * 100) : 0,
				count: data.count,
			};
		})
		.sort((a, b) => b.total - a.total);
}

export function getMonthLabel(monthKey: string): string {
	const [year, month] = monthKey.split("-");
	const date = new Date(
		Number.parseInt(year, 10),
		Number.parseInt(month, 10) - 1,
		1,
	);
	return date.toLocaleDateString(undefined, {
		month: "short",
		year: "numeric",
	});
}

export function getWeekLabel(dateStr: string): string {
	const date = new Date(`${dateStr}T12:00:00`);
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

function getWeekStart(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

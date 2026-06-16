import { describe, expect, it } from "vitest";
import type { Category, Expense } from "@/features/expenses/domain/types";
import {
	computeAnalytics,
	computeCategoryBreakdown,
	groupByMonth,
	groupByWeek,
	groupByYear,
	multiYearComparison,
} from "./services";

function expense(overrides: Partial<Expense> = {}): Expense {
	return {
		id: crypto.randomUUID(),
		trackerId: "t1",
		amount: 100,
		categoryId: "c1",
		date: "2026-01-10",
		type: "need",
		...overrides,
	};
}

describe("computeAnalytics", () => {
	it("returns zeros for no expenses", () => {
		expect(computeAnalytics([])).toEqual({
			total: 0,
			min: 0,
			max: 0,
			avg: 0,
			count: 0,
		});
	});

	it("computes total/min/max/avg/count", () => {
		const result = computeAnalytics([
			expense({ amount: 100 }),
			expense({ amount: 50 }),
			expense({ amount: 30 }),
		]);
		expect(result.total).toBe(180);
		expect(result.min).toBe(30);
		expect(result.max).toBe(100);
		expect(result.avg).toBe(60);
		expect(result.count).toBe(3);
	});

	it("rounds the average to two decimals", () => {
		const result = computeAnalytics([
			expense({ amount: 10 }),
			expense({ amount: 10 }),
			expense({ amount: 11 }),
		]);
		expect(result.avg).toBe(10.33);
	});
});

describe("grouping", () => {
	const expenses = [
		expense({ amount: 100, date: "2024-01-05" }),
		expense({ amount: 50, date: "2024-01-20" }),
		expense({ amount: 200, date: "2025-03-03" }),
	];

	it("groups by month, sorted ascending", () => {
		const months = groupByMonth(expenses);
		expect(months.map((m) => m.label)).toEqual(["2024-01", "2025-03"]);
		expect(months[0]).toMatchObject({ total: 150, count: 2 });
	});

	it("groups by year, sorted ascending", () => {
		const years = groupByYear(expenses);
		expect(years.map((y) => y.label)).toEqual(["2024", "2025"]);
		expect(years[0].total).toBe(150);
		expect(years[1].total).toBe(200);
	});

	it("collapses same-week expenses into one bucket", () => {
		// Two dates in the same Mon–Sun week aggregate together. The exact label
		// is a week-start date string; we avoid asserting it because it is derived
		// via toISOString() (UTC) and would be timezone-dependent.
		const weeks = groupByWeek([
			expense({ amount: 100, date: "2026-01-07" }), // Wed
			expense({ amount: 40, date: "2026-01-08" }), // Thu, same week
		]);
		expect(weeks).toHaveLength(1);
		expect(weeks[0].total).toBe(140);
		expect(weeks[0].label).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("separates expenses in different weeks", () => {
		const weeks = groupByWeek([
			expense({ date: "2026-01-07" }),
			expense({ date: "2026-01-20" }),
		]);
		expect(weeks).toHaveLength(2);
	});
});

describe("multiYearComparison", () => {
	it("totals per year and averages over 12 months", () => {
		const result = multiYearComparison([
			expense({ amount: 120, date: "2024-01-01" }),
			expense({ amount: 240, date: "2024-06-01" }),
		]);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ year: "2024", total: 360, count: 2 });
		expect(result[0].avg).toBe(30); // 360 / 12
	});
});

describe("computeCategoryBreakdown", () => {
	const categories: Category[] = [
		{
			id: "food",
			trackerId: "t1",
			name: "Food",
			color: "#EF4444",
			createdAt: "",
		},
		{
			id: "fun",
			trackerId: "t1",
			name: "Fun",
			color: "#3B82F6",
			createdAt: "",
		},
	];

	it("aggregates by category, sorted by total desc, with percentages", () => {
		const result = computeCategoryBreakdown(
			[
				expense({ amount: 300, categoryId: "food" }),
				expense({ amount: 100, categoryId: "fun" }),
			],
			categories,
		);
		expect(result.map((r) => r.categoryName)).toEqual(["Food", "Fun"]);
		expect(result[0]).toMatchObject({ total: 300, percentage: 75, count: 1 });
		expect(result[1].percentage).toBe(25);
	});

	it("falls back to an Uncategorized label/color for unknown categories", () => {
		const result = computeCategoryBreakdown(
			[expense({ amount: 80, categoryId: "ghost" })],
			categories,
		);
		expect(result[0].categoryName).toBe("Uncategorized");
		expect(result[0].categoryColor).toBe("#78716C");
		expect(result[0].percentage).toBe(100);
	});
});

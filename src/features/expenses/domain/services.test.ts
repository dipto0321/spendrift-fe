import { describe, expect, it } from "vitest";
import {
	calculateNeedsWantsSplit,
	calculateTotal,
	filterExpenses,
	getMonthRange,
	groupByCategory,
	groupByMonth,
	isWithinDateRange,
	sortExpensesByDate,
} from "./services";
import type { Expense } from "./types";

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

const sample: Expense[] = [
	expense({
		amount: 100,
		categoryId: "food",
		date: "2026-01-05",
		type: "need",
		description: "Groceries",
	}),
	expense({
		amount: 50,
		categoryId: "fun",
		date: "2026-01-20",
		type: "want",
		description: "Cinema",
	}),
	expense({
		amount: 200,
		categoryId: "food",
		date: "2026-02-02",
		type: "need",
		description: "Restaurant",
	}),
];

describe("filterExpenses", () => {
	it("returns everything for an empty filter", () => {
		expect(filterExpenses(sample, {})).toHaveLength(3);
	});

	it("filters by date range (inclusive)", () => {
		const result = filterExpenses(sample, {
			dateRange: { start: "2026-01-01", end: "2026-01-31" },
		});
		expect(result.map((e) => e.date)).toEqual(["2026-01-05", "2026-01-20"]);
	});

	it("filters by category ids", () => {
		const result = filterExpenses(sample, { categoryIds: ["food"] });
		expect(result).toHaveLength(2);
		expect(result.every((e) => e.categoryId === "food")).toBe(true);
	});

	it("filters by expense type", () => {
		const result = filterExpenses(sample, { types: ["want"] });
		expect(result).toHaveLength(1);
		expect(result[0].categoryId).toBe("fun");
	});

	it("filters by case-insensitive description search", () => {
		expect(filterExpenses(sample, { search: "cinema" })).toHaveLength(1);
		expect(filterExpenses(sample, { search: "GROCER" })).toHaveLength(1);
	});

	it("combines filters with AND semantics", () => {
		const result = filterExpenses(sample, {
			categoryIds: ["food"],
			dateRange: { start: "2026-02-01", end: "2026-02-28" },
		});
		expect(result).toHaveLength(1);
		expect(result[0].date).toBe("2026-02-02");
	});
});

describe("calculateNeedsWantsSplit", () => {
	it("splits totals and rounds percentages", () => {
		const split = calculateNeedsWantsSplit(sample);
		expect(split.needs).toBe(300);
		expect(split.wants).toBe(50);
		expect(split.percentage.needs).toBe(86); // 300/350
		expect(split.percentage.wants).toBe(14);
	});

	it("returns zero percentages when there are no expenses", () => {
		const split = calculateNeedsWantsSplit([]);
		expect(split).toEqual({
			needs: 0,
			wants: 0,
			percentage: { needs: 0, wants: 0 },
		});
	});
});

describe("groupByMonth / groupByCategory", () => {
	it("groups by YYYY-MM", () => {
		const byMonth = groupByMonth(sample);
		expect(byMonth.get("2026-01")).toHaveLength(2);
		expect(byMonth.get("2026-02")).toHaveLength(1);
	});

	it("groups by category id", () => {
		const byCategory = groupByCategory(sample);
		expect(byCategory.get("food")).toHaveLength(2);
		expect(byCategory.get("fun")).toHaveLength(1);
	});
});

describe("calculateTotal", () => {
	it("sums amounts", () => {
		expect(calculateTotal(sample)).toBe(350);
		expect(calculateTotal([])).toBe(0);
	});
});

describe("sortExpensesByDate", () => {
	it("sorts descending by default and does not mutate the input", () => {
		const input = [...sample];
		const sorted = sortExpensesByDate(input);
		expect(sorted.map((e) => e.date)).toEqual([
			"2026-02-02",
			"2026-01-20",
			"2026-01-05",
		]);
		expect(input).toEqual(sample); // original order preserved
	});

	it("sorts ascending when asked", () => {
		const sorted = sortExpensesByDate(sample, "asc");
		expect(sorted[0].date).toBe("2026-01-05");
	});
});

describe("getMonthRange", () => {
	it("returns the first and last day of the month", () => {
		expect(getMonthRange(2026, 2)).toEqual({
			start: "2026-02-01",
			end: "2026-02-28",
		});
	});

	it("handles leap years", () => {
		expect(getMonthRange(2024, 2).end).toBe("2024-02-29");
	});
});

describe("isWithinDateRange", () => {
	it("is inclusive of both ends", () => {
		const range = { start: "2026-01-01", end: "2026-01-31" };
		expect(isWithinDateRange("2026-01-01", range)).toBe(true);
		expect(isWithinDateRange("2026-01-31", range)).toBe(true);
		expect(isWithinDateRange("2026-02-01", range)).toBe(false);
	});
});

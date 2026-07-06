import { describe, expect, it } from "vitest";
import type { Category, Expense } from "@/features/expenses/domain/types";
import {
	analyticsFromBuckets,
	analyticsFromDailyBuckets,
	computeAnalytics,
	computeCategoryBreakdown,
	daySpanInRange,
	elapsedDaysInRange,
	granularityForRange,
	groupByMonth,
	groupByWeek,
	groupByYear,
	multiYearComparison,
	yearlyRangeFromComparison,
} from "./services";
import type { YearComparison } from "./types";

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

describe("analyticsFromBuckets", () => {
	it("returns zeros for no buckets", () => {
		expect(analyticsFromBuckets([])).toEqual({
			total: 0,
			min: 0,
			max: 0,
			avg: 0,
			count: 0,
		});
	});

	it("computes total/min/max/avg over the bucket totals (not the rows)", () => {
		// The fix-up story: before this helper, ReportsPage used per-row
		// aggregation, so a handful of ৳20 coffee entries plus a ৳30,809
		// one-off would give lowest=৳20 / highest=৳30,809 even when the
		// monthly buckets were ~৳73k. Now we get the per-bucket values.
		const result = analyticsFromBuckets([
			{ label: "2026-04", total: 95_569, count: 41 },
			{ label: "2026-05", total: 80_121, count: 38 },
			{ label: "2026-06", total: 80_024, count: 33 },
			{ label: "2026-07", total: 36_003.4, count: 4 },
		]);
		expect(result.total).toBeCloseTo(291_717.4, 1);
		expect(result.min).toBe(36_003.4);
		expect(result.max).toBe(95_569);
		expect(result.count).toBe(4);
		expect(result.avg).toBe(Math.round((291_717.4 / 4) * 100) / 100);
	});

	it("single-bucket case: avg equals that bucket's total", () => {
		expect(
			analyticsFromBuckets([{ label: "a", total: 100, count: 1 }]).avg,
		).toBe(100);
	});

	it("rounds the average to two decimals", () => {
		// 100 + 100 + 10 = 210, / 3 = 70 (already exact).
		// For a non-terminating case: 100 + 100 + 100 + 1 = 301 / 4 = 75.25.
		expect(
			analyticsFromBuckets([
				{ label: "a", total: 100, count: 1 },
				{ label: "b", total: 100, count: 1 },
				{ label: "c", total: 100, count: 1 },
				{ label: "d", total: 1, count: 1 },
			]).avg,
		).toBe(75.25);
		// And a case that actually needs rounding: 100 / 3 = 33.333...
		expect(
			analyticsFromBuckets([
				{ label: "a", total: 100, count: 1 },
				{ label: "b", total: 0, count: 0 },
				{ label: "c", total: 0, count: 0 },
			]).avg,
		).toBe(33.33);
	});
});

describe("analyticsFromDailyBuckets", () => {
	it("returns zeros for no buckets", () => {
		expect(analyticsFromDailyBuckets([], 30)).toEqual({
			total: 0,
			min: 0,
			max: 0,
			avg: 0,
			count: 0,
		});
	});

	it("returns zeros when daySpanInRange is 0 or negative", () => {
		expect(
			analyticsFromDailyBuckets(
				[{ label: "2026-07-01", total: 100, count: 1 }],
				0,
			).total,
		).toBe(0);
	});

	it("averages over the range span (not the days-with-expenses)", () => {
		// July 1–9 inclusive = 9 days. Two days had expenses (৳10 + ৳40 = ৳50).
		// Average = total / 9 = 5.56, NOT total / 2 = 25 — matches the
		// user-stated rule: 'if today is the 9th, divide by 9'.
		const result = analyticsFromDailyBuckets(
			[
				{ label: "2026-07-01", total: 10, count: 1 },
				{ label: "2026-07-05", total: 40, count: 1 },
			],
			9,
		);
		expect(result.total).toBe(50);
		expect(result.min).toBe(10);
		expect(result.max).toBe(40);
		expect(result.avg).toBe(5.56);
		expect(result.count).toBe(2);
	});

	it("single-day case: avg = total / daySpan", () => {
		expect(
			analyticsFromDailyBuckets(
				[{ label: "2026-07-01", total: 100, count: 1 }],
				1,
			).avg,
		).toBe(100);
		expect(
			analyticsFromDailyBuckets(
				[{ label: "2026-07-01", total: 300, count: 1 }],
				30,
			).avg,
		).toBe(10);
	});
});

describe("granularityForRange", () => {
	it("returns daily for short ranges", () => {
		expect(granularityForRange("2026-07-01", "2026-07-07")).toBe("daily");
		expect(granularityForRange("2026-07-01", "2026-07-01")).toBe("daily");
	});

	it("returns weekly for medium ranges", () => {
		expect(granularityForRange("2026-07-01", "2026-07-31")).toBe("weekly");
		expect(granularityForRange("2026-06-01", "2026-07-31")).toBe("weekly");
	});

	it("returns monthly for year-scale ranges", () => {
		expect(granularityForRange("2026-01-01", "2026-12-31")).toBe("monthly");
		expect(granularityForRange("2025-01-01", "2026-12-31")).toBe("monthly");
	});

	it("returns yearly for multi-year ranges", () => {
		expect(granularityForRange("2024-01-01", "2026-12-31")).toBe("yearly");
	});

	it("falls back to monthly for open-ended ranges", () => {
		expect(granularityForRange(undefined, undefined)).toBe("monthly");
		expect(granularityForRange("2026-07-01", undefined)).toBe("monthly");
		expect(granularityForRange(undefined, "2026-07-31")).toBe("monthly");
	});
});

describe("daySpanInRange", () => {
	it("counts inclusive days between two dates", () => {
		expect(daySpanInRange("2026-07-01", "2026-07-01")).toBe(1);
		expect(daySpanInRange("2026-07-01", "2026-07-09")).toBe(9);
		expect(daySpanInRange("2026-07-01", "2026-07-31")).toBe(31);
	});

	it("returns 1 for open-ended or invalid ranges", () => {
		expect(daySpanInRange(undefined, undefined)).toBe(1);
		expect(daySpanInRange("2026-07-01", undefined)).toBe(1);
		expect(daySpanInRange(undefined, "2026-07-31")).toBe(1);
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

describe("yearlyRangeFromComparison", () => {
	function yc(year: string): YearComparison {
		return { year, total: 0, avg: 0, count: 0 };
	}

	it("returns undefined when the tracker has no data", () => {
		expect(yearlyRangeFromComparison([])).toBeUndefined();
	});

	it("returns the single year for a one-year tracker", () => {
		expect(yearlyRangeFromComparison([yc("2026")])).toEqual({
			startDate: "2026-01-01",
			endDate: "2026-12-31",
		});
	});

	it("spans min..max when the data fits within the cap", () => {
		expect(
			yearlyRangeFromComparison([yc("2024"), yc("2025"), yc("2026")]),
		).toEqual({
			startDate: "2024-01-01",
			endDate: "2026-12-31",
		});
	});

	it("caps to the most recent 5 years by default", () => {
		const years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"].map(
			yc,
		);
		expect(yearlyRangeFromComparison(years)).toEqual({
			startDate: "2020-01-01", // 2024 - 4
			endDate: "2024-12-31",
		});
	});

	it("honors a custom maxYears cap", () => {
		const years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"].map(
			yc,
		);
		expect(yearlyRangeFromComparison(years, 2)).toEqual({
			startDate: "2023-01-01",
			endDate: "2024-12-31",
		});
	});

	it("ignores years that don't parse as numbers", () => {
		expect(
			yearlyRangeFromComparison([yc("nope"), yc("2026"), yc("garbage")]),
		).toEqual({
			startDate: "2026-01-01",
			endDate: "2026-12-31",
		});
	});
});

describe("elapsedDaysInRange", () => {
	const today = new Date("2026-07-06T12:00:00Z");

	it("returns 1 for open-ended ranges", () => {
		expect(elapsedDaysInRange(undefined, undefined)).toBe(1);
		expect(elapsedDaysInRange("2026-07-01", undefined)).toBe(1);
	});

	it("returns the inclusive span when the range ends in the past", () => {
		expect(elapsedDaysInRange("2026-06-01", "2026-06-30", today)).toBe(30);
		expect(elapsedDaysInRange("2026-07-01", "2026-07-05", today)).toBe(5);
	});

	it("clips to today when the range extends into the future (Monthly view, Jul 6)", () => {
		// current month range Jul 1 → Jul 31, today is Jul 6 → 6 days elapsed
		expect(elapsedDaysInRange("2026-07-01", "2026-07-31", today)).toBe(6);
	});

	it("clips to today for the current week (Weekly view)", () => {
		// Week Jun 29 (Mon) → Jul 5 (Sun), today is Jul 6 (Mon of next week)
		// The week is already fully past, so the span is the whole 7 days.
		expect(elapsedDaysInRange("2026-06-29", "2026-07-05", today)).toBe(7);
		// Mid-week, Mon → Sun, today is Wed → 3 days elapsed.
		const wed = new Date("2026-07-01T12:00:00Z");
		expect(elapsedDaysInRange("2026-06-29", "2026-07-05", wed)).toBe(3);
	});

	it("falls back to 1 for invalid dates", () => {
		expect(elapsedDaysInRange("nope", "also-nope", today)).toBe(1);
	});

	it("uses the actual local 'today' when not given", () => {
		// A range ending today should always include today.
		const t = new Date();
		const todayStr = t.toISOString().slice(0, 10);
		const monthStart = `${todayStr.slice(0, 8)}01`;
		expect(elapsedDaysInRange(monthStart, todayStr)).toBeGreaterThanOrEqual(1);
	});
});

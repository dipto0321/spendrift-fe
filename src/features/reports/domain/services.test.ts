import { describe, expect, it } from "vitest";
import type { Expense } from "@/features/expenses/domain/types";
import {
	analyticsFromBuckets,
	analyticsFromDailyBuckets,
	daySpanInRange,
	elapsedDaysInRange,
	fillEmptyDailySlots,
	formatYearOverYearDelta,
	granularityForRange,
	groupByMonth,
	withYearOverYearDelta,
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

describe("fillEmptyDailySlots", () => {
	it("returns the input unchanged for open-ended ranges", () => {
		const input = [{ label: "2026-07-01", total: 10, count: 1 }];
		expect(fillEmptyDailySlots(input, undefined, undefined)).toEqual(input);
		expect(fillEmptyDailySlots(input, "2026-07-01", undefined)).toEqual(input);
		expect(fillEmptyDailySlots(input, undefined, "2026-07-07")).toEqual(input);
	});

	it("returns the input unchanged for invalid date strings", () => {
		const input = [{ label: "2026-07-01", total: 10, count: 1 }];
		expect(fillEmptyDailySlots(input, "nope", "also-nope")).toEqual(input);
	});

	it("pads a fully-empty week with 7 zero day-slots", () => {
		const out = fillEmptyDailySlots([], "2026-07-06", "2026-07-12");
		expect(out).toHaveLength(7);
		expect(out.every((d) => d.total === 0 && d.count === 0)).toBe(true);
		expect(out.map((d) => d.label)).toEqual([
			"2026-07-06",
			"2026-07-07",
			"2026-07-08",
			"2026-07-09",
			"2026-07-10",
			"2026-07-11",
			"2026-07-12",
		]);
	});

	it("preserves existing buckets and fills the gaps with zeros", () => {
		const out = fillEmptyDailySlots(
			[
				{ label: "2026-07-06", total: 100, count: 2 },
				{ label: "2026-07-09", total: 50, count: 1 },
			],
			"2026-07-06",
			"2026-07-12",
		);
		expect(out).toHaveLength(7);
		expect(out.find((d) => d.label === "2026-07-06")).toEqual({
			label: "2026-07-06",
			total: 100,
			count: 2,
		});
		expect(out.find((d) => d.label === "2026-07-09")).toEqual({
			label: "2026-07-09",
			total: 50,
			count: 1,
		});
		// The other 5 days are zero-filled.
		const zeros = out.filter((d) => d.total === 0);
		expect(zeros).toHaveLength(5);
	});

	it("pads a full month with 31 day-slots", () => {
		const out = fillEmptyDailySlots(
			[{ label: "2026-07-15", total: 200, count: 3 }],
			"2026-07-01",
			"2026-07-31",
		);
		expect(out).toHaveLength(31);
		expect(out[0].label).toBe("2026-07-01");
		expect(out[30].label).toBe("2026-07-31");
		expect(out[14].total).toBe(200);
		expect(out[14].count).toBe(3);
	});

	it("handles unsorted input by sorting the output ascending", () => {
		const out = fillEmptyDailySlots(
			[
				{ label: "2026-07-10", total: 30, count: 1 },
				{ label: "2026-07-06", total: 10, count: 1 },
				{ label: "2026-07-08", total: 20, count: 1 },
			],
			"2026-07-06",
			"2026-07-12",
		);
		expect(out.map((d) => d.label)).toEqual([
			"2026-07-06",
			"2026-07-07",
			"2026-07-08",
			"2026-07-09",
			"2026-07-10",
			"2026-07-11",
			"2026-07-12",
		]);
		// Values preserved across reorder.
		expect(out[0].total).toBe(10);
		expect(out[2].total).toBe(20);
		expect(out[4].total).toBe(30);
	});
});

describe("withYearOverYearDelta", () => {
	it("returns null for the first year (no prior)", () => {
		const out = withYearOverYearDelta([{ total: 100 }, { total: 120 }]);
		expect(out[0].deltaPct).toBeNull();
		expect(out[1].deltaPct).toBe(20); // (120-100)/100 = +20%
	});

	it("computes the percentage change rounded to the nearest integer", () => {
		const out = withYearOverYearDelta([
			{ total: 100 },
			{ total: 150 }, // +50%
			{ total: 99 }, // -34%  ((99-150)/150 = -0.34 → -34%)
			{ total: 200 }, // +102% ((200-99)/99 ≈ 1.0202 → 102%)
		]);
		expect(out.map((r) => r.deltaPct)).toEqual([null, 50, -34, 102]);
	});

	it("returns null when the prior year total is 0 (infinite change)", () => {
		const out = withYearOverYearDelta([{ total: 0 }, { total: 50 }]);
		expect(out[1].deltaPct).toBeNull();
	});

	it("returns all-nulls for a single-year series", () => {
		const out = withYearOverYearDelta([{ total: 100 }]);
		expect(out[0].deltaPct).toBeNull();
	});

	it("preserves the original fields on each row", () => {
		const out = withYearOverYearDelta([
			{ year: "2024", total: 100, count: 5 },
			{ year: "2025", total: 200, count: 8 },
		]);
		expect(out[1]).toMatchObject({ year: "2025", total: 200, count: 8 });
	});
});

describe("formatYearOverYearDelta", () => {
	it("renders an empty string when deltaPct is null", () => {
		expect(formatYearOverYearDelta(null)).toBe("");
	});

	it("renders positive deltas with a leading +", () => {
		expect(formatYearOverYearDelta(12)).toBe("+12%");
		expect(formatYearOverYearDelta(150)).toBe("+150%");
	});

	it("renders negative deltas with a leading -", () => {
		expect(formatYearOverYearDelta(-25)).toBe("-25%");
	});

	it("renders 0% without a sign", () => {
		expect(formatYearOverYearDelta(0)).toBe("0%");
	});
});

import type { Category, Expense } from "@/features/expenses/domain/types";
import type {
	AnalyticsResult,
	CategoryBreakdown,
	PeriodData,
	ReportPeriod,
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

/**
 * Aggregate analytics over a pre-bucketed spending series (one entry per
 * week/month/year). Matches the chart's bucket granularity, so the stat
 * cards above the chart and the chart bars tell the same story. With an
 * empty series (e.g. no expenses in the range) every field is zero.
 */
export function analyticsFromBuckets(buckets: PeriodData[]): AnalyticsResult {
	if (buckets.length === 0) {
		return { total: 0, min: 0, max: 0, avg: 0, count: 0 };
	}
	const totals = buckets.map((b) => b.total);
	const total = totals.reduce((sum, t) => sum + t, 0);
	return {
		total,
		min: Math.min(...totals),
		max: Math.max(...totals),
		avg: Math.round((total / buckets.length) * 100) / 100,
		count: buckets.length,
	};
}

/**
 * Per-day analytics over a daily-bucketed spending series. Unlike
 * `analyticsFromBuckets` (which compares across buckets and so collapses
 * to the same value when there's only one entry), this computes the
 * lowest/highest day-total and averages the total over the *span* of
 * the active range — so on a Monthly view that shows "9 of 30 days have
 * passed", Average = total / 9, not total / days-with-expenses. The
 * caller passes `daySpanInRange` to control the divisor.
 */
export function analyticsFromDailyBuckets(
	buckets: PeriodData[],
	daySpanInRange: number,
): AnalyticsResult {
	if (buckets.length === 0 || daySpanInRange <= 0) {
		return { total: 0, min: 0, max: 0, avg: 0, count: 0 };
	}
	const totals = buckets.map((b) => b.total);
	const total = totals.reduce((sum, t) => sum + t, 0);
	return {
		total,
		min: Math.min(...totals),
		max: Math.max(...totals),
		avg: Math.round((total / daySpanInRange) * 100) / 100,
		count: buckets.length,
	};
}

/**
 * Pick a bucket granularity for "compare-across-period" stat cards based
 * on the active date-range span. Open-ended ranges (no start or no end,
 * like the "All time" preset) fall back to monthly — there's no way to
 * measure the span without the lifetime data, and month-bucketed cards
 * stay meaningful regardless.
 *
 * Rules:
 *   ≤ 7 days  → daily
 *   ≤ 90 days → weekly
 *   ≤ 730 d   → monthly
 *   else      → yearly
 */
export function granularityForRange(
	startDate: string | undefined,
	endDate: string | undefined,
): ReportPeriod {
	if (!startDate || !endDate) return "monthly";
	const start = new Date(`${startDate}T00:00:00`);
	const end = new Date(`${endDate}T00:00:00`);
	const days = Math.max(
		1,
		Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
	);
	if (days <= 7) return "daily";
	if (days <= 90) return "weekly";
	if (days <= 730) return "monthly";
	return "yearly";
}

/**
 * Number of days covered by a date range (inclusive on both ends).
 * Falls back to 1 for open-ended ranges so callers can still divide.
 */
export function daySpanInRange(
	startDate: string | undefined,
	endDate: string | undefined,
): number {
	if (!startDate || !endDate) return 1;
	const start = new Date(`${startDate}T00:00:00`);
	const end = new Date(`${endDate}T00:00:00`);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
	return Math.max(
		1,
		Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
	);
}

/**
 * Number of days elapsed so far in the active period, used as the
 * Average divisor for the "current month" / "current week" presets.
 *
 * For a current-period range (e.g. Jul 1 → Jul 31 viewed on Jul 6), the
 * raw day-span (31) would understate the user's expected average — they
 * think of it as "what I've spent per day, so far". So we clip the end
 * to today's date when the range extends into the future.
 *
 * For historical / custom ranges (e.g. Jun 1 → Jun 15) the span stays
 * as-is. The optional `today` parameter makes this pure-function testable.
 */
export function elapsedDaysInRange(
	startDate: string | undefined,
	endDate: string | undefined,
	today: Date = new Date(),
): number {
	if (!startDate || !endDate) return 1;
	const start = new Date(`${startDate}T00:00:00`);
	const end = new Date(`${endDate}T00:00:00`);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
	const todayMidnight = new Date(
		Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
	);
	const effectiveEnd =
		end.getTime() > todayMidnight.getTime() ? todayMidnight : end;
	return Math.max(
		1,
		Math.round((effectiveEnd.getTime() - start.getTime()) / 86_400_000) + 1,
	);
}

/**
 * Derive the date range the "Yearly" preset should span from the tracker's
 * actual history. Capped to the most recent `maxYears` years (default 5) so
 * long-tenured trackers don't blow up the chart with 20 bars.
 *
 * Returns `undefined` when there's no data yet — the caller should fall back
 * to the current calendar year in that case so the chart isn't empty.
 */
export function yearlyRangeFromComparison(
	years: readonly YearComparison[],
	maxYears = 5,
): { startDate: string; endDate: string } | undefined {
	if (years.length === 0) return undefined;
	const parsed = years
		.map((y) => Number.parseInt(y.year, 10))
		.filter((n) => Number.isFinite(n));
	if (parsed.length === 0) return undefined;
	const min = Math.min(...parsed);
	const max = Math.max(...parsed);
	const startYear = Math.max(min, max - (maxYears - 1));
	return {
		startDate: `${startYear}-01-01`,
		endDate: `${max}-12-31`,
	};
}

/**
 * Fill in zero-buckets for any day in `[startDate, endDate]` that's missing
 * from `buckets`. The result has one entry per calendar day, sorted
 * ascending. Used by the Weekly chart so an empty week still renders 7
 * visible day-slots instead of an empty plot.
 *
 * If either bound is missing, returns the input unchanged (caller can fall
 * back to a different strategy for open-ended ranges).
 */
export function fillEmptyDailySlots(
	buckets: PeriodData[],
	startDate: string | undefined,
	endDate: string | undefined,
): PeriodData[] {
	if (!startDate || !endDate) return buckets;
	// Anchor both bounds at UTC midnight so `toISOString().slice(0, 10)`
	// returns the calendar day the user typed (avoids the off-by-one
	// you'd get from local-midnight in non-UTC zones).
	const [sy, sm, sd] = startDate.split("-").map(Number);
	const [ey, em, ed] = endDate.split("-").map(Number);
	if (!Number.isFinite(sy) || !Number.isFinite(ey)) return buckets;
	const startUtc = Date.UTC(sy, sm - 1, sd);
	const endUtc = Date.UTC(ey, em - 1, ed);
	const byLabel = new Map(buckets.map((b) => [b.label, b]));
	const out: PeriodData[] = [];
	for (let t = startUtc; t <= endUtc; t += 86_400_000) {
		const label = new Date(t).toISOString().slice(0, 10);
		const existing = byLabel.get(label);
		out.push(existing ?? { label, total: 0, count: 0 });
	}
	return out;
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

export function getDayLabel(dateStr: string): string {
	const date = new Date(`${dateStr}T12:00:00`);
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

/**
 * Compute year-over-year % change between consecutive yearly totals.
 * The first year has no prior — its `deltaPct` is `null` so the caller
 * can render an empty label rather than a misleading `+0%`. A prior-year
 * total of 0 also yields `null` (infinite change isn't meaningful as a
 * percentage). Returned alongside the original row so a chart layer can
 * plot `total` bars and the delta labels in one pass.
 */
export function withYearOverYearDelta<T extends { total: number }>(
	years: readonly T[],
): Array<T & { deltaPct: number | null }> {
	return years.map((row, i) => {
		const prior = years[i - 1];
		if (!prior || prior.total === 0) {
			return { ...row, deltaPct: null };
		}
		const deltaPct = Math.round(
			((row.total - prior.total) / prior.total) * 100,
		);
		return { ...row, deltaPct };
	});
}

/**
 * Render a YoY delta as a human-readable label. `null` (no prior year)
 * renders empty so the chart skips the label. `0` renders `0%` (don't
 * suppress — the user wants to see "no change" too).
 */
export function formatYearOverYearDelta(deltaPct: number | null): string {
	if (deltaPct === null) return "";
	if (deltaPct === 0) return "0%";
	const sign = deltaPct > 0 ? "+" : "";
	return `${sign}${deltaPct}%`;
}

function getWeekStart(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

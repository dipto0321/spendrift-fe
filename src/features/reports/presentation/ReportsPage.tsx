import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getCurrentMonth } from "@/features/budgets/domain/services";
import { useCurrentBudgetStatus } from "@/features/budgets/presentation/useCurrentBudgetStatus";
import { useFormatCurrency } from "@/features/preferences/presentation/useFormatCurrency";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { BudgetProgress } from "@/shared/ui/BudgetProgress";
import {
	formatDateLabel,
	formatDateValue,
	parseDateValue,
} from "@/shared/ui/DatePicker";
import { DateRangePicker } from "@/shared/ui/DateRangePicker";
import { MoneyText } from "@/shared/ui/MoneyText";
import { PageHeader } from "@/shared/ui/PageHeader";
import type { ReportRange } from "../data/queryKeys";
import {
	analyticsFromBuckets,
	analyticsFromDailyBuckets,
	elapsedDaysInRange,
	fillEmptyDailySlots,
	granularityForRange,
	yearlyRangeFromComparison,
} from "../domain/services";
import type { AnalyticsResult, ReportPeriod } from "../domain/types";
import { CategoryBreakdownChart } from "./CategoryBreakdownChart";
import { NeedsVsWantsPie } from "./NeedsVsWantsPie";
import { SpendingChart } from "./SpendingChart";
import {
	useCategoryBreakdown,
	useReportNeedsWants,
	useSpending,
	useYearComparison,
} from "./useReports";
import { YearComparisonChart } from "./YearComparisonChart";

// Period values: weekly/monthly/yearly are *date-range presets* (they
// re-derive start/end so analytics cards actually update). "custom" lets the
// user override via the DateRangePicker. "all" clears the range entirely.
type RangePreset = ReportPeriod | "custom" | "all";

function startOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay(); // 0 = Sunday
	const diff = (day + 6) % 7; // make Monday the start
	d.setDate(d.getDate() - diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function endOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = (day + 6) % 7; // Monday-based
	d.setDate(d.getDate() - diff + 6);
	d.setHours(23, 59, 59, 999);
	return d;
}

function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Derive the active `ReportRange` from a preset. "custom" needs the
 * caller-supplied date picker values; "all" yields an open-ended range.
 *
 * "yearly" intentionally returns `{}` here — the component layer substitutes
 * the actual data span (capped to the last 5 years) once `useYearComparison`
 * has loaded. That way the chart spans the user's entire history, not just
 * the current calendar year.
 */
function presetToRange(
	preset: RangePreset,
	customStart?: string,
	customEnd?: string,
): ReportRange {
	const now = new Date();
	switch (preset) {
		case "weekly":
			return {
				startDate: formatDateValue(startOfWeek(now)),
				endDate: formatDateValue(endOfWeek(now)),
			};
		case "monthly":
			return {
				startDate: formatDateValue(
					new Date(now.getFullYear(), now.getMonth(), 1),
				),
				endDate: formatDateValue(endOfMonth(now)),
			};
		case "yearly":
			// Resolved by the caller using the tracker's actual history.
			return {};
		case "custom":
			return {
				startDate: customStart,
				endDate: customEnd,
			};
		default:
			return {};
	}
}

function rangeLabel(range: ReportRange, preset: RangePreset): string {
	if (preset === "all") return "All time";
	if (preset !== "custom") {
		const from = range.startDate ? parseDateValue(range.startDate) : undefined;
		const to = range.endDate ? parseDateValue(range.endDate) : undefined;
		if (from && to) return `${formatDateLabel(from)} – ${formatDateLabel(to)}`;
	}
	const from = range.startDate ? parseDateValue(range.startDate) : undefined;
	const to = range.endDate ? parseDateValue(range.endDate) : undefined;
	if (!from && !to) return "All time";
	const fromLabel = from ? formatDateLabel(from) : "Start";
	const toLabel = to ? formatDateLabel(to) : "End";
	return `${fromLabel} – ${toLabel}`;
}

const PRESET_LABELS: { value: RangePreset; label: string }[] = [
	{ value: "weekly", label: "Weekly" },
	{ value: "monthly", label: "Monthly" },
	{ value: "yearly", label: "Yearly" },
	{ value: "custom", label: "Custom" },
	{ value: "all", label: "All time" },
];

const SKELETON_KEYS = ["total", "avg", "low", "high"] as const;

function ReportsPage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";
	const formatCurrency = useFormatCurrency();
	const [preset, setPreset] = useState<RangePreset>("monthly");
	const [customRange, setCustomRange] = useState<{
		start?: string;
		end?: string;
	}>({});

	// yearComparison's dataUpdatedAt is monotonic (independent of `range`),
	// so once it's non-zero we know the user has been on the page long
	// enough for at least one fetch to land and we should never replace
	// the page chrome with the cold-start skeleton again (that unmount
	// would yank the open popover's anchor tree and close the date picker
	// mid-selection, looking like a page refresh).
	const yearComparisonQuery = useYearComparison(trackerId);
	const { data: yearComparison = [] } = yearComparisonQuery;
	const yearComparisonUpdatedAt = yearComparisonQuery.dataUpdatedAt;

	const range = useMemo<ReportRange>(() => {
		const base = presetToRange(preset, customRange.start, customRange.end);
		// For "yearly" we span the tracker's actual history (capped to the
		// last 5 years) instead of locking to the current calendar year.
		// Before the year-comparison query has returned, fall back to the
		// current calendar year so the chart isn't empty mid-load.
		if (preset === "yearly") {
			const fromData = yearlyRangeFromComparison(yearComparison);
			if (fromData) return fromData;
			const now = new Date();
			return {
				startDate: `${now.getFullYear()}-01-01`,
				endDate: `${now.getFullYear()}-12-31`,
			};
		}
		return base;
	}, [preset, customRange.start, customRange.end, yearComparison]);

	// Chart bucket granularity: for weekly/monthly/yearly presets the user
	// picks the bucket explicitly. For custom ranges we derive from the span
	// (a 5-day range renders per-day bars; not a single monthly bar with all
	// the spend squashed into one column). For "all time" we have no bounds
	// to measure, so fall back to yearly when the tracker's history spans
	// multiple years (the user finds monthly buckets noisy past ~2 years) and
	// monthly otherwise.
	const bucketPeriod: ReportPeriod = useMemo(() => {
		if (preset === "weekly" || preset === "monthly" || preset === "yearly") {
			return preset;
		}
		if (preset === "all") {
			return yearComparison.length >= 2 ? "yearly" : "monthly";
		}
		return granularityForRange(range.startDate, range.endDate);
	}, [preset, range.startDate, range.endDate, yearComparison.length]);

	// Effective granularity for the stat cards (and reused by the chart
	// when its display period matches):
	//   - Weekly / Monthly presets: both chart and stat cards go per-day
	//     (current-week / current-month basis as the user requested).
	//   - Yearly: if only one year of data exists, fall back to monthly
	//     granularity so we have something to compare across. Multi-year
	//     keeps yearly cards.
	//   - All time: mirror the chart — yearly when the tracker has ≥2 years
	//     of history, monthly otherwise.
	//   - Custom: derive from the range span (≤7d daily, ≤90d weekly,
	//     ≤730d monthly, else yearly).
	const statsGranularity: ReportPeriod = useMemo(() => {
		if (preset === "weekly" || preset === "monthly") return "daily";
		if (preset === "yearly") {
			return yearComparison.length <= 1 ? "monthly" : "yearly";
		}
		if (preset === "all") {
			return yearComparison.length >= 2 ? "yearly" : "monthly";
		}
		return granularityForRange(range.startDate, range.endDate);
	}, [preset, range.startDate, range.endDate, yearComparison.length]);

	// Chart and stats share the same series when their granularities match.
	// They diverge only when the stats series uses a different bucket from
	// the chart (e.g. Yearly with 1 year of data → chart at year (1 bar),
	// cards per-month). Weekly/Monthly presets align on daily so we can
	// reuse the same fetch for the chart's day-slot rendering.
	const chartGranularity: ReportPeriod = bucketPeriod;
	const statsNeedsSeparateFetch = statsGranularity !== chartGranularity;

	// Chart series at the user's chosen period (weekly/monthly/yearly).
	const spendingQuery = useSpending(trackerId, chartGranularity, range);
	const periodData = spendingQuery.data ?? [];

	// Optional second fetch for the stats series whenever the cards want
	// a finer (or coarser) granularity than the chart shows.
	const statsSpendingQuery = useSpending(
		statsNeedsSeparateFetch ? trackerId : undefined,
		statsGranularity,
		range,
	);
	const statsData = statsSpendingQuery.data ?? periodData;

	// Weekly and Monthly presets render day-slots (7 for a week, 30/31 for
	// a month) so an empty week or partial month still shows the axis ticks
	// the user expects. We reuse the daily series already fetched for the
	// stat cards and pad any missing day with a zero-bucket. The chart's
	// display period is also "daily" in those cases so the header and axis
	// labels reflect what's actually being plotted. Yearly and "all" keep
	// their coarser bucket view.
	const chartDisplayPeriod: ReportPeriod = useMemo(() => {
		if (preset === "weekly" || preset === "monthly") return "daily";
		return bucketPeriod;
	}, [preset, bucketPeriod]);

	const chartData = useMemo(() => {
		if (preset === "weekly" || preset === "monthly") {
			return fillEmptyDailySlots(statsData, range.startDate, range.endDate);
		}
		return periodData;
	}, [preset, statsData, periodData, range.startDate, range.endDate]);

	// Derive analytics from the stats series (per-day when statsGranularity
	// is daily, otherwise from the chart series itself). Avg uses
	// `elapsedDaysInRange` so a Monthly view on July 9 divides by 9, not
	// 31 (the rest of the month is in the future and not part of the
	// user's "average so far" mental model).
	const analytics: AnalyticsResult = useMemo(() => {
		if (statsGranularity === "daily") {
			return analyticsFromDailyBuckets(
				statsData,
				elapsedDaysInRange(range.startDate, range.endDate),
			);
		}
		return analyticsFromBuckets(statsData);
	}, [statsGranularity, statsData, range.startDate, range.endDate]);

	const { data: categoryBreakdown = [] } = useCategoryBreakdown(
		trackerId,
		range,
	);
	const { data: needsWantsSplit } = useReportNeedsWants(trackerId, range);
	// Cold-start decision: only on the *very first* fetch do we replace the
	// whole page with a skeleton. After any successful query lands, range
	// changes must keep the page chrome mounted so the open date-picker
	// popover survives the refetch (otherwise the user sees what looks
	// like a page refresh after every click). `yearComparisonUpdatedAt`
	// serves as the monotonic "ever loaded" signal.
	const isColdStart = spendingQuery.isLoading && yearComparisonUpdatedAt === 0;

	// Category budgets — always current month, independent of the custom range
	const currentMonth = useMemo(() => getCurrentMonth(), []);
	const currentMonthRange = useMemo<ReportRange>(() => {
		const [year, month] = currentMonth.split("-").map(Number);
		return {
			startDate: `${currentMonth}-01`,
			endDate: formatDateValue(new Date(year, month, 0)),
		};
	}, [currentMonth]);
	const { data: catBudgetData = [] } = useCategoryBreakdown(
		trackerId,
		currentMonthRange,
	);
	const { currentBudget } = useCurrentBudgetStatus(trackerId);
	const monthlyLimit = currentBudget?.monthlyLimit ?? 0;
	const perCategoryBudget =
		catBudgetData.length > 0 && monthlyLimit > 0
			? monthlyLimit / catBudgetData.length
			: 0;

	const rangeLabelText = rangeLabel(range, preset);
	const isCustomActive = preset === "custom";

	const analyticsStats = useMemo(() => {
		// Card labels adapt to the granularity the stats series is bucketed
		// at. Daily: "Daily Average" / "Lowest Day" / "Highest Day" — what
		// a Monthly preset actually means in the user's mental model.
		// Weekly/Monthly/Yearly: "Average" / "Lowest" / "Highest" of the
		// period totals. Single-bucket views (count === 1) drop the three
		// compare-across stats since they'd equal Total.
		const avgLabel =
			statsGranularity === "daily"
				? "Daily Average"
				: statsGranularity === "weekly"
					? "Weekly Average"
					: statsGranularity === "monthly"
						? "Monthly Average"
						: "Yearly Average";
		const lowLabel =
			statsGranularity === "daily"
				? "Lowest Day"
				: statsGranularity === "weekly"
					? "Lowest Week"
					: statsGranularity === "monthly"
						? "Lowest Month"
						: "Lowest Year";
		const highLabel =
			statsGranularity === "daily"
				? "Highest Day"
				: statsGranularity === "weekly"
					? "Highest Week"
					: statsGranularity === "monthly"
						? "Highest Month"
						: "Highest Year";

		const stats = [{ key: "total", label: "Total", value: analytics.total }];
		if (analytics.count > 1) {
			stats.push(
				{ key: "avg", label: avgLabel, value: analytics.avg },
				{ key: "low", label: lowLabel, value: analytics.min },
				{ key: "high", label: highLabel, value: analytics.max },
			);
		}
		return stats;
	}, [analytics, statsGranularity]);

	if (isColdStart) {
		return (
			<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
				<PageHeader
					title="Reports & Analytics"
					description="Analyze spending patterns, category breakdowns, and year-over-year trends."
				/>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{SKELETON_KEYS.map((k) => (
						<Skeleton key={k} className="h-24 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-80 rounded-xl" />
			</main>
		);
	}

	return (
		<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
			<PageHeader
				title="Reports & Analytics"
				description="Analyze spending patterns, category breakdowns, and year-over-year trends."
			/>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{analyticsStats.map(({ key, label, value }) => (
					<Card key={key}>
						<CardContent className="flex flex-col gap-1.5">
							<span className="text-xs font-medium text-muted-foreground">
								{label}
							</span>
							<MoneyText
								amount={Math.round(value)}
								currency={currency}
								className="text-xl font-semibold tracking-tight tabular-nums"
							/>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm text-muted-foreground">Showing</span>
						<Badge variant="outline">{rangeLabelText}</Badge>
						{preset !== "monthly" && preset !== "all" ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => {
									setPreset("monthly");
									setCustomRange({});
								}}
							>
								Reset to monthly
							</Button>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<ToggleGroup
							type="single"
							value={preset}
							onValueChange={(value) => {
								if (!value) return;
								setPreset(value as RangePreset);
							}}
							className="rounded-full border border-border/60 bg-muted/30 p-1"
						>
							{PRESET_LABELS.map(({ value, label }) => (
								<ToggleGroupItem
									key={value}
									value={value}
									className="rounded-full px-3 py-1 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
								>
									{label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
						{isCustomActive ? (
							<DateRangePicker
								aria-label="Custom date range"
								className="h-9"
								value={customRange}
								onChange={setCustomRange}
							/>
						) : null}
					</div>
				</div>

				<SpendingChart
					data={chartData}
					period={chartDisplayPeriod}
					currency={currency}
				/>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardContent className="flex flex-col gap-4">
						<div>
							<p className="text-base font-semibold text-foreground">
								Category breakdown
							</p>
						</div>
						<CategoryBreakdownChart
							data={categoryBreakdown}
							currency={currency}
						/>
						<div className="space-y-2">
							{categoryBreakdown.slice(0, 5).map((item) => (
								<div
									key={item.categoryId}
									className="flex items-center justify-between text-sm"
								>
									<div className="flex items-center gap-2">
										<span
											className="h-2.5 w-2.5 rounded-full"
											style={{ backgroundColor: item.categoryColor }}
										/>
										<span className="text-foreground">{item.categoryName}</span>
									</div>
									<div className="flex items-center gap-3 tabular-nums">
										<span className="text-muted-foreground">
											{formatCurrency(item.total, currency)}
										</span>
										<span className="text-xs text-muted-foreground">
											{item.percentage}%
										</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex flex-col gap-4">
						<p className="text-base font-semibold text-foreground">
							Needs vs Wants
						</p>
						<NeedsVsWantsPie
							needs={needsWantsSplit?.needs ?? 0}
							wants={needsWantsSplit?.wants ?? 0}
							needsPercentage={needsWantsSplit?.percentage.needs ?? 0}
							wantsPercentage={needsWantsSplit?.percentage.wants ?? 0}
							currency={currency}
						/>
						<div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
							<div>
								<p className="m-0 text-xs text-muted-foreground">Needs</p>
								<MoneyText
									amount={needsWantsSplit?.needs ?? 0}
									currency={currency}
									className="mt-1 text-lg font-semibold tabular-nums"
								/>
							</div>
							<div>
								<p className="m-0 text-xs text-muted-foreground">Wants</p>
								<MoneyText
									amount={needsWantsSplit?.wants ?? 0}
									currency={currency}
									className="mt-1 text-lg font-semibold tabular-nums"
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{yearComparison.length > 0 && (
				<Card>
					<CardContent>
						<p className="mb-4 text-base font-semibold text-foreground">
							Year-over-year comparison
						</p>
						<YearComparisonChart data={yearComparison} currency={currency} />
					</CardContent>
				</Card>
			)}

			{catBudgetData.length > 0 && monthlyLimit > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Category budgets</CardTitle>
						<CardDescription>
							Budget vs actual spending per category this month.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
							{catBudgetData.map((cat) => (
								<BudgetProgress
									key={cat.categoryId}
									label={cat.categoryName}
									budget={perCategoryBudget}
									actual={cat.total}
									currency={currency}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			) : null}
		</main>
	);
}

export default ReportsPage;

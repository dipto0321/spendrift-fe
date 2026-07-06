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
	daySpanInRange,
	granularityForRange,
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

function startOfYear(date: Date): Date {
	return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date): Date {
	return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Derive the active `ReportRange` from a preset. "custom" needs the
 * caller-supplied date picker values; "all" yields an open-ended range.
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
			return {
				startDate: formatDateValue(startOfYear(now)),
				endDate: formatDateValue(endOfYear(now)),
			};
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

	const range = useMemo<ReportRange>(
		() => presetToRange(preset, customRange.start, customRange.end),
		[preset, customRange.start, customRange.end],
	);

	// The spending chart needs the bucket *label* period (weekly/monthly/yearly)
	// separate from the date-range filter — a "weekly" preset over a custom
	// range still makes sense, so we bucket by the user's chosen period when
	// one is selected, falling back to monthly for custom/all.
	const bucketPeriod: ReportPeriod =
		preset === "weekly" || preset === "monthly" || preset === "yearly"
			? preset
			: "monthly";

	// yearComparison's dataUpdatedAt is monotonic (independent of `range`),
	// so once it's non-zero we know the user has been on the page long
	// enough for at least one fetch to land and we should never replace
	// the page chrome with the cold-start skeleton again (that unmount
	// would yank the open popover's anchor tree and close the date picker
	// mid-selection, looking like a page refresh).
	const yearComparisonQuery = useYearComparison(trackerId);
	const { data: yearComparison = [] } = yearComparisonQuery;
	const yearComparisonUpdatedAt = yearComparisonQuery.dataUpdatedAt;

	// Effective granularity for the stat cards and chart:
	//   - Weekly / Monthly presets: stat cards go per-day (current-week /
	//     current-month basis as the user requested); chart stays at the
	//     user's chosen period.
	//   - Yearly: if only one year of data exists, fall back to monthly
	//     granularity so we have something to compare across. Multi-year
	//     keeps yearly cards.
	//   - Custom / All: derive from the range span (≤7d daily, ≤90d weekly,
	//     ≤730d monthly, else yearly). Open-ended ranges default to monthly.
	const statsGranularity: ReportPeriod = useMemo(() => {
		if (preset === "weekly" || preset === "monthly") return "daily";
		if (preset === "yearly") {
			return yearComparison.length <= 1 ? "monthly" : "yearly";
		}
		return granularityForRange(range.startDate, range.endDate);
	}, [preset, range.startDate, range.endDate, yearComparison.length]);

	// Chart and stats share the same series unless stats wants daily on a
	// weekly/monthly preset (in which case we fetch daily separately for
	// per-day Low/High/Avg, leaving the chart at the user's period).
	const chartGranularity: ReportPeriod = bucketPeriod;
	const needsSeparateStatsFetch =
		statsGranularity === "daily" && chartGranularity !== "daily";

	// Chart series at the user's chosen period (weekly/monthly/yearly).
	const spendingQuery = useSpending(trackerId, chartGranularity, range);
	const periodData = spendingQuery.data ?? [];

	// Optional second fetch for per-day stats when the user picked
	// weekly/monthly (so the cards can show lowest-day / highest-day /
	// daily average, while the chart stays at week/month bars).
	const statsSpendingQuery = useSpending(
		needsSeparateStatsFetch ? trackerId : undefined,
		"daily",
		range,
	);
	const statsDailyData = statsSpendingQuery.data ?? [];

	// Derive analytics from the stats series (per-day when statsGranularity
	// is daily, otherwise from the chart series itself). Avg uses
	// daySpanInRange so a Monthly view on July 9 divides by 9, not 30.
	const analytics: AnalyticsResult = useMemo(() => {
		if (statsGranularity === "daily") {
			return analyticsFromDailyBuckets(
				statsDailyData,
				daySpanInRange(range.startDate, range.endDate),
			);
		}
		return analyticsFromBuckets(periodData);
	}, [
		statsGranularity,
		statsDailyData,
		periodData,
		range.startDate,
		range.endDate,
	]);

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
					data={periodData}
					period={bucketPeriod}
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

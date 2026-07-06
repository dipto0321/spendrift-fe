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
import type { ReportPeriod } from "../domain/types";
import { CategoryBreakdownChart } from "./CategoryBreakdownChart";
import { NeedsVsWantsPie } from "./NeedsVsWantsPie";
import { SpendingChart } from "./SpendingChart";
import {
	useCategoryBreakdown,
	useReportNeedsWants,
	useReportSummary,
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

const EMPTY_ANALYTICS = { total: 0, min: 0, max: 0, avg: 0, count: 0 };

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

	const { data: analytics = EMPTY_ANALYTICS, isLoading } = useReportSummary(
		trackerId,
		range,
	);
	const { data: periodData = [] } = useSpending(trackerId, bucketPeriod, range);
	const { data: categoryBreakdown = [] } = useCategoryBreakdown(
		trackerId,
		range,
	);
	const { data: needsWantsSplit } = useReportNeedsWants(trackerId, range);
	const { data: yearComparison = [] } = useYearComparison(trackerId);

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

	const analyticsStats = [
		{ key: "total", label: "Total", value: analytics.total },
		{ key: "avg", label: "Average", value: analytics.avg },
		{ key: "low", label: "Lowest", value: analytics.min },
		{ key: "high", label: "Highest", value: analytics.max },
	];

	if (isLoading) {
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

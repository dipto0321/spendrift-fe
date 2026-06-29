import { useMemo, useState } from "react";
import type { DateRange as PickerDateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { MoneyText } from "@/shared/ui/MoneyText";
import { PageHeader } from "@/shared/ui/PageHeader";
import { formatCurrency } from "@/shared/utils/format";
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

function formatCalendarDate(date: Date) {
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function getRangeLabel(range: PickerDateRange | undefined) {
	if (!range?.from && !range?.to) return "All time";
	const fromLabel = range.from ? formatCalendarDate(range.from) : "Start";
	const toLabel = range.to ? formatCalendarDate(range.to) : "End";
	return `${fromLabel} – ${toLabel}`;
}

function toApiDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

const EMPTY_ANALYTICS = { total: 0, min: 0, max: 0, avg: 0, count: 0 };

const PERIOD_LABELS: { value: ReportPeriod; label: string }[] = [
	{ value: "weekly", label: "Weekly" },
	{ value: "monthly", label: "Monthly" },
	{ value: "yearly", label: "Yearly" },
];

const SKELETON_KEYS = ["total", "avg", "low", "high"] as const;

function ReportsPage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";
	const [period, setPeriod] = useState<ReportPeriod>("monthly");
	const [customRange, setCustomRange] = useState<PickerDateRange | undefined>();
	const [customRangeOpen, setCustomRangeOpen] = useState(false);
	const [customRangeSelectionStarted, setCustomRangeSelectionStarted] =
		useState(false);

	const range = useMemo<ReportRange>(
		() => ({
			startDate: customRange?.from ? toApiDate(customRange.from) : undefined,
			endDate: customRange?.to ? toApiDate(customRange.to) : undefined,
		}),
		[customRange?.from, customRange?.to],
	);

	const { data: analytics = EMPTY_ANALYTICS, isLoading } = useReportSummary(
		trackerId,
		range,
	);
	const { data: periodData = [] } = useSpending(trackerId, period, range);
	const { data: categoryBreakdown = [] } = useCategoryBreakdown(
		trackerId,
		range,
	);
	const { data: needsWantsSplit } = useReportNeedsWants(trackerId, range);
	const { data: yearComparison = [] } = useYearComparison(trackerId);

	const rangeLabel = getRangeLabel(customRange);
	const isCustomRangeActive = customRangeOpen || Boolean(customRange);

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
						<Badge variant="outline">{rangeLabel}</Badge>
						{customRange ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setCustomRange(undefined)}
							>
								Clear custom range
							</Button>
						) : null}
					</div>
					<ToggleGroup
						type="single"
						value={isCustomRangeActive ? "custom" : period}
						onValueChange={(value) => {
							if (!value) return;
							if (value === "custom") {
								setCustomRangeSelectionStarted(false);
								setCustomRangeOpen(true);
								return;
							}
							setPeriod(value as ReportPeriod);
						}}
						className="rounded-full border border-border/60 bg-muted/30 p-1"
					>
						{PERIOD_LABELS.map(({ value, label }) => (
							<ToggleGroupItem
								key={value}
								value={value}
								className="rounded-full px-3 py-1 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
							>
								{label}
							</ToggleGroupItem>
						))}
						<ToggleGroupItem
							value="custom"
							className="rounded-full px-3 py-1 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
						>
							Custom
						</ToggleGroupItem>
					</ToggleGroup>
				</div>

				<SpendingChart data={periodData} period={period} currency={currency} />
			</div>

			<Dialog open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
				<DialogContent className="sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>Select custom date range</DialogTitle>
						<DialogDescription>
							Pick a start and end date. Reports update once the range is
							complete.
						</DialogDescription>
					</DialogHeader>
					<div className="overflow-hidden rounded-xl border border-border/60 bg-background p-2">
						<Calendar
							mode="range"
							selected={customRange}
							onSelect={(range) => {
								setCustomRange(range);
								if (range?.from && !range?.to) {
									setCustomRangeSelectionStarted(true);
									return;
								}
								if (
									range?.from &&
									range?.to &&
									customRangeSelectionStarted
								) {
									setCustomRangeOpen(false);
									setCustomRangeSelectionStarted(false);
								}
							}}
							numberOfMonths={2}
							className="w-full"
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setCustomRange(undefined);
								setCustomRangeSelectionStarted(false);
								setCustomRangeOpen(false);
							}}
							disabled={!customRange?.from && !customRange?.to}
						>
							Clear range
						</Button>
						<Button type="button" onClick={() => setCustomRangeOpen(false)}>
							Done
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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
										<span className="text-foreground">
											{item.categoryName}
										</span>
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
		</main>
	);
}

export default ReportsPage;

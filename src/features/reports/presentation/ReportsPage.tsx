import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { DateRange as PickerDateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	categoryRepository,
	expenseRepository,
} from "@/features/expenses/data/repository";
import { calculateNeedsWantsSplit } from "@/features/expenses/domain/services";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard } from "@/shared/ui/StatCard";
import { formatCurrency } from "@/shared/utils/format";
import {
	computeAnalytics,
	computeCategoryBreakdown,
	groupByMonth,
	groupByWeek,
	groupByYear,
	multiYearComparison,
} from "../domain/services";
import type { PeriodData, ReportPeriod } from "../domain/types";
import { CategoryBreakdownChart } from "./CategoryBreakdownChart";
import { NeedsVsWantsPie } from "./NeedsVsWantsPie";
import { SpendingChart } from "./SpendingChart";
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

	return `${fromLabel} - ${toLabel}`;
}

function isExpenseWithinRange(
	expenseDate: string,
	range: PickerDateRange | undefined,
) {
	if (!range?.from && !range?.to) return true;

	const expenseTime = new Date(`${expenseDate}T12:00:00`).getTime();

	if (range.from) {
		const startTime = new Date(range.from).setHours(0, 0, 0, 0);
		if (expenseTime < startTime) return false;
	}

	if (range.to) {
		const endTime = new Date(range.to).setHours(23, 59, 59, 999);
		if (expenseTime > endTime) return false;
	}

	return true;
}

function ReportsPage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";
	const [period, setPeriod] = useState<ReportPeriod>("monthly");
	const [customRange, setCustomRange] = useState<PickerDateRange | undefined>();
	const [customRangeOpen, setCustomRangeOpen] = useState(false);
	const [customRangeSelectionStarted, setCustomRangeSelectionStarted] =
		useState(false);

	const { data: expenses = [], isLoading } = useQuery({
		queryKey: ["expenses", trackerId],
		queryFn: () => expenseRepository.getAll(trackerId as string),
		enabled: Boolean(trackerId),
	});

	const { data: categories = [] } = useQuery({
		queryKey: ["categories", trackerId],
		queryFn: () => categoryRepository.getAll(trackerId as string),
		enabled: Boolean(trackerId),
	});

	const filteredExpenses = expenses.filter((expense) =>
		isExpenseWithinRange(expense.date, customRange),
	);

	const analytics = computeAnalytics(filteredExpenses);

	let periodData: PeriodData[];
	switch (period) {
		case "weekly":
			periodData = groupByWeek(filteredExpenses);
			break;
		case "monthly":
			periodData = groupByMonth(filteredExpenses);
			break;
		case "yearly":
			periodData = groupByYear(filteredExpenses);
			break;
	}

	const yearComparison = multiYearComparison(filteredExpenses);
	const categoryBreakdown = computeCategoryBreakdown(
		filteredExpenses,
		categories,
	);
	const needsWantsSplit = calculateNeedsWantsSplit(filteredExpenses);
	const rangeLabel = getRangeLabel(customRange);
	const isCustomRangeActive = customRangeOpen || Boolean(customRange);

	const periodLabels: { value: ReportPeriod; label: string }[] = [
		{ value: "weekly", label: "Weekly" },
		{ value: "monthly", label: "Monthly" },
		{ value: "yearly", label: "Yearly" },
	];

	if (isLoading) {
		return (
			<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
				<PageHeader
					kicker="Reports"
					title="Reports & Analytics"
					description="Analyze spending patterns, category breakdowns, and year-over-year trends."
				/>
				<div className="animate-pulse space-y-4">
					<div className="h-64 rounded-2xl bg-muted/50" />
				</div>
			</main>
		);
	}

	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<PageHeader
				kicker="Reports"
				title="Reports & Analytics"
				description="Analyze spending patterns, category breakdowns, and year-over-year trends."
			/>

			<section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
				<StatCard
					label="Total"
					value={formatCurrency(analytics.total, currency)}
				/>
				<StatCard label="Min" value={formatCurrency(analytics.min, currency)} />
				<StatCard label="Max" value={formatCurrency(analytics.max, currency)} />
				<StatCard
					label="Average"
					value={formatCurrency(analytics.avg, currency)}
				/>
				<StatCard label="Count" value={String(analytics.count)} />
			</section>

			<section className="mb-6">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
						<div>
							<h2 className="m-0 text-base font-semibold text-foreground">
								Spending Over Time
							</h2>
							<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
								Switch the grouping or choose a custom calendar range.
							</p>
						</div>
						<div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-1">
							{periodLabels.map(({ value, label }) => (
								<button
									key={value}
									type="button"
									onClick={() => setPeriod(value)}
									className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
										!isCustomRangeActive && period === value
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{label}
								</button>
							))}
							<button
								type="button"
								onClick={() => {
									setCustomRangeSelectionStarted(false);
									setCustomRangeOpen(true);
								}}
								className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
									isCustomRangeActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								Custom range
							</button>
						</div>
					</div>
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
				</div>
				<div className="mt-4 rounded-2xl border border-border/60 bg-card/30 p-6">
					<SpendingChart
						data={periodData}
						period={period}
						currency={currency}
					/>
				</div>
			</section>

			<Dialog open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
				<DialogContent className="sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>Select custom date range</DialogTitle>
						<DialogDescription>
							Pick a start and end date. The reports update as soon as the range
							is complete.
						</DialogDescription>
					</DialogHeader>
					<div className="overflow-hidden rounded-2xl border border-border/60 bg-background p-2">
						<Calendar
							mode="range"
							selected={customRange}
							onSelect={(range) => {
								setCustomRange(range);
								if (range?.from && !range?.to) {
									setCustomRangeSelectionStarted(true);
									return;
								}

								if (range?.from && range?.to && customRangeSelectionStarted) {
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

			<section className="mb-6 grid gap-6 lg:grid-cols-2">
				<div className="rounded-2xl border border-border/60 bg-card/30 p-6">
					<h2 className="m-0 mb-4 text-base font-semibold text-foreground">
						Category Breakdown
					</h2>
					<CategoryBreakdownChart
						data={categoryBreakdown}
						currency={currency}
					/>
					<div className="mt-4 space-y-2">
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
				</div>

				<div className="rounded-2xl border border-border/60 bg-card/30 p-6">
					<h2 className="m-0 mb-4 text-base font-semibold text-foreground">
						Needs vs Wants
					</h2>
					<NeedsVsWantsPie
						needs={needsWantsSplit.needs}
						wants={needsWantsSplit.wants}
						needsPercentage={needsWantsSplit.percentage.needs}
						wantsPercentage={needsWantsSplit.percentage.wants}
						currency={currency}
					/>
					<div className="mt-4 grid grid-cols-2 gap-4">
						<div>
							<p className="m-0 text-xs text-muted-foreground">Needs</p>
							<p className="m-0 mt-1 text-lg font-semibold tabular-nums text-foreground">
								{formatCurrency(needsWantsSplit.needs, currency)}
							</p>
						</div>
						<div>
							<p className="m-0 text-xs text-muted-foreground">Wants</p>
							<p className="m-0 mt-1 text-lg font-semibold tabular-nums text-foreground">
								{formatCurrency(needsWantsSplit.wants, currency)}
							</p>
						</div>
					</div>
				</div>
			</section>

			{yearComparison.length > 0 && (
				<section className="mb-6">
					<div className="rounded-2xl border border-border/60 bg-card/30 p-6">
						<h2 className="m-0 mb-4 text-base font-semibold text-foreground">
							Year-over-Year Comparison
						</h2>
						<YearComparisonChart data={yearComparison} currency={currency} />
					</div>
				</section>
			)}
		</main>
	);
}

export default ReportsPage;

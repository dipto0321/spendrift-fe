import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
import type { ReportPeriod } from "../domain/types";
import { CategoryBreakdownChart } from "./CategoryBreakdownChart";
import { NeedsVsWantsPie } from "./NeedsVsWantsPie";
import { SpendingChart } from "./SpendingChart";
import { YearComparisonChart } from "./YearComparisonChart";

function ReportsPage() {
	const { activeTracker } = useTracker();
	const currency = activeTracker?.currency ?? "";
	const [period, setPeriod] = useState<ReportPeriod>("monthly");

	const { data: expenses = [], isLoading } = useQuery({
		queryKey: ["expenses"],
		queryFn: () => expenseRepository.getAll(),
	});

	const { data: categories = [] } = useQuery({
		queryKey: ["categories"],
		queryFn: () => categoryRepository.getAll(),
	});

	const analytics = computeAnalytics(expenses);

	const periodData =
		period === "weekly"
			? groupByWeek(expenses)
			: period === "monthly"
				? groupByMonth(expenses)
				: groupByYear(expenses);

	const yearComparison = multiYearComparison(expenses);
	const categoryBreakdown = computeCategoryBreakdown(expenses, categories);
	const needsWantsSplit = calculateNeedsWantsSplit(expenses);

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
				<div className="flex items-center justify-between gap-4">
					<h2 className="m-0 text-base font-semibold text-foreground">
						Spending Over Time
					</h2>
					<div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-1">
						{periodLabels.map(({ value, label }) => (
							<button
								key={value}
								type="button"
								onClick={() => setPeriod(value)}
								className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
									period === value
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{label}
							</button>
						))}
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

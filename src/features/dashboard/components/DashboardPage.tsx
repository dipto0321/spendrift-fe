import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { budgetRepository } from "@/features/budgets/data/repository";
import {
	calculateBudgetStatus,
	getCurrentMonth,
} from "@/features/budgets/domain/services";
import { SavingsHealthBadge } from "@/features/budgets/presentation/SavingsHealthBadge";
import {
	categoryRepository,
	expenseRepository,
} from "@/features/expenses/data/repository";
import { calculateNeedsWantsSplit } from "@/features/expenses/domain/services";
import type { Category } from "@/features/expenses/domain/types";
import { groupByMonth } from "@/features/reports/domain/services";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard } from "@/shared/ui/StatCard";
import { formatCurrency, formatDate } from "@/shared/utils/format";
import { getDashboardSummary } from "../api/mockDashboard";

const miniChartConfig = {
	total: {
		label: "Spending",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

export function DashboardPage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";
	const { data: summary, isLoading: summaryLoading } = useQuery({
		queryKey: ["dashboard-summary"],
		queryFn: getDashboardSummary,
	});

	const { data: expenses = [], isLoading: expensesLoading } = useQuery({
		queryKey: ["expenses", trackerId],
		queryFn: () => expenseRepository.getAll(trackerId as string),
		enabled: Boolean(trackerId),
	});

	const { data: categories = [] } = useQuery({
		queryKey: ["categories", trackerId],
		queryFn: () => categoryRepository.getAll(trackerId as string),
		enabled: Boolean(trackerId),
	});

	const { data: budgets = [] } = useQuery({
		queryKey: ["budgets", trackerId],
		queryFn: () => budgetRepository.getAll(trackerId as string),
		enabled: Boolean(trackerId),
	});

	const currentMonth = getCurrentMonth();
	const currentBudget = budgets.find((b) => b.month === currentMonth) ?? null;
	const currentMonthExpenses = expenses.filter((e) =>
		e.date.startsWith(currentMonth),
	);

	const budgetStatus = currentBudget
		? calculateBudgetStatus(
				currentBudget.monthlyLimit,
				currentBudget.savingsTarget,
				currentMonthExpenses,
			)
		: null;

	const needsWantsSplit = calculateNeedsWantsSplit(currentMonthExpenses);

	const monthlyData = groupByMonth(expenses)
		.slice(-6)
		.map((d) => ({
			label: new Date(`${d.label}-01`).toLocaleDateString(undefined, {
				month: "short",
			}),
			total: d.total,
		}));

	const categoryMap = new Map<string, Category>(
		categories.map((c) => [c.id, c]),
	);

	const recentExpenses = [...expenses]
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, 5);

	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<PageHeader
				kicker="Dashboard"
				title="Spendrift overview"
				description="Track what matters: cash position, monthly trends, and recent spending."
			/>

			<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<StatCard
					label="Total balance"
					value={
						summaryLoading || !summary
							? "—"
							: formatCurrency(summary.totalBalance, currency)
					}
				/>
				<StatCard
					label="This month spend"
					value={
						summaryLoading || !summary
							? "—"
							: formatCurrency(summary.monthSpend, currency)
					}
				/>
				<StatCard
					label="This month income"
					value={
						summaryLoading || !summary
							? "—"
							: formatCurrency(summary.monthIncome, currency)
					}
				/>
			</section>

			<section className="mt-6 grid gap-6 lg:grid-cols-2">
				<div>
					<section
						className="island-shell rounded-2xl p-6"
						aria-labelledby="cashflow-heading"
					>
						<h2 id="cashflow-heading" className="island-kicker mb-4">
							Cashflow
						</h2>
						{monthlyData.length > 0 ? (
							<ChartContainer
								config={miniChartConfig}
								className="h-[200px] w-full"
							>
								<BarChart
									data={monthlyData}
									margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
								>
									<CartesianGrid vertical={false} strokeDasharray="3 3" />
									<XAxis
										dataKey="label"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										className="text-xs"
									/>
									<Bar
										dataKey="total"
										fill="var(--color-total)"
										radius={[4, 4, 0, 0]}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent
												formatter={(value) =>
													formatCurrency(Number(value), currency)
												}
											/>
										}
									/>
								</BarChart>
							</ChartContainer>
						) : (
							<p className="m-0 text-sm text-muted-foreground">
								No spending data yet.
							</p>
						)}
					</section>
				</div>

				<section className="island-shell rounded-2xl p-6">
					<h2 className="island-kicker mb-4">Needs vs Wants</h2>
					<div className="space-y-3">
						<div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-foreground">Needs</span>
								<span className="font-semibold tabular-nums text-foreground">
									{formatCurrency(needsWantsSplit.needs, currency)}
								</span>
							</div>
							<div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
								<div
									className="h-full rounded-full bg-green-500 transition-all"
									style={{ width: `${needsWantsSplit.percentage.needs}%` }}
								/>
							</div>
						</div>
						<div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-foreground">Wants</span>
								<span className="font-semibold tabular-nums text-foreground">
									{formatCurrency(needsWantsSplit.wants, currency)}
								</span>
							</div>
							<div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
								<div
									className="h-full rounded-full bg-orange-500 transition-all"
									style={{ width: `${needsWantsSplit.percentage.wants}%` }}
								/>
							</div>
						</div>
					</div>
				</section>
			</section>

			<section className="mt-6 grid gap-6 lg:grid-cols-2">
				<div className="min-w-0">
					{currentBudget && budgetStatus ? (
						<section className="island-shell rounded-2xl p-6">
							<div className="flex items-center justify-between gap-4">
								<h2 className="island-kicker mb-0">Budget</h2>
								<SavingsHealthBadge health={budgetStatus.savingsHealth} />
							</div>
							<div className="mt-4 space-y-3">
								<div className="flex items-baseline justify-between">
									<span className="text-sm text-muted-foreground">
										Remaining
									</span>
									<span className="text-xl font-semibold tabular-nums text-foreground">
										{formatCurrency(budgetStatus.remaining, currency)}
									</span>
								</div>
								<div>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>Spent</span>
										<span>
											{currentBudget.monthlyLimit > 0
												? Math.round(
														(budgetStatus.spent / currentBudget.monthlyLimit) *
															100,
													)
												: 0}
											%
										</span>
									</div>
									<div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
										<div
											className={`h-full rounded-full transition-all ${
												budgetStatus.savingsHealth === "green"
													? "bg-green-500"
													: budgetStatus.savingsHealth === "yellow"
														? "bg-yellow-500"
														: "bg-red-500"
											}`}
											style={{
												width: `${currentBudget.monthlyLimit > 0 ? Math.min(100, Math.round((budgetStatus.spent / currentBudget.monthlyLimit) * 100)) : 0}%`,
											}}
										/>
									</div>
								</div>
								<div className="flex items-baseline justify-between text-sm">
									<span className="text-muted-foreground">Limit</span>
									<span className="font-medium tabular-nums text-foreground">
										{formatCurrency(currentBudget.monthlyLimit, currency)}
									</span>
								</div>
							</div>
						</section>
					) : (
						<section className="island-shell rounded-2xl p-6">
							<h2 className="island-kicker mb-4">Budget</h2>
							<p className="m-0 text-sm text-muted-foreground">
								No budget set for this month.
							</p>
						</section>
					)}
				</div>

				<section
					className="island-shell rounded-2xl p-6"
					aria-labelledby="recent-expenses-heading"
				>
					<h2 id="recent-expenses-heading" className="island-kicker mb-4">
						Recent expenses
					</h2>
					{expensesLoading ? (
						<p className="m-0 text-sm text-muted-foreground">Loading…</p>
					) : recentExpenses.length === 0 ? (
						<p className="m-0 text-sm text-muted-foreground">
							No expenses yet.
						</p>
					) : (
						<ul className="m-0 list-none space-y-3 p-0">
							{recentExpenses.map((expense) => {
								const cat = categoryMap.get(expense.categoryId);
								return (
									<li
										key={expense.id}
										className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3 last:border-none last:pb-0"
									>
										<div className="min-w-0">
											<p className="m-0 font-semibold text-foreground">
												{cat?.name ?? "Uncategorized"}
											</p>
											<p className="m-0 text-sm text-muted-foreground">
												{formatDate(expense.date)}
											</p>
										</div>
										<span className="shrink-0 font-medium tabular-nums text-foreground">
											{formatCurrency(expense.amount, currency)}
										</span>
									</li>
								);
							})}
						</ul>
					)}
				</section>
			</section>
		</main>
	);
}

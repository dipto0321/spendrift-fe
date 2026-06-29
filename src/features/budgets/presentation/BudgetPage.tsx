import { ShoppingBag, TrendingDown } from "lucide-react";
import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { EmptyState } from "@/shared/ui/EmptyState";
import { MoneyText } from "@/shared/ui/MoneyText";
import { useMonth } from "@/shared/ui/MonthContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard, StatCardSkeleton } from "@/shared/ui/StatCard";
import { formatCurrency } from "@/shared/utils/format";
import { calculateBudgetStatus, getCurrentMonth } from "../domain/services";
import type { BudgetCreateInput, BudgetStatus } from "../domain/types";
import { BudgetForm } from "./BudgetForm";
import { BudgetStatusCard } from "./BudgetStatusCard";
import { useCreateBudget, useUpdateBudget } from "./useBudgets";
import { useCurrentBudgetStatus } from "./useCurrentBudgetStatus";

const STAT_SKELETON_KEYS = ["spent", "needs", "wants"] as const;

function prevBudgetColorClass(status: BudgetStatus): string {
	if (status.isOverBudget) return "text-destructive";
	if (status.remaining > 0) return "text-success";
	return "text-warning-foreground dark:text-warning";
}

function BudgetPage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";

	const { selectedMonth } = useMonth();
	const isPastMonth = selectedMonth < getCurrentMonth();

	const {
		budgets,
		expenses,
		currentBudget,
		status,
		needsWantsSplit,
		budgetsLoading,
	} = useCurrentBudgetStatus(trackerId, selectedMonth);

	const createMutation = useCreateBudget(trackerId);
	const updateMutation = useUpdateBudget(trackerId);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function handleFormSubmit(data: BudgetCreateInput) {
		setIsSubmitting(true);
		if (currentBudget) {
			updateMutation.mutate(
				{ id: currentBudget.id, patch: data },
				{ onSettled: () => setIsSubmitting(false) },
			);
		} else {
			createMutation.mutate(data, { onSettled: () => setIsSubmitting(false) });
		}
	}

	const totalSpent = needsWantsSplit.needs + needsWantsSplit.wants;
	const otherBudgets = budgets.filter((b) => b.month !== selectedMonth);

	const selectedMonthLabel = new Date(`${selectedMonth}-01`).toLocaleDateString(
		"en",
		{ month: "long", year: "numeric" },
	);

	let budgetStatusContent = (
		<Skeleton className="h-full min-h-64 rounded-xl" />
	);
	if (!budgetsLoading && status && currentBudget) {
		budgetStatusContent = (
			<BudgetStatusCard
				budgetName={selectedMonthLabel}
				monthlyLimit={currentBudget.monthlyLimit}
				savingsTarget={currentBudget.savingsTarget}
				status={status}
				currency={currency}
			/>
		);
	} else if (!budgetsLoading) {
		budgetStatusContent = (
			<Card className="flex h-full min-h-48 items-center justify-center">
				<EmptyState
					icon={TrendingDown}
					title={`No budget for ${selectedMonthLabel}`}
					description={
						isPastMonth
							? "No budget was set for this month."
							: "Fill in the form to create a budget for this month."
					}
				/>
			</Card>
		);
	}

	return (
		<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
			<PageHeader
				title="Budget"
				description="Set monthly budgets, track savings targets, and monitor spending health."
			/>

			<div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
				<div className="lg:col-span-2">
					<Card className="h-full">
						<CardHeader>
							<CardTitle>Monthly setup</CardTitle>
							<CardDescription>
								{isPastMonth
									? `Viewing ${selectedMonthLabel} — read only.`
									: "Set your spending budget and savings goal for this tracker."}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{budgetsLoading ? (
								<div className="space-y-4">
									<Skeleton className="h-10 rounded-lg" />
									<Skeleton className="h-10 rounded-lg" />
									<Skeleton className="h-10 rounded-lg" />
								</div>
							) : (
								<BudgetForm
									initialData={currentBudget ?? undefined}
									month={selectedMonth}
									currency={currency}
									onSubmit={handleFormSubmit}
									isSubmitting={isSubmitting}
									readOnly={isPastMonth}
								/>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="lg:col-span-3">{budgetStatusContent}</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				{budgetsLoading ? (
					STAT_SKELETON_KEYS.map((k) => <StatCardSkeleton key={k} />)
				) : (
					<>
						<StatCard
							label="This month spent"
							value={<MoneyText amount={totalSpent} currency={currency} />}
							icon={TrendingDown}
							tone="destructive"
						/>
						<StatCard
							label="Needs"
							value={
								<MoneyText amount={needsWantsSplit.needs} currency={currency} />
							}
							icon={ShoppingBag}
							hint={`${needsWantsSplit.percentage.needs}% of spending`}
						/>
						<StatCard
							label="Wants"
							value={
								<MoneyText amount={needsWantsSplit.wants} currency={currency} />
							}
							icon={ShoppingBag}
							hint={`${needsWantsSplit.percentage.wants}% of spending`}
						/>
					</>
				)}
			</div>

			{otherBudgets.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Previous budgets</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{otherBudgets
							.sort((a, b) => b.month.localeCompare(a.month))
							.map((budget) => {
								const monthExpenses = expenses.filter((e) =>
									e.date.startsWith(budget.month),
								);
								const prevStatus = calculateBudgetStatus(
									budget.monthlyLimit,
									budget.savingsTarget,
									monthExpenses,
								);
								const label = prevStatus.isOverBudget
									? "Over"
									: `${formatCurrency(prevStatus.remaining, currency)} left`;
								const monthLabel = new Date(
									`${budget.month}-01`,
								).toLocaleDateString("en", {
									month: "short",
									year: "numeric",
								});
								return (
									<div
										key={budget.id}
										className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-4"
									>
										<div>
											<p className="m-0 text-sm font-medium text-foreground">
												{budget.name || monthLabel}
											</p>
											<p className="m-0 text-xs text-muted-foreground">
												Spent {formatCurrency(prevStatus.spent, currency)} of{" "}
												{formatCurrency(budget.monthlyLimit, currency)}
											</p>
										</div>
										<span
											className={`text-xs font-medium tabular-nums ${prevBudgetColorClass(prevStatus)}`}
										>
											{label}
										</span>
									</div>
								);
							})}
					</CardContent>
				</Card>
			) : null}
		</main>
	);
}

export default BudgetPage;

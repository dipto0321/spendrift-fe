import { useState } from "react";
import { Pencil, Plus, ShoppingBag, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard, StatCardSkeleton } from "@/shared/ui/StatCard";
import { formatCurrency } from "@/shared/utils/format";
import { calculateBudgetStatus } from "../domain/services";
import type { Budget, BudgetCreateInput, BudgetStatus } from "../domain/types";
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
	const [showForm, setShowForm] = useState(false);
	const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

	const {
		budgets,
		expenses,
		currentMonth,
		currentBudget,
		status,
		needsWantsSplit,
		budgetsLoading,
	} = useCurrentBudgetStatus(trackerId);

	const createMutation = useCreateBudget(trackerId);
	const updateMutation = useUpdateBudget(trackerId);

	function handleFormSubmit(data: BudgetCreateInput) {
		if (editingBudget) {
			updateMutation.mutate(
				{ id: editingBudget.id, patch: data },
				{
					onSuccess: () => {
						setShowForm(false);
						setEditingBudget(null);
					},
				},
			);
		} else {
			createMutation.mutate(data, { onSuccess: () => setShowForm(false) });
		}
	}

	function handleOpenForm() {
		if (currentBudget) setEditingBudget(currentBudget);
		setShowForm(true);
	}

	function handleCancel() {
		setShowForm(false);
		setEditingBudget(null);
	}

	const isFormSubmitting = createMutation.isPending || updateMutation.isPending;
	const isFormOpen = showForm || Boolean(editingBudget);
	const totalSpent = needsWantsSplit.needs + needsWantsSplit.wants;
	const hasPreviousBudgets = budgets.some((b) => b.month !== currentMonth);

	let budgetStatusContent: React.ReactNode = null;
	if (budgetsLoading) {
		budgetStatusContent = <Skeleton className="h-56 rounded-xl" />;
	} else if (status && currentBudget) {
		budgetStatusContent = (
			<BudgetStatusCard
				budgetName={currentBudget.name}
				monthlyLimit={currentBudget.monthlyLimit}
				savingsTarget={currentBudget.savingsTarget}
				status={status}
				currency={currency}
			/>
		);
	} else if (!isFormOpen) {
		budgetStatusContent = (
			<EmptyState
				icon={Plus}
				title="No budget for this month"
				description='Click "Create budget" above to set your monthly limit and savings goal.'
			/>
		);
	}

	return (
		<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
			<PageHeader
				title="Budget"
				description="Set monthly budgets, track savings targets, and monitor spending health."
				actions={
					<Button onClick={handleOpenForm} disabled={isFormOpen}>
						{currentBudget ? (
							<>
								<Pencil className="size-4" />
								Edit budget
							</>
						) : (
							<>
								<Plus className="size-4" />
								Create budget
							</>
						)}
					</Button>
				}
			/>

			{isFormOpen && (
				<Card>
					<CardHeader>
						<CardTitle>
							{editingBudget ? "Edit budget" : "Create budget"}
						</CardTitle>
						<CardDescription>
							Set your monthly spending limit and savings goal.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<BudgetForm
							initialData={editingBudget ?? undefined}
							onSubmit={handleFormSubmit}
							onCancel={handleCancel}
							isSubmitting={isFormSubmitting}
						/>
					</CardContent>
				</Card>
			)}

			{budgetStatusContent}

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

			{hasPreviousBudgets && (
				<Card>
					<CardHeader>
						<CardTitle>Previous budgets</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{budgets
							.filter((b) => b.month !== currentMonth)
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
								return (
									<div
										key={budget.id}
										className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-4"
									>
										<div>
											<p className="m-0 text-sm font-medium text-foreground">
												{budget.name}
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
			)}
		</main>
	);
}

export default BudgetPage;

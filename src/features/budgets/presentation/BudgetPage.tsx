import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard } from "@/shared/ui/StatCard";
import { formatCurrency } from "@/shared/utils/format";
import { calculateBudgetStatus } from "../domain/services";
import type { Budget, BudgetCreateInput } from "../domain/types";
import { BudgetForm } from "./BudgetForm";
import { BudgetStatusCard } from "./BudgetStatusCard";
import { useCreateBudget, useUpdateBudget } from "./useBudgets";
import { useCurrentBudgetStatus } from "./useCurrentBudgetStatus";

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

	// Opening the form for an existing current-month budget must edit it, not
	// create a second one (only one budget per tracker per month is allowed).
	function handleOpenForm() {
		if (currentBudget) setEditingBudget(currentBudget);
		setShowForm(true);
	}

	function handleCancel() {
		setShowForm(false);
		setEditingBudget(null);
	}

	const isFormSubmitting = createMutation.isPending || updateMutation.isPending;

	if (budgetsLoading) {
		return (
			<main className="page-wrap rise-in px-4 pb-14 pt-10 sm:pt-12">
				<PageHeader
					kicker="Budget"
					title="Budget workspace"
					description="Set monthly budgets, track savings targets, and monitor spending health."
				/>
				<Skeleton className="h-48 rounded-2xl" />
			</main>
		);
	}

	return (
		<main className="page-wrap rise-in px-4 pb-14 pt-10 sm:pt-12">
			<PageHeader
				kicker="Budget"
				title="Budget workspace"
				description="Set monthly budgets, track savings targets, and monitor spending health."
			/>

			<div className="space-y-6">
				{!showForm && !editingBudget && (
					<div className="flex justify-end">
						<Button type="button" onClick={handleOpenForm}>
							{currentBudget ? "Edit Budget" : "Create Budget"}
						</Button>
					</div>
				)}

				{(showForm || editingBudget) && (
					<div className="rounded-2xl border border-border/60 bg-card/30 p-6">
						<h3 className="m-0 mb-4 text-base font-semibold text-foreground">
							{editingBudget ? "Edit Budget" : "Create Budget"}
						</h3>
						<BudgetForm
							initialData={editingBudget ?? undefined}
							onSubmit={handleFormSubmit}
							onCancel={handleCancel}
							isSubmitting={isFormSubmitting}
						/>
					</div>
				)}

				{status && currentBudget ? (
					<BudgetStatusCard
						budgetName={currentBudget.name}
						monthlyLimit={currentBudget.monthlyLimit}
						savingsTarget={currentBudget.savingsTarget}
						status={status}
						currency={currency}
					/>
				) : (
					!showForm && (
						<div className="rounded-2xl border border-border/60 bg-card/30 p-12 text-center">
							<p className="m-0 text-sm text-muted-foreground">
								No budget set for this month.
							</p>
							<p className="m-0 mt-1 text-xs text-muted-foreground">
								Click "Create Budget" above to get started.
							</p>
						</div>
					)
				)}

				<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<StatCard
						label="This Month Spent"
						value={formatCurrency(
							needsWantsSplit.needs + needsWantsSplit.wants,
							currency,
						)}
					/>
					<StatCard
						label="Needs"
						value={formatCurrency(needsWantsSplit.needs, currency)}
						subtext={`${needsWantsSplit.percentage.needs}% of spending`}
					/>
					<StatCard
						label="Wants"
						value={formatCurrency(needsWantsSplit.wants, currency)}
						subtext={`${needsWantsSplit.percentage.wants}% of spending`}
					/>
				</section>

				{budgets.length > 0 && (
					<section>
						<h2 className="m-0 mb-3 text-base font-semibold text-foreground">
							Previous Budgets
						</h2>
						<div className="space-y-2">
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
									return (
										<div
											key={budget.id}
											className="flex items-center justify-between rounded-xl border border-border/60 bg-card/30 p-4"
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
											<div className="flex items-center gap-2">
												<span
													className={`text-xs font-medium ${prevStatus.isOverBudget ? "text-red-500" : prevStatus.remaining > 0 ? "text-green-500" : "text-yellow-500"}`}
												>
													{prevStatus.isOverBudget
														? "Over"
														: `${formatCurrency(prevStatus.remaining, currency)} left`}
												</span>
											</div>
										</div>
									);
								})}
						</div>
					</section>
				)}
			</div>
		</main>
	);
}

export default BudgetPage;

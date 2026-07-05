import { Progress } from "@/components/ui/progress";
import { getProgressBarColor } from "@/features/budgets/domain/services";
import { SavingsHealthBadge } from "@/features/budgets/presentation/SavingsHealthBadge";
import { useFormatCurrency } from "@/features/preferences/presentation/useFormatCurrency";
import type { DashboardBudget } from "../domain/types";

type BudgetCardProps = {
	budget: DashboardBudget | null;
	currency: string;
};

export function BudgetCard({ budget, currency }: BudgetCardProps) {
	const formatCurrency = useFormatCurrency();
	if (!budget) {
		return (
			<section className="island-shell min-w-0 rounded-2xl p-6">
				<h2 className="island-kicker mb-4">Budget</h2>
				<p className="m-0 text-sm text-muted-foreground">
					No budget set for this month.
				</p>
			</section>
		);
	}

	const spentPercentage =
		budget.monthlyLimit > 0
			? Math.min(
					100,
					Math.round((budget.status.spent / budget.monthlyLimit) * 100),
				)
			: 0;

	return (
		<section className="island-shell min-w-0 rounded-2xl p-6">
			<div className="flex items-center justify-between gap-4">
				<h2 className="island-kicker mb-0">Budget</h2>
				<SavingsHealthBadge health={budget.status.savingsHealth} />
			</div>
			<div className="mt-4 space-y-3">
				<div className="flex items-baseline justify-between">
					<span className="text-sm text-muted-foreground">Remaining</span>
					<span className="text-xl font-semibold tabular-nums text-foreground">
						{formatCurrency(budget.status.remaining, currency)}
					</span>
				</div>
				<div>
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Spent</span>
						<span>{spentPercentage}%</span>
					</div>
					<Progress
						value={spentPercentage}
						className="mt-1 h-2 bg-muted"
						indicatorClassName={getProgressBarColor(
							budget.status.savingsHealth,
						)}
					/>
				</div>
				<div className="flex items-baseline justify-between text-sm">
					<span className="text-muted-foreground">Limit</span>
					<span className="font-medium tabular-nums text-foreground">
						{formatCurrency(budget.monthlyLimit, currency)}
					</span>
				</div>
			</div>
		</section>
	);
}

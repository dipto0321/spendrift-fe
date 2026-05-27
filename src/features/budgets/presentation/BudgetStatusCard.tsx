import { formatCurrency } from "@/shared/utils/format";
import { getProgressBarColor } from "../domain/services";
import type { BudgetStatus } from "../domain/types";
import { SavingsHealthBadge } from "./SavingsHealthBadge";

type BudgetStatusCardProps = {
	budgetName: string;
	monthlyLimit: number;
	savingsTarget: number;
	status: BudgetStatus;
	currency: string;
};

export function BudgetStatusCard({
	budgetName,
	monthlyLimit,
	savingsTarget,
	status,
	currency,
}: BudgetStatusCardProps) {
	const spentPercentage =
		monthlyLimit > 0
			? Math.min(100, Math.round((status.spent / monthlyLimit) * 100))
			: 0;

	return (
		<div className="rounded-2xl border border-border/60 bg-card/30 p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="m-0 text-lg font-semibold text-foreground">
						{budgetName}
					</h2>
					<SavingsHealthBadge health={status.savingsHealth} />
				</div>
				<div className="text-right">
					<p className="m-0 text-2xl font-bold tabular-nums text-foreground">
						{formatCurrency(status.remaining, currency)}
					</p>
					<p className="m-0 text-xs text-muted-foreground">remaining</p>
				</div>
			</div>

			<div className="mt-4 space-y-3">
				<div>
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>Spent</span>
						<span>{spentPercentage}%</span>
					</div>
					<div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
						<div
							className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(status.savingsHealth)}`}
							style={{ width: `${spentPercentage}%` }}
						/>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-3 pt-2">
					<div>
						<p className="m-0 text-xs text-muted-foreground">Budget</p>
						<p className="m-0 mt-0.5 text-sm font-semibold tabular-nums text-foreground">
							{formatCurrency(monthlyLimit, currency)}
						</p>
					</div>
					<div>
						<p className="m-0 text-xs text-muted-foreground">Spent</p>
						<p className="m-0 mt-0.5 text-sm font-semibold tabular-nums text-foreground">
							{formatCurrency(status.spent, currency)}
						</p>
					</div>
					<div>
						<p className="m-0 text-xs text-muted-foreground">Target Savings</p>
						<p className="m-0 mt-0.5 text-sm font-semibold tabular-nums text-foreground">
							{formatCurrency(savingsTarget, currency)}
						</p>
					</div>
				</div>

				{savingsTarget > 0 && (
					<div>
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>Savings progress</span>
							<span>{status.savingsProgress}%</span>
						</div>
						<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-blue-500 transition-all duration-500"
								style={{ width: `${status.savingsProgress}%` }}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

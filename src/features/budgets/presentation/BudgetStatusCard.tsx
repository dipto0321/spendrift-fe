import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { MoneyText } from "@/shared/ui/MoneyText";
import { BudgetProgress } from "@/shared/ui/BudgetProgress";
import { SavingsHealthBadge } from "@/shared/ui/SavingsHealthBadge";
import { formatCurrency } from "@/shared/utils/format";
import type { BudgetStatus } from "../domain/types";

type BudgetStatusCardProps = {
	readonly budgetName: string;
	readonly monthlyLimit: number;
	readonly savingsTarget: number;
	readonly status: BudgetStatus;
	readonly currency: string;
};

export function BudgetStatusCard({
	budgetName,
	monthlyLimit,
	savingsTarget,
	status,
	currency,
}: BudgetStatusCardProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between gap-2">
					<div>
						<CardTitle>Remaining balance</CardTitle>
						<CardDescription>{budgetName}</CardDescription>
					</div>
					<SavingsHealthBadge health={status.savingsHealth} />
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				<MoneyText
					amount={status.remaining}
					currency={currency}
					colorize
					className="text-3xl font-semibold tracking-tight tabular-nums"
				/>

				<BudgetProgress
					label="Monthly spending"
					budget={monthlyLimit}
					actual={status.spent}
					currency={currency}
				/>

				<div className="grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">Budget</span>
						<span className="font-medium tabular-nums text-foreground">
							{formatCurrency(monthlyLimit, currency)}
						</span>
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">Spent</span>
						<span className="font-medium tabular-nums text-foreground">
							{formatCurrency(status.spent, currency)}
						</span>
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">Savings target</span>
						<span className="font-medium tabular-nums text-foreground">
							{formatCurrency(savingsTarget, currency)}
						</span>
					</div>
				</div>

				{savingsTarget > 0 && (
					<BudgetProgress
						label="Savings progress"
						budget={savingsTarget}
						actual={Math.max(status.remaining, 0)}
						currency={currency}
					/>
				)}
			</CardContent>
		</Card>
	);
}

import { PiggyBank, Target, TrendingDown, Wallet } from "lucide-react";
import type { SavingsHealth } from "@/features/budgets/domain/types";
import { MoneyText } from "@/shared/ui/MoneyText";
import { SavingsHealthBadge } from "@/shared/ui/SavingsHealthBadge";
import { StatCard, StatCardSkeleton } from "@/shared/ui/StatCard";
import type { StatCardProps } from "@/shared/ui/StatCard";
import { formatCurrency } from "@/shared/utils/format";
import type { DashboardSummary } from "../domain/types";

type DashboardStatsProps = {
	readonly summary: DashboardSummary | undefined;
	readonly currency: string;
	readonly isLoading: boolean;
};

const SKELETON_KEYS = ["spent", "remaining", "savings", "health"] as const;

function remainingTone(remaining: number | null): StatCardProps["tone"] {
	if (remaining === null) return "default";
	return remaining >= 0 ? "success" : "destructive";
}

function healthTone(health: SavingsHealth | null): StatCardProps["tone"] {
	if (health === "green") return "success";
	if (health === "yellow") return "warning";
	if (health === "red") return "destructive";
	return "default";
}

export function DashboardStats({
	summary,
	currency,
	isLoading,
}: DashboardStatsProps) {
	if (isLoading || !summary) {
		return (
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{SKELETON_KEYS.map((k) => (
					<StatCardSkeleton key={k} />
				))}
			</div>
		);
	}

	const budget = summary.budget;
	const remaining = budget ? budget.status.remaining : null;
	const savingsTarget = budget ? budget.savingsTarget : null;
	const health = budget ? budget.status.savingsHealth : null;

	const savedPct =
		savingsTarget && savingsTarget > 0 && remaining !== null
			? Math.min(100, Math.round((Math.max(remaining, 0) / savingsTarget) * 100))
			: null;

	const remainingValue =
		remaining === null ? (
			"—"
		) : (
			<MoneyText amount={remaining} currency={currency} colorize />
		);

	const savingsTargetValue =
		savingsTarget === null ? "—" : formatCurrency(savingsTarget, currency);

	const budgetHint = budget ? "budget remaining" : "no budget set";
	const savingsHint = savedPct === null ? "no budget set" : `${savedPct}% reached`;
	const healthHint = health ? <SavingsHealthBadge health={health} /> : "no budget set";

	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard
				label="Total spent"
				icon={TrendingDown}
				tone="destructive"
				value={<MoneyText amount={summary.totalSpent} currency={currency} />}
				hint="this month"
			/>
			<StatCard
				label="Remaining balance"
				icon={Wallet}
				tone={remainingTone(remaining)}
				value={remainingValue}
				hint={budgetHint}
			/>
			<StatCard
				label="Savings target"
				icon={Target}
				tone="default"
				value={savingsTargetValue}
				hint={savingsHint}
			/>
			<StatCard
				label="Savings health"
				icon={PiggyBank}
				tone={healthTone(health)}
				value={remainingValue}
				hint={healthHint}
			/>
		</div>
	);
}

import { StatCard } from "@/shared/ui/StatCard";
import { formatCurrency } from "@/shared/utils/format";
import type { DashboardSummary } from "../domain/types";

type DashboardStatsProps = {
	summary: DashboardSummary | undefined;
	currency: string;
	isLoading: boolean;
};

export function DashboardStats({
	summary,
	currency,
	isLoading,
}: DashboardStatsProps) {
	// "—" while the summary is loading or absent; the inner guards avoid reading
	// fields off an undefined summary during eager evaluation.
	const dash = (value: string) => (isLoading || !summary ? "—" : value);
	const budget = summary?.budget ?? null;

	return (
		<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			<StatCard
				label="This month spend"
				value={dash(
					summary ? formatCurrency(summary.totalSpent, currency) : "—",
				)}
			/>
			<StatCard
				label="Expenses this month"
				value={dash(summary ? String(summary.expenseCount) : "—")}
			/>
			<StatCard
				label="Budget remaining"
				value={dash(
					budget ? formatCurrency(budget.status.remaining, currency) : "—",
				)}
				subtext={budget ? undefined : "No budget set"}
			/>
		</section>
	);
}

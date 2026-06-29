import type { Category } from "@/features/expenses/domain/types";
import { useCategories } from "@/features/expenses/presentation/useCategories";
import { useExpenses } from "@/features/expenses/presentation/useExpenses";
import { groupByMonth } from "@/features/reports/domain/services";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { CashflowCard } from "./CashflowCard";
import { DashboardStats } from "./DashboardStats";
import { NeedsVsWantsCard } from "./NeedsVsWantsCard";
import { RecentExpenses } from "./RecentExpenses";
import { useDashboard } from "./useDashboard";

export function DashboardPage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";

	const { data: summary, isLoading: summaryLoading } = useDashboard(trackerId);
	const { data: categories = [] } = useCategories(trackerId);
	const { data: expenses = [], isLoading: expensesLoading } =
		useExpenses(trackerId);

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
		.slice(0, 6);

	return (
		<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
			<DashboardStats
				summary={summary}
				currency={currency}
				isLoading={summaryLoading}
			/>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<CashflowCard data={monthlyData} currency={currency} />
				</div>
				<NeedsVsWantsCard needsWants={summary?.needsWants} />
			</div>

			<RecentExpenses
				expenses={recentExpenses}
				categoryMap={categoryMap}
				currency={currency}
				isLoading={expensesLoading}
			/>
		</main>
	);
}

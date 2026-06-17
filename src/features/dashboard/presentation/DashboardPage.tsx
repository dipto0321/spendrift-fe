import type { Category } from "@/features/expenses/domain/types";
import { useCategories } from "@/features/expenses/presentation/useCategories";
import { useExpenses } from "@/features/expenses/presentation/useExpenses";
import { groupByMonth } from "@/features/reports/domain/services";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { BudgetCard } from "./BudgetCard";
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

	// The dashboard endpoint summarizes the current month only; the multi-month
	// cashflow trend and the recent-activity list come from the expenses list.
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
		<main className="page-wrap rise-in px-4 pb-14 pt-10 sm:pt-12">
			<PageHeader
				kicker="Dashboard"
				title="Spendrift overview"
				description="Track what matters: this month's spending, budget health, and recent activity."
			/>

			<DashboardStats
				summary={summary}
				currency={currency}
				isLoading={summaryLoading}
			/>

			<section className="mt-6 grid gap-6 lg:grid-cols-2">
				<CashflowCard data={monthlyData} currency={currency} />
				<NeedsVsWantsCard
					needsWants={summary?.needsWants}
					currency={currency}
				/>
			</section>

			<section className="mt-6 grid gap-6 lg:grid-cols-2">
				<BudgetCard budget={summary?.budget ?? null} currency={currency} />
				<RecentExpenses
					expenses={recentExpenses}
					categoryMap={categoryMap}
					currency={currency}
					isLoading={expensesLoading}
				/>
			</section>
		</main>
	);
}

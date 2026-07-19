import { BudgetAlertBanner } from "@/features/budgets/presentation/BudgetAlertBanner";
import { useBudgetAlerts } from "@/features/budgets/presentation/useBudgetAlerts";
import type { Category } from "@/features/expenses/domain/types";
import { useCategories } from "@/features/expenses/presentation/useCategories";
import { useExpenses } from "@/features/expenses/presentation/useExpenses";
import { groupByMonth } from "@/features/reports/domain/services";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { useMonth } from "@/shared/ui/MonthContext";
import { CashflowCard } from "./CashflowCard";
import { CatchUpBanner } from "./CatchUpBanner";
import { DashboardStats } from "./DashboardStats";
import { NeedsVsWantsCard } from "./NeedsVsWantsCard";
import { RecentExpenses } from "./RecentExpenses";
import { useDashboard } from "./useDashboard";
import { useLastEntryDate } from "./useLastEntryDate";

// Dashboard widgets need a multi-month expense slice (trend chart spans up to
// six months; recent expenses block shows the latest rows). The BE caps
// `limit` at 200, so we ask for that window.
const DASHBOARD_EXPENSE_LIMIT = 200;

function lastNMonthsRange(
	fromMonth: string,
	months: number,
): { start: string; end: string } {
	const year = Number(fromMonth.slice(0, 4));
	const monthIdx = Number(fromMonth.slice(5, 7)) - 1; // 0-based
	const start = new Date(year, monthIdx - (months - 1), 1);
	const end = new Date(year, monthIdx + 1, 0); // last day of the from-month
	const fmt = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	return { start: fmt(start), end: fmt(end) };
}

export function DashboardPage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";
	const { selectedMonth } = useMonth();

	const { data: summary, isLoading: summaryLoading } = useDashboard(
		trackerId,
		selectedMonth,
	);
	const { data: categories = [] } = useCategories(trackerId);
	const trendRange = lastNMonthsRange(selectedMonth, 6);
	const { data: expensesResult, isLoading: expensesLoading } = useExpenses(
		trackerId,
		{
			filter: { dateRange: trendRange },
			page: 1,
			pageSize: DASHBOARD_EXPENSE_LIMIT,
		},
	);
	const expenses = expensesResult?.items ?? [];
	const { data: budgetAlerts = [] } = useBudgetAlerts(trackerId, selectedMonth);
	const { data: lastEntryDate } = useLastEntryDate(trackerId);

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
			<CatchUpBanner lastEntryDate={lastEntryDate} />

			<BudgetAlertBanner alerts={budgetAlerts} currency={currency} />

			<DashboardStats
				summary={summary}
				currency={currency}
				isLoading={summaryLoading}
			/>

			<div className="grid items-stretch gap-6 lg:grid-cols-3">
				<div className="h-full lg:col-span-2">
					<CashflowCard data={monthlyData} currency={currency} />
				</div>
				<NeedsVsWantsCard
					needsWants={summary?.needsWants}
					currency={currency}
				/>
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

import {
	calculateNeedsWantsSplit,
	getMonthRange,
} from "@/features/expenses/domain/services";
import { useExpenses } from "@/features/expenses/presentation/useExpenses";
import { calculateBudgetStatus, getCurrentMonth } from "../domain/services";
import { useBudgetStatus, useBudgets } from "./useBudgets";

// Current-month budget status, composed from the budgets + expenses queries.
// Both BudgetPage and DashboardPage need the same derivation (current budget,
// its status, and the needs/wants split), so it lives here once.
//
// Status comes from the server (GET /budgets/{id}/status) as the source of
// truth — it sums every expense even when the client list is paginated. While
// that request is in flight we fall back to the identical client-side calc so
// the card never flashes empty.
//
// We scope the expenses query to the current month and request the BE's max
// page size (200) so a single fetch covers even heavy trackers; the BE
// `limit` cap is 200.
const DASHBOARD_EXPENSE_LIMIT = 200;

export function useCurrentBudgetStatus(
	trackerId: string | undefined,
	month?: string,
) {
	const { data: budgets = [], isLoading: budgetsLoading } =
		useBudgets(trackerId);

	const currentMonth = month ?? getCurrentMonth();
	const monthRange = getMonthRange(
		Number(currentMonth.slice(0, 4)),
		Number(currentMonth.slice(5, 7)),
	);
	const { data: expensesResult, isLoading: expensesLoading } = useExpenses(
		trackerId,
		{
			filter: { dateRange: monthRange },
			page: 1,
			pageSize: DASHBOARD_EXPENSE_LIMIT,
		},
	);
	const expenses = expensesResult?.items ?? [];
	const currentMonthExpenses = expenses; // already scoped server-side

	const currentBudget = budgets.find((b) => b.month === currentMonth) ?? null;

	const { data: serverStatus } = useBudgetStatus(trackerId, currentBudget?.id);

	const status = currentBudget
		? (serverStatus ??
			calculateBudgetStatus(
				currentBudget.monthlyLimit,
				currentBudget.savingsTarget,
				currentMonthExpenses,
			))
		: null;

	const needsWantsSplit = calculateNeedsWantsSplit(currentMonthExpenses);

	return {
		budgets,
		expenses,
		currentMonth,
		currentBudget,
		currentMonthExpenses,
		status,
		needsWantsSplit,
		budgetsLoading,
		expensesLoading,
	};
}

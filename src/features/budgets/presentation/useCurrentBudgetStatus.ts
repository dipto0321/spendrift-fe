import { calculateNeedsWantsSplit } from "@/features/expenses/domain/services";
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
export function useCurrentBudgetStatus(trackerId: string | undefined) {
	const { data: budgets = [], isLoading: budgetsLoading } =
		useBudgets(trackerId);
	const { data: expenses = [], isLoading: expensesLoading } =
		useExpenses(trackerId);

	const currentMonth = getCurrentMonth();
	const currentBudget = budgets.find((b) => b.month === currentMonth) ?? null;
	const currentMonthExpenses = expenses.filter((e) =>
		e.date.startsWith(currentMonth),
	);

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

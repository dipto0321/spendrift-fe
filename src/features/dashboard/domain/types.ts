import type { BudgetStatus } from "@/features/budgets/domain/types";
import type { NeedsWantsSplit } from "@/features/expenses/domain/types";

export type DashboardCategorySpend = {
	categoryId: string;
	name: string;
	color: string;
	total: number;
	percentage: number;
};

export type DashboardBudget = {
	budgetId: string;
	name: string;
	monthlyLimit: number;
	savingsTarget: number;
	status: BudgetStatus;
};

// Current-month summary for the active tracker, computed by the API.
export type DashboardSummary = {
	month: string;
	totalSpent: number;
	expenseCount: number;
	needsWants: NeedsWantsSplit;
	topCategories: DashboardCategorySpend[];
	budget: DashboardBudget | null;
};

import type { SavingsHealth } from "@/features/budgets/domain/types";
import type { DashboardBudget, DashboardSummary } from "../domain/types";

type NeedsWantsDto = {
	needs_total: string;
	wants_total: string;
	needs_percentage: number;
	wants_percentage: number;
};

type CategorySpendDto = {
	category_id: string;
	name: string;
	color: string;
	total: string;
	percentage: number;
};

type BudgetSnapshotDto = {
	budget_id: string;
	name: string;
	monthly_limit: string;
	savings_target: string;
	spent: string;
	remaining: string;
	savings_progress: number;
	savings_health: SavingsHealth;
	is_over_budget: boolean;
};

export type DashboardResponseDto = {
	month: string;
	total_spent: string;
	expense_count: number;
	needs_wants: NeedsWantsDto;
	top_categories: CategorySpendDto[];
	budget: BudgetSnapshotDto | null;
};

function mapBudgetSnapshot(dto: BudgetSnapshotDto): DashboardBudget {
	return {
		budgetId: dto.budget_id,
		name: dto.name,
		monthlyLimit: Number(dto.monthly_limit),
		savingsTarget: Number(dto.savings_target),
		status: {
			spent: Number(dto.spent),
			remaining: Number(dto.remaining),
			savingsProgress: dto.savings_progress,
			savingsHealth: dto.savings_health,
			isOverBudget: dto.is_over_budget,
		},
	};
}

export function mapDashboard(dto: DashboardResponseDto): DashboardSummary {
	return {
		month: dto.month,
		totalSpent: Number(dto.total_spent),
		expenseCount: dto.expense_count,
		needsWants: {
			needs: Number(dto.needs_wants.needs_total),
			wants: Number(dto.needs_wants.wants_total),
			percentage: {
				needs: dto.needs_wants.needs_percentage,
				wants: dto.needs_wants.wants_percentage,
			},
		},
		topCategories: dto.top_categories.map((c) => ({
			categoryId: c.category_id,
			name: c.name,
			color: c.color,
			total: Number(c.total),
			percentage: c.percentage,
		})),
		budget: dto.budget ? mapBudgetSnapshot(dto.budget) : null,
	};
}

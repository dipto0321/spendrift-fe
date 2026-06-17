import type {
	Budget,
	BudgetCreateInput,
	BudgetStatus,
	BudgetUpdateInput,
	SavingsHealth,
} from "../domain/types";

// API wire shapes (snake_case). Money is a Decimal string; converted to/from
// `number` at this boundary.

export type BudgetResponseDto = {
	id: string;
	tracker_id: string;
	name: string;
	monthly_limit: string;
	savings_target: string;
	month: string;
	created_at: string;
	updated_at: string;
};

export type BudgetStatusResponseDto = {
	spent: string;
	remaining: string;
	savings_progress: number;
	savings_health: SavingsHealth;
	is_over_budget: boolean;
};

export function mapBudget(dto: BudgetResponseDto): Budget {
	return {
		id: dto.id,
		trackerId: dto.tracker_id,
		name: dto.name,
		monthlyLimit: Number(dto.monthly_limit),
		savingsTarget: Number(dto.savings_target),
		month: dto.month,
		createdAt: dto.created_at,
	};
}

export function mapBudgetStatus(dto: BudgetStatusResponseDto): BudgetStatus {
	return {
		spent: Number(dto.spent),
		remaining: Number(dto.remaining),
		savingsProgress: dto.savings_progress,
		savingsHealth: dto.savings_health,
		isOverBudget: dto.is_over_budget,
	};
}

export function toBudgetBody(
	input: BudgetCreateInput | BudgetUpdateInput,
): Record<string, unknown> {
	const body: Record<string, unknown> = {};
	if (input.name !== undefined) body.name = input.name;
	if (input.monthlyLimit !== undefined) {
		body.monthly_limit = String(input.monthlyLimit);
	}
	if (input.savingsTarget !== undefined) {
		body.savings_target = String(input.savingsTarget);
	}
	if (input.month !== undefined) body.month = input.month;
	return body;
}

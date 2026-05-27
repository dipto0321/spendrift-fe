import type { Budget } from "../domain/types";

export function getSeedBudgets(): Budget[] {
	return [
		{
			id: "budget-may-2026",
			name: "May 2026 Budget",
			monthlyLimit: 2500,
			savingsTarget: 500,
			month: "2026-05",
			createdAt: "2026-05-01",
		},
	];
}

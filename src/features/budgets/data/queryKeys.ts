// Centralized React Query keys for the budgets feature.
export const budgetKeys = {
	all: (trackerId: string) => ["budgets", trackerId] as const,
	status: (trackerId: string, budgetId: string) =>
		["budgets", trackerId, "status", budgetId] as const,
};

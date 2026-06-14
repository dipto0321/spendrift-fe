// Centralized React Query keys for the budgets feature.
export const budgetKeys = {
	all: (trackerId: string) => ["budgets", trackerId] as const,
};

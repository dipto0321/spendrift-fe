// Centralized React Query keys for the expenses feature. Using factories keeps
// invalidation typo-proof and gives one place to evolve the keys when the real
// API arrives.
export const expenseKeys = {
	all: (trackerId: string) => ["expenses", trackerId] as const,
};

export const categoryKeys = {
	all: (trackerId: string) => ["categories", trackerId] as const,
};

import type { ExpenseFilter } from "../domain/types";

// Centralized React Query keys for the expenses feature. Using factories keeps
// invalidation typo-proof and gives one place to evolve the keys when the real
// API arrives.
export type ExpenseListKeyArgs = {
	filter?: ExpenseFilter;
	page?: number;
	pageSize?: number;
};

export const expenseKeys = {
	all: (trackerId: string) => ["expenses", trackerId] as const,
	// Detail-level key for the paginated list query; serialized through JSON so
	// filter objects (with optional fields) produce stable cache hits.
	list: (trackerId: string, args: ExpenseListKeyArgs) =>
		["expenses", trackerId, "list", JSON.stringify(args ?? {})] as const,
};

export const categoryKeys = {
	all: (trackerId: string) => ["categories", trackerId] as const,
};

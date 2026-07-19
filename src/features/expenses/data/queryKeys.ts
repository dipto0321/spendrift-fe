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
	// Prefix-compatible with `all`, so existing mutation invalidations
	// refresh the dashboard's recency query automatically.
	lastEntry: (trackerId: string) =>
		["expenses", trackerId, "last-entry"] as const,
};

export const categoryKeys = {
	all: (trackerId: string) => ["categories", trackerId] as const,
};

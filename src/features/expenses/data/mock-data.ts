import type { CategorySeed } from "../domain/types";

export const UNCATEGORIZED_ID = "uncategorized";

// Seeded into every new tracker (the repository stamps each with the tracker's
// id on first access). A tracker starts with these categories and no expenses.
export const DEFAULT_CATEGORIES: CategorySeed[] = [
	{
		id: UNCATEGORIZED_ID,
		name: "Uncategorized",
		color: "#78716C",
		createdAt: "2026-01-01",
	},
	{
		id: "groceries",
		name: "Groceries",
		color: "#22C55E",
		createdAt: "2026-01-01",
	},
	{
		id: "transport",
		name: "Transport",
		color: "#3B82F6",
		createdAt: "2026-01-01",
	},
	{ id: "dining", name: "Dining", color: "#F97316", createdAt: "2026-01-01" },
	{
		id: "subscriptions",
		name: "Subscriptions",
		color: "#8B5CF6",
		createdAt: "2026-01-01",
	},
	{
		id: "entertainment",
		name: "Entertainment",
		color: "#EC4899",
		createdAt: "2026-01-01",
	},
	{ id: "health", name: "Health", color: "#EF4444", createdAt: "2026-01-01" },
	{
		id: "shopping",
		name: "Shopping",
		color: "#EAB308",
		createdAt: "2026-01-01",
	},
	{
		id: "utilities",
		name: "Utilities",
		color: "#14B8A6",
		createdAt: "2026-01-01",
	},
	{ id: "coffee", name: "Coffee", color: "#A855F7", createdAt: "2026-01-01" },
];

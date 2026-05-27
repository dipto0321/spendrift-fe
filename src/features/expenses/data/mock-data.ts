import type { Category, Expense, ExpenseType } from "../domain/types";

export const DEFAULT_CATEGORIES: Category[] = [
	{
		id: "uncategorized",
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

export const UNCATEGORIZED_ID = "uncategorized";

type SeedExpense = {
	id: string;
	amount: number;
	categoryId: string;
	date: string;
	description?: string;
	type: ExpenseType;
};

const seedExpenses: SeedExpense[] = [
	{
		id: "1",
		amount: 47.32,
		categoryId: "groceries",
		date: "2026-05-18",
		description: "Weekly groceries from Fresh Mart",
		type: "need",
	},
	{
		id: "2",
		amount: 12.5,
		categoryId: "coffee",
		date: "2026-05-17",
		description: "Morning espresso at Blue Bottle",
		type: "want",
	},
	{
		id: "3",
		amount: 89.0,
		categoryId: "transport",
		date: "2026-05-15",
		description: "Monthly metro pass renewal",
		type: "need",
	},
	{
		id: "4",
		amount: 24.99,
		categoryId: "subscriptions",
		date: "2026-05-14",
		description: "Netflix monthly subscription",
		type: "want",
	},
	{
		id: "5",
		amount: 156.75,
		categoryId: "dining",
		date: "2026-05-12",
		description: "Team dinner at Osteria",
		type: "want",
	},
	{
		id: "6",
		amount: 32.0,
		categoryId: "health",
		date: "2026-05-10",
		description: "Pharmacy — vitamins and supplements",
		type: "need",
	},
	{
		id: "7",
		amount: 8.75,
		categoryId: "coffee",
		date: "2026-05-09",
		description: "Afternoon latte with oat milk",
		type: "want",
	},
	{
		id: "8",
		amount: 210.0,
		categoryId: "shopping",
		date: "2026-05-07",
		description: "New running shoes — Nike Air Zoom",
		type: "want",
	},
	{
		id: "9",
		amount: 65.4,
		categoryId: "groceries",
		date: "2026-05-05",
		description: "Bi-weekly grocery haul",
		type: "need",
	},
	{
		id: "10",
		amount: 14.99,
		categoryId: "subscriptions",
		date: "2026-05-03",
		description: "Spotify Premium",
		type: "want",
	},
	{
		id: "11",
		amount: 28.5,
		categoryId: "transport",
		date: "2026-05-02",
		description: "Uber rides — weekend trips",
		type: "need",
	},
	{
		id: "12",
		amount: 19.9,
		categoryId: "entertainment",
		date: "2026-04-30",
		description: "Movie tickets — Dune: Part Three",
		type: "want",
	},
	{
		id: "13",
		amount: 42.0,
		categoryId: "health",
		date: "2026-04-28",
		description: "Gym membership — monthly",
		type: "need",
	},
	{
		id: "14",
		amount: 6.5,
		categoryId: "coffee",
		date: "2026-04-26",
		description: "Morning pour-over",
		type: "want",
	},
	{
		id: "15",
		amount: 95.0,
		categoryId: "utilities",
		date: "2026-04-25",
		description: "Electricity bill — April",
		type: "need",
	},
	{
		id: "16",
		amount: 18.75,
		categoryId: "dining",
		date: "2026-04-23",
		description: "Quick lunch — poke bowl",
		type: "want",
	},
	{
		id: "17",
		amount: 55.0,
		categoryId: "transport",
		date: "2026-04-20",
		description: "Gas refill",
		type: "need",
	},
	{
		id: "18",
		amount: 33.0,
		categoryId: "shopping",
		date: "2026-04-18",
		description: "Household items — Target",
		type: "need",
	},
];

export function getSeedExpenses(): Expense[] {
	return seedExpenses.map((e) => ({ ...e }));
}

export function getSeedCategories(): Category[] {
	return DEFAULT_CATEGORIES.map((c) => ({ ...c }));
}

export type { SeedExpense };

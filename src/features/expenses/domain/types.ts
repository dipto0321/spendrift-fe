export const CATEGORY_COLORS = [
	"#EF4444",
	"#F97316",
	"#EAB308",
	"#22C55E",
	"#14B8A6",
	"#06B6D4",
	"#3B82F6",
	"#8B5CF6",
	"#A855F7",
	"#EC4899",
	"#6366F1",
	"#78716C",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export type ExpenseType = "need" | "want";

export type Expense = {
	id: string;
	amount: number;
	categoryId: string;
	date: string;
	description?: string;
	type: ExpenseType;
};

export type ExpenseCreateInput = Omit<Expense, "id">;

export type ExpenseUpdateInput = Partial<Omit<Expense, "id">>;

export type Category = {
	id: string;
	name: string;
	color: CategoryColor;
	createdAt: string;
};

export type DateRange = {
	start: string;
	end: string;
};

export type ExpenseFilter = {
	dateRange?: DateRange;
	categoryIds?: string[];
	types?: ExpenseType[];
	search?: string;
};

export type NeedsWantsSplit = {
	needs: number;
	wants: number;
	percentage: {
		needs: number;
		wants: number;
	};
};

export type GroupedExpenses<T extends Expense> = Map<string, T[]>;

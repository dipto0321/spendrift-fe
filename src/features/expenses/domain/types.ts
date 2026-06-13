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
	trackerId: string;
	amount: number;
	categoryId: string;
	date: string;
	description?: string;
	type: ExpenseType;
};

// trackerId is assigned by the repository from the active tracker, so callers
// only provide the expense fields themselves.
export type ExpenseCreateInput = Omit<Expense, "id" | "trackerId">;

export type ExpenseUpdateInput = Partial<Omit<Expense, "id" | "trackerId">>;

export type Category = {
	id: string;
	trackerId: string;
	name: string;
	color: CategoryColor;
	createdAt: string;
};

// Default categories are seeded per tracker, so the base list carries no
// trackerId until the repository stamps it on first access.
export type CategorySeed = Omit<Category, "trackerId">;

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

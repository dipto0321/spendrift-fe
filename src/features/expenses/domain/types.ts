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

// Either bound may be omitted to express an open-ended range ("from X onward"
// or "up to Y"). An absent bound means unbounded on that side — this replaces
// the old "9999-12-31"/"1970-01-01" sentinels.
export type DateRange = {
	start?: string;
	end?: string;
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

// AI smart paste: one parsed candidate row. categoryId is undefined when the
// model couldn't confidently map to an existing category — the review grid
// forces the user to pick one before saving.
export type ParsedExpense = {
	amount: number;
	description: string;
	categoryId?: string;
	type: ExpenseType;
	date: string;
};

// Categories are no longer sent: the backend loads them from the tracker
// (single source of truth), so new/renamed categories are always fresh.
export type ParseExpensesInput = {
	text: string;
	defaultDate: string;
};

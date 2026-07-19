import type {
	Category,
	CategoryColor,
	Expense,
	ExpenseCreateInput,
	ExpenseFilter,
	ExpenseUpdateInput,
	ParsedExpense,
	ParseExpensesInput,
} from "./types";

export type ExpenseListParams = {
	filter?: ExpenseFilter;
	page?: number;
	pageSize?: number;
};

export type ExpenseListResult = {
	items: Expense[];
	total: number;
};

export interface ExpenseRepository {
	getAll(
		trackerId: string,
		params?: ExpenseListParams,
	): Promise<ExpenseListResult>;
	getById(trackerId: string, id: string): Promise<Expense | null>;
	create(trackerId: string, input: ExpenseCreateInput): Promise<Expense>;
	/** ISO date of the newest expense in the tracker, or null when empty. */
	getLastEntryDate(trackerId: string): Promise<string | null>;
	update(
		trackerId: string,
		id: string,
		patch: ExpenseUpdateInput,
	): Promise<Expense | null>;
	delete(trackerId: string, id: string): Promise<boolean>;
}

export interface CategoryRepository {
	getAll(trackerId: string): Promise<Category[]>;
	getById(trackerId: string, id: string): Promise<Category | null>;
	create(
		trackerId: string,
		name: string,
		color: CategoryColor,
	): Promise<Category>;
	update(
		trackerId: string,
		id: string,
		patch: { name?: string; color?: CategoryColor },
	): Promise<Category | null>;
	delete(trackerId: string, id: string): Promise<void>;
}

// AI smart paste. Not tracker-scoped: the endpoint receives the category list
// explicitly and returns candidate rows only — persistence still goes through
// ExpenseRepository.create after user review (never directly from the AI).
export interface ExpenseParseRepository {
	parseText(
		trackerId: string,
		input: ParseExpensesInput,
	): Promise<ParsedExpense[]>;
}

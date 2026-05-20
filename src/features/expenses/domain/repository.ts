import type {
	Category,
	CategoryColor,
	Expense,
	ExpenseCreateInput,
	ExpenseFilter,
	ExpenseUpdateInput,
} from "./types";

export interface ExpenseRepository {
	getAll(filter?: ExpenseFilter): Promise<Expense[]>;
	getById(id: string): Promise<Expense | null>;
	create(input: ExpenseCreateInput): Promise<Expense>;
	update(id: string, patch: ExpenseUpdateInput): Promise<Expense | null>;
	delete(id: string): Promise<boolean>;
}

export interface CategoryRepository {
	getAll(): Promise<Category[]>;
	getById(id: string): Promise<Category | null>;
	create(name: string, color: CategoryColor): Promise<Category>;
	update(
		id: string,
		patch: { name?: string; color?: CategoryColor },
	): Promise<Category | null>;
	delete(id: string, fallbackCategoryId: string): Promise<void>;
}
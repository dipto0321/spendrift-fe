import type { Budget, BudgetCreateInput, BudgetUpdateInput } from "./types";

export interface BudgetRepository {
	getAll(): Promise<Budget[]>;
	getByMonth(month: string): Promise<Budget | null>;
	getById(id: string): Promise<Budget | null>;
	create(input: BudgetCreateInput): Promise<Budget>;
	update(id: string, patch: BudgetUpdateInput): Promise<Budget | null>;
	delete(id: string): Promise<boolean>;
}

import type { Budget, BudgetCreateInput, BudgetUpdateInput } from "./types";

export interface BudgetRepository {
	getAll(trackerId: string): Promise<Budget[]>;
	getByMonth(trackerId: string, month: string): Promise<Budget | null>;
	getById(trackerId: string, id: string): Promise<Budget | null>;
	create(trackerId: string, input: BudgetCreateInput): Promise<Budget>;
	update(
		trackerId: string,
		id: string,
		patch: BudgetUpdateInput,
	): Promise<Budget | null>;
	delete(trackerId: string, id: string): Promise<boolean>;
}

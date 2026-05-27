import type { BudgetRepository } from "../domain/repository";
import type {
	Budget,
	BudgetCreateInput,
	BudgetUpdateInput,
} from "../domain/types";
import { getSeedBudgets } from "./mock-data";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let budgets: Budget[] = getSeedBudgets();

export const budgetRepository: BudgetRepository = {
	async getAll(): Promise<Budget[]> {
		await delay(200);
		return budgets.map((b) => ({ ...b }));
	},

	async getByMonth(month: string): Promise<Budget | null> {
		await delay(150);
		const found = budgets.find((b) => b.month === month);
		return found ? { ...found } : null;
	},

	async getById(id: string): Promise<Budget | null> {
		await delay(100);
		const found = budgets.find((b) => b.id === id);
		return found ? { ...found } : null;
	},

	async create(input: BudgetCreateInput): Promise<Budget> {
		await delay(250);
		const budget: Budget = {
			...input,
			id: crypto.randomUUID(),
			createdAt: new Date().toISOString().split("T")[0],
		};
		budgets = [...budgets, budget];
		return { ...budget };
	},

	async update(id: string, patch: BudgetUpdateInput): Promise<Budget | null> {
		await delay(250);
		const idx = budgets.findIndex((b) => b.id === id);
		if (idx === -1) return null;
		const updated: Budget = { ...budgets[idx], ...patch };
		budgets = budgets.map((b) => (b.id === id ? updated : b));
		return { ...updated };
	},

	async delete(id: string): Promise<boolean> {
		await delay(200);
		const before = budgets.length;
		budgets = budgets.filter((b) => b.id !== id);
		return budgets.length < before;
	},
};

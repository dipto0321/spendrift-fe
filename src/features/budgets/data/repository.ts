import type { BudgetRepository } from "../domain/repository";
import type {
	Budget,
	BudgetCreateInput,
	BudgetUpdateInput,
} from "../domain/types";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Budgets are scoped per tracker; a tracker starts with none.
const budgetsByTracker = new Map<string, Budget[]>();

function getBudgets(trackerId: string): Budget[] {
	let list = budgetsByTracker.get(trackerId);
	if (!list) {
		list = [];
		budgetsByTracker.set(trackerId, list);
	}
	return list;
}

export function resetBudgetsMockData() {
	budgetsByTracker.clear();
}

export const budgetRepository: BudgetRepository = {
	async getAll(trackerId: string): Promise<Budget[]> {
		await delay(200);
		return getBudgets(trackerId).map((b) => ({ ...b }));
	},

	async getByMonth(trackerId: string, month: string): Promise<Budget | null> {
		await delay(150);
		const found = getBudgets(trackerId).find((b) => b.month === month);
		return found ? { ...found } : null;
	},

	async getById(trackerId: string, id: string): Promise<Budget | null> {
		await delay(100);
		const found = getBudgets(trackerId).find((b) => b.id === id);
		return found ? { ...found } : null;
	},

	async create(trackerId: string, input: BudgetCreateInput): Promise<Budget> {
		await delay(250);
		const budget: Budget = {
			...input,
			id: crypto.randomUUID(),
			trackerId,
			createdAt: new Date().toISOString().split("T")[0],
		};
		budgetsByTracker.set(trackerId, [...getBudgets(trackerId), budget]);
		return { ...budget };
	},

	async update(
		trackerId: string,
		id: string,
		patch: BudgetUpdateInput,
	): Promise<Budget | null> {
		await delay(250);
		const budgets = getBudgets(trackerId);
		const idx = budgets.findIndex((b) => b.id === id);
		if (idx === -1) return null;
		const updated: Budget = { ...budgets[idx], ...patch };
		budgetsByTracker.set(
			trackerId,
			budgets.map((b) => (b.id === id ? updated : b)),
		);
		return { ...updated };
	},

	async delete(trackerId: string, id: string): Promise<boolean> {
		await delay(200);
		const budgets = getBudgets(trackerId);
		const next = budgets.filter((b) => b.id !== id);
		budgetsByTracker.set(trackerId, next);
		return next.length < budgets.length;
	},
};

import type {
	CategoryRepository,
	ExpenseRepository,
} from "../domain/repository";
import { filterExpenses, sortExpensesByDate } from "../domain/services";
import type {
	Category,
	CategoryColor,
	Expense,
	ExpenseCreateInput,
	ExpenseFilter,
	ExpenseUpdateInput,
} from "../domain/types";
import { DEFAULT_CATEGORIES, UNCATEGORIZED_ID } from "./mock-data";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Each tracker owns an independent slice of data. Slices are created lazily:
// the first time a tracker is read it starts with the default categories and
// no expenses, so trackers never share rows.
const expensesByTracker = new Map<string, Expense[]>();
const categoriesByTracker = new Map<string, Category[]>();

function getExpenses(trackerId: string): Expense[] {
	let list = expensesByTracker.get(trackerId);
	if (!list) {
		list = [];
		expensesByTracker.set(trackerId, list);
	}
	return list;
}

function getCategories(trackerId: string): Category[] {
	let list = categoriesByTracker.get(trackerId);
	if (!list) {
		list = DEFAULT_CATEGORIES.map((c) => ({ ...c, trackerId }));
		categoriesByTracker.set(trackerId, list);
	}
	return list;
}

export function resetExpensesMockData() {
	expensesByTracker.clear();
	categoriesByTracker.clear();
}

export const expenseRepository: ExpenseRepository = {
	async getAll(trackerId: string, filter?: ExpenseFilter): Promise<Expense[]> {
		await delay(200);
		let result = getExpenses(trackerId).map((e) => ({ ...e }));
		if (filter) {
			result = filterExpenses(result, filter);
		}
		return sortExpensesByDate(result, "desc");
	},

	async getById(trackerId: string, id: string): Promise<Expense | null> {
		await delay(150);
		const found = getExpenses(trackerId).find((e) => e.id === id);
		return found ? { ...found } : null;
	},

	async create(trackerId: string, input: ExpenseCreateInput): Promise<Expense> {
		await delay(250);
		const expense: Expense = {
			...input,
			id: crypto.randomUUID(),
			trackerId,
		};
		expensesByTracker.set(trackerId, [...getExpenses(trackerId), expense]);
		return { ...expense };
	},

	async update(
		trackerId: string,
		id: string,
		patch: ExpenseUpdateInput,
	): Promise<Expense | null> {
		await delay(250);
		const expenses = getExpenses(trackerId);
		const idx = expenses.findIndex((e) => e.id === id);
		if (idx === -1) return null;
		const updated: Expense = { ...expenses[idx], ...patch };
		expensesByTracker.set(
			trackerId,
			expenses.map((e) => (e.id === id ? updated : e)),
		);
		return { ...updated };
	},

	async delete(trackerId: string, id: string): Promise<boolean> {
		await delay(200);
		const expenses = getExpenses(trackerId);
		const next = expenses.filter((e) => e.id !== id);
		expensesByTracker.set(trackerId, next);
		return next.length < expenses.length;
	},
};

export const categoryRepository: CategoryRepository = {
	async getAll(trackerId: string): Promise<Category[]> {
		await delay(150);
		return getCategories(trackerId).map((c) => ({ ...c }));
	},

	async getById(trackerId: string, id: string): Promise<Category | null> {
		await delay(100);
		const found = getCategories(trackerId).find((c) => c.id === id);
		return found ? { ...found } : null;
	},

	async create(
		trackerId: string,
		name: string,
		color: CategoryColor,
	): Promise<Category> {
		await delay(250);
		const category: Category = {
			id: crypto.randomUUID(),
			trackerId,
			name,
			color,
			createdAt: new Date().toISOString().split("T")[0],
		};
		categoriesByTracker.set(trackerId, [...getCategories(trackerId), category]);
		return { ...category };
	},

	async update(
		trackerId: string,
		id: string,
		patch: { name?: string; color?: CategoryColor },
	): Promise<Category | null> {
		await delay(250);
		if (id === UNCATEGORIZED_ID) return null;
		const categories = getCategories(trackerId);
		const idx = categories.findIndex((c) => c.id === id);
		if (idx === -1) return null;
		const updated: Category = { ...categories[idx], ...patch };
		categoriesByTracker.set(
			trackerId,
			categories.map((c) => (c.id === id ? updated : c)),
		);
		return { ...updated };
	},

	async delete(
		trackerId: string,
		id: string,
		fallbackCategoryId: string,
	): Promise<void> {
		await delay(250);
		if (id === UNCATEGORIZED_ID) return;
		expensesByTracker.set(
			trackerId,
			getExpenses(trackerId).map((e) =>
				e.categoryId === id ? { ...e, categoryId: fallbackCategoryId } : e,
			),
		);
		categoriesByTracker.set(
			trackerId,
			getCategories(trackerId).filter((c) => c.id !== id),
		);
	},
};

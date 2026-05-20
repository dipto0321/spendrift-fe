import type {
	Category,
	CategoryColor,
	Expense,
	ExpenseCreateInput,
	ExpenseFilter,
	ExpenseRepository,
	CategoryRepository,
	ExpenseUpdateInput,
} from "../domain/types";
import { filterExpenses, sortExpensesByDate } from "../domain/services";
import {
	getSeedExpenses,
	getSeedCategories,
	UNCATEGORIZED_ID,
} from "./mock-data";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let expenses: Expense[] = getSeedExpenses();
let categories: Category[] = getSeedCategories();

export const expenseRepository: ExpenseRepository = {
	async getAll(filter?: ExpenseFilter): Promise<Expense[]> {
		await delay(200);
		let result = expenses.map((e) => ({ ...e }));
		if (filter) {
			result = filterExpenses(result, filter);
		}
		return sortExpensesByDate(result, "desc");
	},

	async getById(id: string): Promise<Expense | null> {
		await delay(150);
		const found = expenses.find((e) => e.id === id);
		return found ? { ...found } : null;
	},

	async create(input: ExpenseCreateInput): Promise<Expense> {
		await delay(250);
		const expense: Expense = {
			...input,
			id: crypto.randomUUID(),
		};
		expenses = [...expenses, expense];
		return { ...expense };
	},

	async update(id: string, patch: ExpenseUpdateInput): Promise<Expense | null> {
		await delay(250);
		const idx = expenses.findIndex((e) => e.id === id);
		if (idx === -1) return null;
		const updated: Expense = { ...expenses[idx], ...patch };
		expenses = expenses.map((e) => (e.id === id ? updated : e));
		return { ...updated };
	},

	async delete(id: string): Promise<boolean> {
		await delay(200);
		const before = expenses.length;
		expenses = expenses.filter((e) => e.id !== id);
		return expenses.length < before;
	},
};

export const categoryRepository: CategoryRepository = {
	async getAll(): Promise<Category[]> {
		await delay(150);
		return categories.map((c) => ({ ...c }));
	},

	async getById(id: string): Promise<Category | null> {
		await delay(100);
		const found = categories.find((c) => c.id === id);
		return found ? { ...found } : null;
	},

	async create(name: string, color: CategoryColor): Promise<Category> {
		await delay(250);
		const category: Category = {
			id: crypto.randomUUID(),
			name,
			color,
			createdAt: new Date().toISOString().split("T")[0],
		};
		categories = [...categories, category];
		return { ...category };
	},

	async update(
		id: string,
		patch: { name?: string; color?: CategoryColor },
	): Promise<Category | null> {
		await delay(250);
		if (id === UNCATEGORIZED_ID) return null;
		const idx = categories.findIndex((c) => c.id === id);
		if (idx === -1) return null;
		const updated: Category = { ...categories[idx], ...patch };
		categories = categories.map((c) => (c.id === id ? updated : c));
		return { ...updated };
	},

	async delete(id: string, fallbackCategoryId: string): Promise<void> {
		await delay(250);
		if (id === UNCATEGORIZED_ID) return;
		expenses = expenses.map((e) =>
			e.categoryId === id ? { ...e, categoryId: fallbackCategoryId } : e,
		);
		categories = categories.filter((c) => c.id !== id);
	},
};
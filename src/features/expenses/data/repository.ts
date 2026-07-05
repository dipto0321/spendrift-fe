import { apiFetch } from "@/shared/api/client";
import type {
	CategoryRepository,
	ExpenseRepository,
} from "../domain/repository";
import {
	type CategoryResponseDto,
	type ExpenseResponseDto,
	mapCategory,
	mapExpense,
	toExpenseBody,
	toExpenseQuery,
	UNCATEGORIZED_NAME,
} from "./dto";

function categoriesPath(trackerId: string) {
	return `/trackers/${trackerId}/categories`;
}

function expensesPath(trackerId: string) {
	return `/trackers/${trackerId}/expenses`;
}

export const expenseRepository: ExpenseRepository = {
	async getAll(trackerId, filter) {
		const dtos = await apiFetch<ExpenseResponseDto[]>(
			`${expensesPath(trackerId)}${toExpenseQuery(filter)}`,
		);
		return dtos.map(mapExpense);
	},

	async getById(trackerId, id) {
		const dto = await apiFetch<ExpenseResponseDto>(
			`${expensesPath(trackerId)}/${id}`,
		);
		return mapExpense(dto);
	},

	async create(trackerId, input) {
		const dto = await apiFetch<ExpenseResponseDto>(expensesPath(trackerId), {
			method: "POST",
			body: toExpenseBody(input),
		});
		return mapExpense(dto);
	},

	async update(trackerId, id, patch) {
		const dto = await apiFetch<ExpenseResponseDto>(
			`${expensesPath(trackerId)}/${id}`,
			{ method: "PATCH", body: toExpenseBody(patch) },
		);
		return mapExpense(dto);
	},

	async delete(trackerId, id) {
		await apiFetch<void>(`${expensesPath(trackerId)}/${id}`, {
			method: "DELETE",
		});
		return true;
	},
};

export const categoryRepository: CategoryRepository = {
	async getAll(trackerId) {
		const dtos = await apiFetch<CategoryResponseDto[]>(
			categoriesPath(trackerId),
		);
		return dtos.map(mapCategory);
	},

	async getById(trackerId, id) {
		const dto = await apiFetch<CategoryResponseDto>(
			`${categoriesPath(trackerId)}/${id}`,
		);
		return mapCategory(dto);
	},

	async create(trackerId, name, color) {
		const dto = await apiFetch<CategoryResponseDto>(categoriesPath(trackerId), {
			method: "POST",
			body: { name, color },
		});
		return mapCategory(dto);
	},

	async update(trackerId, id, patch) {
		const dto = await apiFetch<CategoryResponseDto>(
			`${categoriesPath(trackerId)}/${id}`,
			{ method: "PATCH", body: patch },
		);
		return mapCategory(dto);
	},

	async delete(trackerId, id) {
		// The API refuses to delete a category that still has expenses, so move
		// them to "Uncategorized" first.
		const categories = await apiFetch<CategoryResponseDto[]>(
			categoriesPath(trackerId),
		);
		const uncategorized = categories.find((c) => c.name === UNCATEGORIZED_NAME);
		if (uncategorized && uncategorized.id !== id) {
			const expenses = await apiFetch<ExpenseResponseDto[]>(
				`${expensesPath(trackerId)}?category_ids=${id}&limit=200`,
			);
			await Promise.all(
				expenses.map((expense) =>
					apiFetch<ExpenseResponseDto>(
						`${expensesPath(trackerId)}/${expense.id}`,
						{ method: "PATCH", body: { category_id: uncategorized.id } },
					),
				),
			);
		}
		await apiFetch<void>(`${categoriesPath(trackerId)}/${id}`, {
			method: "DELETE",
		});
	},
};

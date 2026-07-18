import { apiFetch, apiFetchWithMeta } from "@/shared/api/client";
import type {
	CategoryRepository,
	ExpenseListParams,
	ExpenseListResult,
	ExpenseParseRepository,
	ExpenseRepository,
} from "../domain/repository";
import {
	type CategoryResponseDto,
	type ExpenseResponseDto,
	mapCategory,
	mapExpense,
	mapParsedExpense,
	type ParseExpensesResponseDto,
	toExpenseBody,
	toExpenseQuery,
	toParseExpensesBody,
	UNCATEGORIZED_NAME,
} from "./dto";

function categoriesPath(trackerId: string) {
	return `/trackers/${trackerId}/categories`;
}

function expensesPath(trackerId: string) {
	return `/trackers/${trackerId}/expenses`;
}

// The BE caps `limit` at 200; bulk operations (e.g. category reassignment) ask
// for the maximum so a single round-trip covers most trackers.
const MAX_EXPENSE_LIMIT = 200;

export const expenseRepository: ExpenseRepository = {
	async getAll(
		trackerId,
		params: ExpenseListParams = {},
	): Promise<ExpenseListResult> {
		const { filter, page = 1, pageSize = 100 } = params;
		const { data, headers } = await apiFetchWithMeta<ExpenseResponseDto[]>(
			`${expensesPath(trackerId)}${toExpenseQuery(filter, page, pageSize)}`,
		);
		const totalHeader = headers.get("x-total-count");
		const total = totalHeader ? Number.parseInt(totalHeader, 10) : data.length;
		return {
			items: data.map(mapExpense),
			total: Number.isFinite(total) ? total : data.length,
		};
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
		// them to "Uncategorized" first. Fetch up to the BE's max page size.
		const categories = await apiFetch<CategoryResponseDto[]>(
			categoriesPath(trackerId),
		);
		const uncategorized = categories.find((c) => c.name === UNCATEGORIZED_NAME);
		if (uncategorized && uncategorized.id !== id) {
			const expenses = await apiFetch<ExpenseResponseDto[]>(
				`${expensesPath(trackerId)}?category_ids=${id}&limit=${MAX_EXPENSE_LIMIT}`,
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

export const expenseParseRepository: ExpenseParseRepository = {
	async parseText(input) {
		const dto = await apiFetch<ParseExpensesResponseDto>("/ai/parse-expenses", {
			method: "POST",
			body: toParseExpensesBody(input),
		});
		return dto.expenses.map(mapParsedExpense);
	},
};

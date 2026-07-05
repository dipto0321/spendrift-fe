import { apiFetch } from "@/shared/api/client";
import type { BudgetRepository } from "../domain/repository";
import {
	type BudgetAlertResponseDto,
	type BudgetResponseDto,
	type BudgetStatusResponseDto,
	mapBudget,
	mapBudgetAlert,
	mapBudgetStatus,
	toBudgetBody,
} from "./dto";

function budgetsPath(trackerId: string) {
	return `/trackers/${trackerId}/budgets`;
}

export const budgetRepository: BudgetRepository = {
	async getAll(trackerId) {
		const dtos = await apiFetch<BudgetResponseDto[]>(budgetsPath(trackerId));
		return dtos.map(mapBudget);
	},

	async getByMonth(trackerId, month) {
		const budgets = await this.getAll(trackerId);
		return budgets.find((b) => b.month === month) ?? null;
	},

	async getById(trackerId, id) {
		const dto = await apiFetch<BudgetResponseDto>(
			`${budgetsPath(trackerId)}/${id}`,
		);
		return mapBudget(dto);
	},

	async getStatus(trackerId, id) {
		const dto = await apiFetch<BudgetStatusResponseDto>(
			`${budgetsPath(trackerId)}/${id}/status`,
		);
		return mapBudgetStatus(dto);
	},

	async getAlerts(trackerId, month) {
		const qs = month ? `?month=${month}` : "";
		const dtos = await apiFetch<BudgetAlertResponseDto[]>(
			`/trackers/${trackerId}/budget-alerts${qs}`,
		);
		return dtos.map(mapBudgetAlert);
	},

	async create(trackerId, input) {
		const dto = await apiFetch<BudgetResponseDto>(budgetsPath(trackerId), {
			method: "POST",
			body: toBudgetBody(input),
		});
		return mapBudget(dto);
	},

	async update(trackerId, id, patch) {
		const dto = await apiFetch<BudgetResponseDto>(
			`${budgetsPath(trackerId)}/${id}`,
			{ method: "PATCH", body: toBudgetBody(patch) },
		);
		return mapBudget(dto);
	},

	async delete(trackerId, id) {
		await apiFetch<void>(`${budgetsPath(trackerId)}/${id}`, {
			method: "DELETE",
		});
		return true;
	},
};

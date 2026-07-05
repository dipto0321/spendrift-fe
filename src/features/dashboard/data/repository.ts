import { apiFetch } from "@/shared/api/client";
import type { DashboardSummary } from "../domain/types";
import { type DashboardResponseDto, mapDashboard } from "./dto";

export const dashboardRepository = {
	async getSummary(
		trackerId: string,
		month?: string,
	): Promise<DashboardSummary> {
		const qs = month ? `?month=${month}` : "";
		const dto = await apiFetch<DashboardResponseDto>(
			`/trackers/${trackerId}/dashboard${qs}`,
		);
		return mapDashboard(dto);
	},
};

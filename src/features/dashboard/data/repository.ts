import { apiFetch } from "@/shared/api/client";
import type { DashboardSummary } from "../domain/types";
import { type DashboardResponseDto, mapDashboard } from "./dto";

export const dashboardRepository = {
	async getSummary(trackerId: string): Promise<DashboardSummary> {
		const dto = await apiFetch<DashboardResponseDto>(
			`/trackers/${trackerId}/dashboard`,
		);
		return mapDashboard(dto);
	},
};

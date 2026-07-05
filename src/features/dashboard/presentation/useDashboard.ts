import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "../data/queryKeys";
import { dashboardRepository } from "../data/repository";

export function useDashboard(trackerId: string | undefined, month?: string) {
	return useQuery({
		queryKey: dashboardKeys.summary(trackerId as string, month),
		queryFn: () => dashboardRepository.getSummary(trackerId as string, month),
		enabled: Boolean(trackerId),
	});
}

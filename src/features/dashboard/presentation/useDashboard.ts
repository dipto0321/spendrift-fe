import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "../data/queryKeys";
import { dashboardRepository } from "../data/repository";

export function useDashboard(trackerId: string | undefined) {
	return useQuery({
		queryKey: dashboardKeys.summary(trackerId as string),
		queryFn: () => dashboardRepository.getSummary(trackerId as string),
		enabled: Boolean(trackerId),
	});
}

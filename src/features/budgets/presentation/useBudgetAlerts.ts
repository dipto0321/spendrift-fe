import { useQuery } from "@tanstack/react-query";
import { usePreferences } from "@/features/preferences/presentation/usePreferences";
import { budgetKeys } from "../data/queryKeys";
import { budgetRepository } from "../data/repository";

// Category budget-threshold alerts for the given month, gated on the user's
// "Budget alerts" preference — disabled entirely means no fetch at all.
export function useBudgetAlerts(trackerId: string | undefined, month?: string) {
	const { data: prefs } = usePreferences();
	const enabled = Boolean(trackerId) && (prefs?.budgetAlerts ?? false);

	return useQuery({
		queryKey: budgetKeys.alerts(trackerId as string, month),
		queryFn: () => budgetRepository.getAlerts(trackerId as string, month),
		enabled,
	});
}

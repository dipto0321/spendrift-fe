import { useQuery } from "@tanstack/react-query";
import { expenseKeys } from "@/features/expenses/data/queryKeys";
import { expenseRepository } from "@/features/expenses/data/repository";

export function useLastEntryDate(trackerId: string | undefined) {
	return useQuery({
		queryKey: expenseKeys.lastEntry(trackerId as string),
		queryFn: () => expenseRepository.getLastEntryDate(trackerId as string),
		enabled: Boolean(trackerId),
	});
}

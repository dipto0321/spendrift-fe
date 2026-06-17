import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { budgetKeys } from "../data/queryKeys";
import { budgetRepository } from "../data/repository";
import type { BudgetCreateInput, BudgetUpdateInput } from "../domain/types";

// Query + mutation hooks for budgets.

export function useBudgets(trackerId: string | undefined) {
	return useQuery({
		queryKey: budgetKeys.all(trackerId as string),
		queryFn: () => budgetRepository.getAll(trackerId as string),
		enabled: Boolean(trackerId),
	});
}

// Server-computed status (spent/remaining/health) for one budget. Only runs
// when both ids are known (i.e. a budget exists for the period).
export function useBudgetStatus(
	trackerId: string | undefined,
	budgetId: string | undefined,
) {
	return useQuery({
		queryKey: budgetKeys.status(trackerId as string, budgetId as string),
		queryFn: () =>
			budgetRepository.getStatus(trackerId as string, budgetId as string),
		enabled: Boolean(trackerId) && Boolean(budgetId),
	});
}

export function useCreateBudget(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: BudgetCreateInput) =>
			budgetRepository.create(trackerId as string, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: budgetKeys.all(trackerId as string),
			});
			toast.success("Budget created");
		},
		onError: () => toast.error("Could not create budget. Please try again."),
	});
}

export function useUpdateBudget(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: BudgetUpdateInput }) =>
			budgetRepository.update(trackerId as string, id, patch),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: budgetKeys.all(trackerId as string),
			});
			toast.success("Budget updated");
		},
		onError: () => toast.error("Could not update budget. Please try again."),
	});
}

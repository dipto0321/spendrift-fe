import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { expenseKeys } from "../data/queryKeys";
import { expenseRepository } from "../data/repository";
import type { ExpenseCreateInput, ExpenseUpdateInput } from "../domain/types";

// Query + mutation hooks for expenses. Pages stay thin: the hooks own the
// query key, cache invalidation, and the generic success/error toasts, while
// the call site can still pass a per-call `onSuccess` for UI side effects
// (e.g. closing a modal).

export function useExpenses(trackerId: string | undefined) {
	return useQuery({
		queryKey: expenseKeys.all(trackerId as string),
		queryFn: () => expenseRepository.getAll(trackerId as string),
		enabled: Boolean(trackerId),
	});
}

export function useCreateExpense(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: ExpenseCreateInput) =>
			expenseRepository.create(trackerId as string, input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: expenseKeys.all(trackerId as string),
			});
			toast.success("Expense added");
		},
		onError: () => toast.error("Could not add expense. Please try again."),
	});
}

export function useUpdateExpense(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: ExpenseUpdateInput }) =>
			expenseRepository.update(trackerId as string, id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: expenseKeys.all(trackerId as string),
			});
			toast.success("Expense updated");
		},
		onError: () => toast.error("Could not update expense. Please try again."),
	});
}

export function useDeleteExpense(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			expenseRepository.delete(trackerId as string, id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: expenseKeys.all(trackerId as string),
			});
			toast.success("Expense deleted");
		},
		onError: () => toast.error("Could not delete expense. Please try again."),
	});
}

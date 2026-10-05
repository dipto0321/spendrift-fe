import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type ExpenseListKeyArgs, expenseKeys } from "../data/queryKeys";
import { expenseParseRepository, expenseRepository } from "../data/repository";
import { type BulkCreateResult, partitionSettled } from "../domain/services";
import type {
	ExpenseCreateInput,
	ExpenseFilter,
	ExpenseUpdateInput,
	ParseExpensesInput,
} from "../domain/types";

// Query + mutation hooks for expenses. Pages stay thin: the hooks own the
// query key, cache invalidation, and the generic success/error toasts, while
// the call site can still pass a per-call `onSuccess` for UI side effects
// (e.g. closing a modal).

export type UseExpensesParams = ExpenseListKeyArgs & {
	filter?: ExpenseFilter;
};

export function useExpenses(
	trackerId: string | undefined,
	params: UseExpensesParams = {},
) {
	return useQuery({
		queryKey: expenseKeys.list(trackerId as string, params),
		queryFn: () =>
			expenseRepository.getAll(trackerId as string, {
				filter: params.filter,
				page: params.page,
				pageSize: params.pageSize,
			}),
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

// Bulk add: fire one POST per row in parallel and report which input indexes
// failed so the modal can keep those rows for retry. Per-row failures resolve
// (not reject) — the caller inspects `failed`.
export function useBulkCreateExpenses(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (
			inputs: ExpenseCreateInput[],
		): Promise<BulkCreateResult> => {
			const results = await Promise.allSettled(
				inputs.map((input) =>
					expenseRepository.create(trackerId as string, input),
				),
			);
			return partitionSettled(results);
		},
		onSuccess: ({ succeeded, failed }) => {
			if (succeeded.length > 0) {
				queryClient.invalidateQueries({
					queryKey: expenseKeys.all(trackerId as string),
				});
			}
			if (failed.length === 0) {
				toast.success(
					succeeded.length === 1
						? "Expense added"
						: `${succeeded.length} expenses added`,
				);
			} else {
				toast.error(
					`${failed.length} of ${failed.length + succeeded.length} expenses failed to save.`,
				);
			}
		},
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

// Bulk date edit: fire one PATCH per selected id in parallel and report which
// ids failed. Only `date` is ever sent — the caller's dialog exposes no other
// field, so a multi-select can never mutate amount/category/type/description.
export function useBulkUpdateExpenseDates(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			ids,
			date,
		}: {
			ids: string[];
			date: string;
		}): Promise<BulkCreateResult> => {
			const results = await Promise.allSettled(
				ids.map((id) =>
					expenseRepository.update(trackerId as string, id, { date }),
				),
			);
			return partitionSettled(results);
		},
		onSuccess: ({ succeeded, failed }) => {
			if (succeeded.length > 0) {
				queryClient.invalidateQueries({
					queryKey: expenseKeys.all(trackerId as string),
				});
			}
			if (failed.length === 0) {
				toast.success(
					succeeded.length === 1
						? "Expense date updated"
						: `${succeeded.length} expense dates updated`,
				);
			} else {
				toast.error(
					`${failed.length} of ${failed.length + succeeded.length} expenses failed to update.`,
				);
			}
		},
		onError: () => toast.error("Could not update the dates. Please try again."),
	});
}

// Bulk delete: fire one DELETE per selected id in parallel and report which
// ids failed so the caller can keep them selected for retry.
export function useBulkDeleteExpenses(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (ids: string[]): Promise<BulkCreateResult> => {
			const results = await Promise.allSettled(
				ids.map((id) => expenseRepository.delete(trackerId as string, id)),
			);
			return partitionSettled(results);
		},
		onSuccess: ({ succeeded, failed }) => {
			if (succeeded.length > 0) {
				queryClient.invalidateQueries({
					queryKey: expenseKeys.all(trackerId as string),
				});
			}
			if (failed.length === 0) {
				toast.success(
					succeeded.length === 1
						? "Expense deleted"
						: `${succeeded.length} expenses deleted`,
				);
			} else {
				toast.error(
					`${failed.length} of ${failed.length + succeeded.length} expenses failed to delete.`,
				);
			}
		},
		onError: () => toast.error("Could not delete expenses. Please try again."),
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

// Smart paste: turn free text into candidate rows. No cache to invalidate —
// results only pre-fill the bulk grid; saving still goes through
// useBulkCreateExpenses after the user reviews the rows.
export function useParseExpenses(trackerId: string | undefined) {
	return useMutation({
		mutationFn: (input: ParseExpensesInput) =>
			expenseParseRepository.parseText(trackerId as string, input),
		onError: () =>
			toast.error("Could not parse the text. Try again or add rows manually."),
	});
}

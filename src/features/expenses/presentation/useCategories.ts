import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoryKeys, expenseKeys } from "../data/queryKeys";
import { categoryRepository } from "../data/repository";
import type { CategoryColor } from "../domain/types";

// Query + mutation hooks for expense categories.

export function useCategories(trackerId: string | undefined) {
	return useQuery({
		queryKey: categoryKeys.all(trackerId as string),
		queryFn: () => categoryRepository.getAll(trackerId as string),
		enabled: Boolean(trackerId),
	});
}

export function useCreateCategory(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ name, color }: { name: string; color: CategoryColor }) =>
			categoryRepository.create(trackerId as string, name, color),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: categoryKeys.all(trackerId as string),
			});
			toast.success("Category created");
		},
		onError: () => toast.error("Could not create category. Please try again."),
	});
}

export function useUpdateCategory(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			name,
			color,
		}: {
			id: string;
			name: string;
			color: CategoryColor;
		}) => categoryRepository.update(trackerId as string, id, { name, color }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: categoryKeys.all(trackerId as string),
			});
			toast.success("Category updated");
		},
		onError: () => toast.error("Could not update category. Please try again."),
	});
}

export function useDeleteCategory(trackerId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) =>
			categoryRepository.delete(trackerId as string, id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: categoryKeys.all(trackerId as string),
			});
			// Deleting a category reassigns its expenses to Uncategorized.
			queryClient.invalidateQueries({
				queryKey: expenseKeys.all(trackerId as string),
			});
			toast.success("Category deleted");
		},
		onError: () => toast.error("Could not delete category. Please try again."),
	});
}

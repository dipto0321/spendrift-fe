import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthSnapshot } from "@/features/auth/data/repository";
import { preferenceKeys } from "../data/queryKeys";
import { preferencesRepository } from "../data/repository";
import type { Preferences, PreferencesPatch } from "../domain/types";

export function usePreferences() {
	const { isAuthenticated } = useAuthSnapshot();
	return useQuery({
		queryKey: preferenceKeys.all,
		queryFn: () => preferencesRepository.get(),
		enabled: isAuthenticated,
	});
}

// Optimistic update so the switch flips instantly; rolled back on error.
export function useUpdatePreferences() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (patch: PreferencesPatch) =>
			preferencesRepository.update(patch),
		onMutate: async (patch) => {
			await queryClient.cancelQueries({ queryKey: preferenceKeys.all });
			const previous = queryClient.getQueryData<Preferences>(
				preferenceKeys.all,
			);
			if (previous) {
				queryClient.setQueryData<Preferences>(preferenceKeys.all, {
					...previous,
					...patch,
				});
			}
			return { previous };
		},
		onError: (_error, _patch, context) => {
			if (context?.previous) {
				queryClient.setQueryData(preferenceKeys.all, context.previous);
			}
			toast.error("Could not update preference. Please try again.");
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: preferenceKeys.all });
		},
	});
}

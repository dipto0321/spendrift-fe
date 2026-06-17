import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthSnapshot } from "@/features/auth/data/repository";
import { trackerKeys } from "../data/queryKeys";
import { trackerRepository } from "../data/repository";

// Query + mutation hooks for trackers. The success toasts live here; call sites
// can still pass a per-call `onSuccess` for navigation or UI side effects.

export function useTrackers() {
	// /trackers requires auth; the TrackerProvider also wraps the sign-in/up
	// pages, so only fetch once authenticated to avoid a guaranteed 401.
	const { isAuthenticated } = useAuthSnapshot();
	return useQuery({
		queryKey: trackerKeys.all,
		queryFn: () => trackerRepository.getAll(),
		enabled: isAuthenticated,
	});
}

export function useCreateTracker() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ name, currency }: { name: string; currency: string }) =>
			trackerRepository.create(name, currency),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trackerKeys.all });
			toast.success("Tracker created");
		},
		onError: () => toast.error("Could not create tracker. Please try again."),
	});
}

export function useUpdateTracker() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			name,
			currency,
		}: {
			id: string;
			name: string;
			currency: string;
		}) => trackerRepository.update(id, { name, currency }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trackerKeys.all });
			toast.success("Tracker updated");
		},
		onError: () => toast.error("Could not update tracker. Please try again."),
	});
}

export function useDeleteTracker() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => trackerRepository.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: trackerKeys.all });
			toast.success("Tracker deleted");
		},
		onError: () => toast.error("Could not delete tracker. Please try again."),
	});
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import { categoryRepository } from "@/features/expenses/data/repository";
import type { CategoryColor } from "@/features/expenses/domain/types";
import { CategoryManager } from "@/features/expenses/presentation/CategoryManager";
import { trackerRepository } from "@/features/trackers/data/repository";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { TrackerManager } from "@/features/trackers/presentation/TrackerManager";

export const Route = createFileRoute("/settings")({
	beforeLoad: requireAuth,
	component: SettingsPage,
});

function SettingsPage() {
	const queryClient = useQueryClient();
	const { activeTracker, setActiveTrackerById } = useTracker();

	const { data: categories = [] } = useQuery({
		queryKey: ["categories"],
		queryFn: () => categoryRepository.getAll(),
	});

	const { data: trackers = [] } = useQuery({
		queryKey: ["trackers"],
		queryFn: () => trackerRepository.getAll(),
	});

	const activeTrackerId = activeTracker?.id ?? trackers[0]?.id ?? "";

	const createMutation = useMutation({
		mutationFn: ({ name, color }: { name: string; color: string }) =>
			categoryRepository.create(name, color as CategoryColor),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			name,
			color,
		}: {
			id: string;
			name: string;
			color: string;
		}) =>
			categoryRepository.update(id, {
				name,
				color: color as CategoryColor,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => categoryRepository.delete(id, "uncategorized"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	const createTrackerMutation = useMutation({
		mutationFn: ({ name, currency }: { name: string; currency: string }) =>
			trackerRepository.create(name, currency),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["trackers"] });
		},
	});

	const updateTrackerMutation = useMutation({
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
			queryClient.invalidateQueries({ queryKey: ["trackers"] });
		},
	});

	const deleteTrackerMutation = useMutation({
		mutationFn: (id: string) => trackerRepository.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["trackers"] });
		},
	});

	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<header className="mb-6">
				<p className="island-kicker mb-2">Settings</p>
				<h1 className="display-title m-0 text-3xl font-semibold text-foreground sm:text-5xl">
					Workspace settings
				</h1>
				<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
					Manage your expense categories, account preferences, and more.
				</p>
			</header>

			<section className="mb-6">
				<div className="mb-3">
					<h2 className="text-base font-semibold text-foreground">
						Expense Categories
					</h2>
					<p className="m-0 text-sm text-muted-foreground">
						Create, rename, and delete categories for your expenses.
					</p>
				</div>
				<CategoryManager
					categories={categories}
					onCreate={async (name, color) => {
						await createMutation.mutateAsync({ name, color });
					}}
					onUpdate={async (id, name, color) => {
						await updateMutation.mutateAsync({ id, name, color });
					}}
					onDelete={async (id) => {
						await deleteMutation.mutateAsync(id);
					}}
				/>
			</section>

			<section className="mb-6">
				<div className="mb-3">
					<h2 className="text-base font-semibold text-foreground">Trackers</h2>
					<p className="m-0 text-sm text-muted-foreground">
						Create, rename, switch, and delete your trackers.
					</p>
				</div>
				<TrackerManager
					trackers={trackers}
					activeTrackerId={activeTrackerId}
					onCreate={async (name, currency) => {
						await createTrackerMutation.mutateAsync({ name, currency });
					}}
					onUpdate={async (id, name, currency) => {
						await updateTrackerMutation.mutateAsync({ id, name, currency });
					}}
					onDelete={async (id) => {
						await deleteTrackerMutation.mutateAsync(id);
					}}
					onActivate={setActiveTrackerById}
				/>
			</section>
		</main>
	);
}

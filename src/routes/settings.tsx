import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/features/auth/presentation/routeGuards";
import { CategoryManager } from "@/features/expenses/presentation/CategoryManager";
import {
	useCategories,
	useCreateCategory,
	useDeleteCategory,
	useUpdateCategory,
} from "@/features/expenses/presentation/useCategories";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { TrackerManager } from "@/features/trackers/presentation/TrackerManager";
import {
	useCreateTracker,
	useDeleteTracker,
	useTrackers,
	useUpdateTracker,
} from "@/features/trackers/presentation/useTrackers";

export const Route = createFileRoute("/settings")({
	beforeLoad: requireAuth,
	component: SettingsPage,
});

function SettingsPage() {
	const { activeTracker, setActiveTrackerById } = useTracker();
	const trackerId = activeTracker?.id;

	const { data: categories = [] } = useCategories(trackerId);
	const { data: trackers = [] } = useTrackers();

	const activeTrackerId = activeTracker?.id ?? trackers[0]?.id ?? "";

	const createMutation = useCreateCategory(trackerId);
	const updateMutation = useUpdateCategory(trackerId);
	const deleteMutation = useDeleteCategory(trackerId);

	const createTrackerMutation = useCreateTracker();
	const updateTrackerMutation = useUpdateTracker();
	const deleteTrackerMutation = useDeleteTracker();

	return (
		<main className="page-wrap rise-in px-4 pb-14 pt-10 sm:pt-12">
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

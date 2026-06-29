import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import { PageHeader } from "@/shared/ui/PageHeader";

export const Route = createFileRoute("/settings")({
	beforeLoad: requireAuth,
	component: SettingsPage,
});

type PreferenceKey = "budgetAlerts" | "weeklySummary" | "roundAmounts";

const PREFERENCE_DEFAULTS: Record<PreferenceKey, boolean> = {
	budgetAlerts: true,
	weeklySummary: true,
	roundAmounts: false,
};

const PREFERENCES: {
	key: PreferenceKey;
	title: string;
	description: string;
}[] = [
	{
		key: "budgetAlerts",
		title: "Budget alerts",
		description: "Get notified when a category nears its limit.",
	},
	{
		key: "weeklySummary",
		title: "Weekly summary",
		description: "Receive a recap of your spending every Monday.",
	},
	{
		key: "roundAmounts",
		title: "Round amounts",
		description: "Hide decimals across the app for a cleaner view.",
	},
];

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

	const [prefs, setPrefs] = useState<Record<PreferenceKey, boolean>>(
		PREFERENCE_DEFAULTS,
	);

	function togglePref(key: PreferenceKey) {
		setPrefs((p) => ({ ...p, [key]: !p[key] }));
	}

	return (
		<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
			<div className="mx-auto w-full max-w-3xl flex flex-col gap-6">
				<PageHeader
					title="Settings"
					description="Manage your trackers, expense categories, and preferences."
				/>

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

				<Card>
					<CardHeader>
						<CardTitle>Preferences</CardTitle>
						<CardDescription>
							Notifications and display options.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-1">
						{PREFERENCES.map((pref, i) => (
							<div key={pref.key}>
								{i > 0 && <Separator />}
								<div className="flex items-center justify-between gap-4 py-3">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-medium text-foreground">
											{pref.title}
										</span>
										<span className="text-xs text-muted-foreground">
											{pref.description}
										</span>
									</div>
									<Switch
										checked={prefs[pref.key]}
										onCheckedChange={() => togglePref(pref.key)}
										aria-label={pref.title}
									/>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

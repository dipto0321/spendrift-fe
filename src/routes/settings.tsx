import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { authRepository } from "@/features/auth/data/repository";
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
	const [passwordError, setPasswordError] = useState<string | null>(null);

	const updatePasswordMutation = useMutation({
		mutationFn: authRepository.updatePassword,
	});

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
								{i > 0 ? <Separator /> : null}
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

				<Card>
					<form
						className="contents"
						onSubmit={async (event) => {
							event.preventDefault();
							setPasswordError(null);
							const form = event.currentTarget;
							const data = new FormData(form);
							const currentPassword = (
								(data.get("currentPassword") as string | null) ?? ""
							).trim();
							const newPassword = (
								(data.get("newPassword") as string | null) ?? ""
							).trim();
							const confirmPassword = (
								(data.get("confirmPassword") as string | null) ?? ""
							).trim();
							if (newPassword !== confirmPassword) {
								setPasswordError("New password and confirmation do not match.");
								return;
							}
							try {
								await updatePasswordMutation.mutateAsync({
									currentPassword,
									newPassword,
								});
								form.reset();
							} catch (error) {
								setPasswordError(
									error instanceof Error
										? error.message
										: "Unable to update password.",
								);
							}
						}}
					>
						<CardHeader>
							<CardTitle>Change password</CardTitle>
							<CardDescription>
								Choose a strong password you don&apos;t use elsewhere.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-3">
							<div className="grid gap-2">
								<Label htmlFor="current-password">Current password</Label>
								<Input
									id="current-password"
									name="currentPassword"
									type="password"
									autoComplete="current-password"
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="new-password">New password</Label>
								<Input
									id="new-password"
									name="newPassword"
									type="password"
									autoComplete="new-password"
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="confirm-password">Confirm password</Label>
								<Input
									id="confirm-password"
									name="confirmPassword"
									type="password"
									autoComplete="new-password"
									required
								/>
							</div>
							{passwordError ? (
								<p className="col-span-full text-sm text-destructive">
									{passwordError}
								</p>
							) : null}
						</CardContent>
						<CardFooter className="justify-end">
							<Button type="submit" disabled={updatePasswordMutation.isPending}>
								{updatePasswordMutation.isPending ? "Updating…" : "Update password"}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</div>
		</main>
	);
}

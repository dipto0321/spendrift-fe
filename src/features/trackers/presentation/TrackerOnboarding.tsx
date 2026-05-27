import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerRepository } from "../data/repository";

export function TrackerOnboarding() {
	const queryClient = useQueryClient();
	const createMutation = useMutation({
		mutationFn: ({ name, currency }: { name: string; currency: string }) =>
			trackerRepository.create(name, currency),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["trackers"] });
		},
	});

	return (
		<div className="min-h-screen bg-background px-4 py-6">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center">
				<div className="w-full rounded-4xl border border-border/60 bg-card/40 p-6 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-8">
					<p className="island-kicker mb-2">Welcome</p>
					<h1 className="display-title m-0 text-3xl font-semibold text-foreground sm:text-5xl">
						Create your first tracker
					</h1>
					<p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
						FinTrack starts with a tracker. Add a name and currency to unlock
						the workspace.
					</p>

					<form
						className="mt-8 space-y-4"
						onSubmit={async (event) => {
							event.preventDefault();
							const form = event.currentTarget;
							const nameInput = form.elements.namedItem(
								"name",
							) as HTMLInputElement | null;
							const currencyInput = form.elements.namedItem(
								"currency",
							) as HTMLInputElement | null;
							const name = nameInput?.value.trim() ?? "";
							const currency = currencyInput?.value.trim().toUpperCase() ?? "";
							if (!name || !currency) return;
							await createMutation.mutateAsync({ name, currency });
							form.reset();
						}}
					>
						<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
							<label className="grid gap-2">
								<span className="text-sm font-medium text-foreground">
									Tracker name
								</span>
								<input
									name="name"
									type="text"
									placeholder="Personal finances"
									className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
									required
								/>
							</label>
							<label className="grid gap-2">
								<span className="text-sm font-medium text-foreground">
									Currency
								</span>
								<input
									name="currency"
									type="text"
									placeholder="USD"
									className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
									maxLength={3}
									required
								/>
							</label>
						</div>

						<button
							type="submit"
							disabled={createMutation.isPending}
							className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
						>
							{createMutation.isPending ? "Creating..." : "Create tracker"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}

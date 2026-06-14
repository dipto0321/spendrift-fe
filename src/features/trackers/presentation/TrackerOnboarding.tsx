import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTracker } from "./useTrackers";

export function TrackerOnboarding() {
	const createMutation = useCreateTracker();

	return (
		<div className="min-h-screen bg-background px-4 py-6">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-4xl items-center">
				<Card className="w-full overflow-hidden rounded-4xl border-border/60 bg-card/60 shadow-2xl shadow-black/10 backdrop-blur-sm">
					<CardHeader className="space-y-4 border-b border-border/50 px-6 py-8 sm:px-8 sm:py-10">
						<div className="space-y-2">
							<p className="island-kicker mb-0">Welcome</p>
							<CardTitle className="display-title text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
								Create your first tracker
							</CardTitle>
						</div>
						<CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
							Spendrift starts with a tracker. Add a name and currency to unlock
							the workspace.
						</CardDescription>
					</CardHeader>

					<CardContent className="px-6 py-6 sm:px-8 sm:py-8">
						<form
							className="space-y-6"
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
								const currency =
									currencyInput?.value.trim().toUpperCase() ?? "";
								if (!name || !currency) return;
								await createMutation.mutateAsync({ name, currency });
								form.reset();
							}}
						>
							<div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_12rem] md:items-end">
								<div className="grid gap-2">
									<Label
										htmlFor="tracker-name"
										className="text-sm font-medium text-foreground"
									>
										Tracker name
									</Label>
									<Input
										id="tracker-name"
										name="name"
										type="text"
										placeholder="Personal finances"
										className="h-12 rounded-xl bg-background text-sm"
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label
										htmlFor="tracker-currency"
										className="text-sm font-medium text-foreground"
									>
										Currency
									</Label>
									<Input
										id="tracker-currency"
										name="currency"
										type="text"
										placeholder="BDT"
										className="h-12 rounded-xl bg-background text-sm uppercase"
										maxLength={3}
										onChange={(event) => {
											event.currentTarget.value = event.currentTarget.value
												.toUpperCase()
												.slice(0, 3);
										}}
										required
									/>
								</div>
							</div>

							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-sm text-muted-foreground">
									Use a short tracker name and a three-letter currency code.
								</p>
								<Button
									type="submit"
									size="lg"
									disabled={createMutation.isPending}
									className="sm:min-w-40"
								>
									{createMutation.isPending ? "Creating..." : "Create tracker"}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

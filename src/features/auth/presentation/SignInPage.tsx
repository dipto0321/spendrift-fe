import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { authRepository, useAuthSnapshot } from "../data/repository";

export function SignInPage() {
	const navigate = useNavigate();
	const auth = useAuthSnapshot();
	const signInMutation = useMutation({
		mutationFn: authRepository.signIn,
		onSuccess: async () => {
			await navigate({ to: "/" });
		},
	});

	return (
		<div className="min-h-screen bg-background px-4 py-6">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center">
				<div className="grid w-full gap-8 rounded-[2rem] border border-border/60 bg-card/40 p-6 shadow-2xl shadow-black/10 backdrop-blur-sm lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
					<div className="flex flex-col justify-between rounded-[1.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white">
						<div>
							<p className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">
								FinTrack
							</p>
							<h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
								Track money with a clean workspace.
							</h1>
							<p className="mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
								Sign in to open your trackers, budgets, expenses, and reports.
							</p>
						</div>
						<div className="mt-10 grid grid-cols-3 gap-3 text-xs text-white/70 sm:text-sm">
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								Secure sign-in
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								One tracker gate
							</div>
							<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
								Profile settings
							</div>
						</div>
					</div>

					<div className="flex items-center">
						<div className="w-full">
							<p className="island-kicker mb-2">Welcome back</p>
							<h2 className="display-title m-0 text-3xl font-semibold text-foreground sm:text-4xl">
								Sign in
							</h2>
							<p className="mt-3 text-sm leading-6 text-muted-foreground">
								{auth.hasAccount
									? "Use your account to continue."
									: "No account found yet. Create one to get started."}
							</p>

							<form
								className="mt-8 space-y-4"
								onSubmit={async (event) => {
									event.preventDefault();
									const form = event.currentTarget;
									const data = new FormData(form);
									const email = String(data.get("email") ?? "").trim();
									const password = String(data.get("password") ?? "").trim();
									if (!email || !password) return;
									await signInMutation.mutateAsync({ email, password });
								}}
							>
								<label className="grid gap-2">
									<span className="text-sm font-medium text-foreground">
										Email
									</span>
									<input
										name="email"
										type="email"
										autoComplete="email"
										className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
										required
									/>
								</label>
								<label className="grid gap-2">
									<span className="text-sm font-medium text-foreground">
										Password
									</span>
									<input
										name="password"
										type="password"
										autoComplete="current-password"
										className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
										required
									/>
								</label>

								{signInMutation.error ? (
									<p className="text-sm text-red-500">
										{signInMutation.error.message}
									</p>
								) : null}

								<button
									type="submit"
									disabled={signInMutation.isPending}
									className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
								>
									{signInMutation.isPending ? "Signing in..." : "Sign in"}
								</button>
							</form>

							<div className="mt-6 text-sm text-muted-foreground">
								No account yet?{" "}
								<Link
									to="/sign-up"
									className="font-medium text-primary hover:underline"
								>
									Sign up
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

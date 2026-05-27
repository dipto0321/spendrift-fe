import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { authRepository } from "../data/repository";

export function SignUpPage() {
	const navigate = useNavigate();
	const signUpMutation = useMutation({
		mutationFn: authRepository.signUp,
		onSuccess: async () => {
			await navigate({ to: "/" });
		},
	});

	return (
		<div className="min-h-screen bg-background px-4 py-6">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center">
				<div className="grid w-full gap-8 rounded-4xl border border-border/60 bg-card/40 p-6 shadow-2xl shadow-black/10 backdrop-blur-sm lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
					<div className="order-2 flex items-center lg:order-1">
						<div className="w-full">
							<p className="island-kicker mb-2">Create account</p>
							<h1 className="display-title m-0 text-3xl font-semibold text-foreground sm:text-4xl">
								Sign up
							</h1>
							<p className="mt-3 text-sm leading-6 text-muted-foreground">
								Create your account first, then we will ask you to create your
								first tracker.
							</p>

							<form
								className="mt-8 space-y-4"
								onSubmit={async (event) => {
									event.preventDefault();
									const form = event.currentTarget;
									const data = new FormData(form);
									const nameInput = data.get("name");
									const emailInput = data.get("email");
									const passwordInput = data.get("password");
									const name =
										typeof nameInput === "string" ? nameInput.trim() : "";
									const email =
										typeof emailInput === "string" ? emailInput.trim() : "";
									const password =
										typeof passwordInput === "string"
											? passwordInput.trim()
											: "";
									if (!name || !email || !password) return;
									await signUpMutation.mutateAsync({ name, email, password });
								}}
							>
								<label className="grid gap-2">
									<span className="text-sm font-medium text-foreground">
										Name
									</span>
									<input
										name="name"
										type="text"
										autoComplete="name"
										className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
										required
									/>
								</label>
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
										autoComplete="new-password"
										className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
										required
									/>
								</label>

								{signUpMutation.error ? (
									<p className="text-sm text-red-500">
										{signUpMutation.error.message}
									</p>
								) : null}

								<button
									type="submit"
									disabled={signUpMutation.isPending}
									className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
								>
									{signUpMutation.isPending ? "Creating..." : "Create account"}
								</button>
							</form>

							<div className="mt-6 text-sm text-muted-foreground">
								Already have an account?{" "}
								<Link
									to="/sign-in"
									className="font-medium text-primary hover:underline"
								>
									Sign in
								</Link>
							</div>
						</div>
					</div>

					<div className="order-1 rounded-3xl  p-6 text-foreground lg:order-2">
						<p className="text-sm font-medium uppercase tracking-[0.2em] text-foreground/60">
							First step
						</p>
						<h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
							Create your account, then create a tracker.
						</h2>
						<p className="mt-4 max-w-xl text-sm leading-6 text-foreground/70 sm:text-base">
							The app will open the tracker onboarding screen immediately after
							signup.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

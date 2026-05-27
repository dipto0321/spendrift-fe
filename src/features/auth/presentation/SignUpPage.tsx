import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authRepository } from "../data/repository";

export function SignUpPage() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [humanCheck, setHumanCheck] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);
	const signUpMutation = useMutation({
		mutationFn: authRepository.signUp,
		onSuccess: async () => {
			await navigate({ to: "/" });
		},
	});

	return (
		<div className="min-h-screen bg-background px-4 py-6">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center">
				<Card className="grid w-full overflow-hidden rounded-4xl border-border/60 bg-card/60 shadow-2xl shadow-black/10 backdrop-blur-sm lg:grid-cols-[0.95fr_1.05fr]">
					<div className="order-2 flex items-center p-6 sm:p-8 lg:order-1 lg:p-10">
						<div className="w-full">
							<p className="island-kicker mb-2">Create account</p>
							<CardTitle className="display-title m-0 text-3xl font-semibold text-foreground sm:text-4xl">
								Sign up
							</CardTitle>
							<CardDescription className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
								Create your account first, then we will ask you to create your
								first tracker.
							</CardDescription>

							<form
								className="mt-8 space-y-4"
								onSubmit={async (event) => {
									event.preventDefault();
									setLocalError(null);

									const cleanName = name.trim();
									const cleanEmail = email.trim();
									const cleanPassword = password.trim();
									const cleanConfirmPassword = confirmPassword.trim();
									const verifiedHuman = humanCheck.trim().toLowerCase();

									if (!cleanName || !cleanEmail || !cleanPassword) {
										setLocalError(
											"Fill in every field before creating an account.",
										);
										return;
									}

									if (cleanPassword !== cleanConfirmPassword) {
										setLocalError("Passwords do not match.");
										return;
									}

									if (verifiedHuman !== "i am a human") {
										setLocalError('Type "I am a human" to continue.');
										return;
									}

									await signUpMutation.mutateAsync({
										name: cleanName,
										email: cleanEmail,
										password: cleanPassword,
									});
								}}
							>
								<div className="grid gap-2">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										type="text"
										autoComplete="name"
										value={name}
										onChange={(event) => setName(event.target.value)}
										placeholder="Your full name"
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										autoComplete="email"
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder="name@domain.com"
									/>
								</div>
								<div className="grid gap-2 sm:grid-cols-2">
									<div className="grid gap-2">
										<Label htmlFor="password">Password</Label>
										<Input
											id="password"
											type="password"
											autoComplete="new-password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											placeholder="Create a password"
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="confirm-password">Confirm password</Label>
										<Input
											id="confirm-password"
											type="password"
											autoComplete="new-password"
											value={confirmPassword}
											onChange={(event) =>
												setConfirmPassword(event.target.value)
											}
											placeholder="Repeat password"
										/>
									</div>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="human-check">Human verification</Label>
									<Input
										id="human-check"
										type="text"
										autoComplete="off"
										spellCheck={false}
										value={humanCheck}
										onChange={(event) => setHumanCheck(event.target.value)}
										placeholder='Type "I am a human"'
									/>
									<p className="text-xs text-muted-foreground">
										This keeps obvious bot-style submissions out of the mock
										flow.
									</p>
								</div>

								{localError || signUpMutation.error ? (
									<p className="text-sm text-red-500">
										{localError ?? signUpMutation.error?.message}
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

					<div className="order-1 border-b border-border/50 bg-muted/25 p-6 text-foreground lg:order-2 lg:border-b-0 lg:border-l lg:p-8">
						<p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
							First step
						</p>
						<h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
							Create your account, then create a tracker.
						</h2>
						<p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
							The app will open the tracker onboarding screen immediately after
							signup.
						</p>
						<div className="mt-8 space-y-3 text-sm">
							<div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
								<span className="mt-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
								<p className="m-0 text-muted-foreground">
									One account unlocks your tracker workspace.
								</p>
							</div>
							<div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
								<span className="mt-0.5 inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
								<p className="m-0 text-muted-foreground">
									Password confirmation and human check reduce noisy signups.
								</p>
							</div>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}

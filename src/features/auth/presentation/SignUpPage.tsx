import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
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
import { authRepository } from "../data/repository";

type HumanChallenge = {
	left: number;
	right: number;
	operator: "+" | "-" | "×";
	answer: number;
};

function createHumanChallenge(): HumanChallenge {
	const left = Math.floor(Math.random() * 8) + 2;
	const right = Math.floor(Math.random() * 8) + 1;
	const operators: Array<HumanChallenge["operator"]> = ["+", "-", "×"];
	const operator = operators[Math.floor(Math.random() * operators.length)];
	let answer = left + right;

	if (operator === "-") {
		answer = Math.max(left, right) - Math.min(left, right);
	} else if (operator === "×") {
		answer = left * right;
	}

	return { left, right, operator, answer };
}

export function SignUpPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	// Generated after mount, not in the initializer: createHumanChallenge() uses
	// Math.random(), so seeding it during render makes the server and client
	// disagree and triggers a hydration mismatch.
	const [humanChallenge, setHumanChallenge] = useState<HumanChallenge | null>(
		null,
	);
	const [humanAnswer, setHumanAnswer] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	useEffect(() => {
		setHumanChallenge(createHumanChallenge());
	}, []);
	const signUpMutation = useMutation({
		mutationFn: authRepository.signUp,
		onSuccess: async () => {
			// signUp wipes mock data for the fresh account; drop any cached
			// trackers/expenses so the workspace gate re-reads the empty state
			// and routes the new user into onboarding.
			queryClient.clear();
			await navigate({ to: "/" });
		},
	});

	return (
		<div className="min-h-screen bg-background px-4 py-6">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl items-center">
				<Card className="w-full overflow-hidden rounded-4xl border-border/60 bg-card/60 shadow-2xl shadow-black/10 backdrop-blur-sm">
					<CardHeader className="space-y-3 border-b border-border/50 px-6 py-8 sm:px-8">
						<p className="island-kicker mb-0">Create account</p>
						<CardTitle className="display-title m-0 text-3xl font-semibold text-foreground sm:text-4xl">
							Sign up
						</CardTitle>
						<CardDescription className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
							Create your account first, then we will ask you to create your
							first tracker.
						</CardDescription>
					</CardHeader>

					<CardContent className="px-6 py-6 sm:px-8 sm:py-8">
						<form
							className="space-y-4"
							onSubmit={async (event) => {
								event.preventDefault();
								setLocalError(null);

								const cleanName = name.trim();
								const cleanEmail = email.trim();
								const cleanPassword = password.trim();
								const cleanConfirmPassword = confirmPassword.trim();
								const cleanHumanAnswer = Number.parseInt(
									humanAnswer.trim(),
									10,
								);

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

								if (!humanChallenge || Number.isNaN(cleanHumanAnswer)) {
									setLocalError("Solve the human check to continue.");
									return;
								}

								if (cleanHumanAnswer !== humanChallenge.answer) {
									setLocalError("Human check answer is incorrect.");
									return;
								}

								await signUpMutation.mutateAsync({
									name: cleanName,
									email: cleanEmail,
									password: cleanPassword,
								});
								setHumanAnswer("");
								setHumanChallenge(createHumanChallenge());
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
									<div className="relative">
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											autoComplete="new-password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											placeholder="Create a password"
											className="pr-10"
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
											onClick={() => setShowPassword((value) => !value)}
											aria-label={
												showPassword ? "Hide password" : "Show password"
											}
										>
											{showPassword ? <EyeOff /> : <Eye />}
										</Button>
									</div>
								</div>

								<div className="grid gap-2">
									<Label htmlFor="confirm-password">Confirm password</Label>
									<div className="relative">
										<Input
											id="confirm-password"
											type={showConfirmPassword ? "text" : "password"}
											autoComplete="new-password"
											value={confirmPassword}
											onChange={(event) =>
												setConfirmPassword(event.target.value)
											}
											placeholder="Repeat password"
											className="pr-10"
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
											onClick={() => setShowConfirmPassword((value) => !value)}
											aria-label={
												showConfirmPassword
													? "Hide confirm password"
													: "Show confirm password"
											}
										>
											{showConfirmPassword ? <EyeOff /> : <Eye />}
										</Button>
									</div>
								</div>
							</div>

							<div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
									<div className="grid gap-2">
										<Label htmlFor="human-check">Human verification</Label>
										<p className="text-sm text-muted-foreground">
											Solve this quick check to continue.
										</p>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											setHumanChallenge(createHumanChallenge());
											setHumanAnswer("");
											setLocalError(null);
										}}
									>
										New challenge
									</Button>
								</div>
								<div className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3">
									<span className="text-lg font-semibold tracking-tight text-foreground">
										{humanChallenge
											? `${humanChallenge.left} ${humanChallenge.operator} ${humanChallenge.right} = ?`
											: "…"}
									</span>
									<Input
										id="human-check"
										type="text"
										inputMode="numeric"
										autoComplete="off"
										spellCheck={false}
										value={humanAnswer}
										onChange={(event) => setHumanAnswer(event.target.value)}
										placeholder="Answer"
										className="h-11 max-w-28 text-center text-base"
									/>
								</div>
							</div>

							{localError || signUpMutation.error ? (
								<p className="text-sm text-red-500">
									{localError ?? signUpMutation.error?.message}
								</p>
							) : null}

							<Button
								type="submit"
								disabled={signUpMutation.isPending}
								className="w-full rounded-xl"
							>
								{signUpMutation.isPending ? "Creating..." : "Create account"}
							</Button>
						</form>
					</CardContent>

					<CardFooter className="border-t border-border/50 px-6 py-5 sm:px-8">
						<div className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link
								to="/sign-in"
								className="font-medium text-primary hover:underline"
							>
								Sign in
							</Link>
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Globe, PieChart, TrendingUp, Wallet } from "lucide-react";
import type { ElementType } from "react";
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

function BrandMark() {
	return (
		<div className="flex items-center gap-2">
			<div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
				<Wallet className="size-4" />
			</div>
			<span className="text-lg font-semibold">Spendrift</span>
		</div>
	);
}

function FeatureLine({ icon: Icon, text }: { icon: ElementType; text: string }) {
	return (
		<li className="flex items-center gap-3">
			<span className="flex size-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
				<Icon className="size-4" />
			</span>
			{text}
		</li>
	);
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
	// Generated after mount — Math.random() during render causes hydration mismatch
	const [humanChallenge, setHumanChallenge] = useState<HumanChallenge | null>(null);
	const [humanAnswer, setHumanAnswer] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	useEffect(() => {
		setHumanChallenge(createHumanChallenge());
	}, []);

	const signUpMutation = useMutation({
		mutationFn: authRepository.signUp,
		onSuccess: async () => {
			queryClient.clear();
			await navigate({ to: "/" });
		},
	});

	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="relative hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
				<BrandMark />
				<div className="flex flex-col gap-6">
					<h1 className="text-pretty text-3xl font-semibold leading-tight">
						Track every expense across every currency, in one calm place.
					</h1>
					<ul className="flex flex-col gap-4 text-sm text-sidebar-foreground/80">
						<FeatureLine icon={Globe} text="Separate trackers per country and currency" />
						<FeatureLine icon={TrendingUp} text="Cashflow and savings health at a glance" />
						<FeatureLine icon={PieChart} text="Needs vs wants breakdown and reports" />
					</ul>
				</div>
				<p className="text-xs text-sidebar-foreground/60">
					&copy; 2026 Spendrift. A personal finance companion.
				</p>
			</div>

			<div className="flex items-center justify-center p-6 md:p-10">
				<Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
					<CardHeader>
						<div className="mb-2 lg:hidden">
							<BrandMark />
						</div>
						<CardTitle className="text-xl">Create your account</CardTitle>
						<CardDescription>
							Start tracking your spending in minutes.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							className="grid gap-4"
							onSubmit={async (event) => {
								event.preventDefault();
								setLocalError(null);

								const cleanName = name.trim();
								const cleanEmail = email.trim();
								const cleanPassword = password.trim();
								const cleanConfirmPassword = confirmPassword.trim();
								const cleanHumanAnswer = Number.parseInt(humanAnswer.trim(), 10);

								if (!cleanName || !cleanEmail || !cleanPassword) {
									setLocalError("Fill in every field before creating an account.");
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
								<Label htmlFor="name">Full name</Label>
								<Input
									id="name"
									type="text"
									autoComplete="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
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
									onChange={(e) => setEmail(e.target.value)}
									placeholder="name@domain.com"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										autoComplete="new-password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Create a password"
										className="pr-10"
									/>
									<button
										type="button"
										className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										onClick={() => setShowPassword((v) => !v)}
										aria-label={showPassword ? "Hide password" : "Show password"}
									>
										{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
									</button>
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
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="Repeat password"
										className="pr-10"
									/>
									<button
										type="button"
										className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										onClick={() => setShowConfirmPassword((v) => !v)}
										aria-label={
											showConfirmPassword ? "Hide confirm password" : "Show confirm password"
										}
									>
										{showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
									</button>
								</div>
							</div>

							<div className="rounded-lg border border-border/60 bg-muted/30 p-4">
								<div className="flex items-center justify-between gap-4">
									<div>
										<Label htmlFor="human-check">Human check</Label>
										<p className="mt-1 text-xs text-muted-foreground">
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
										New
									</Button>
								</div>
								<div className="mt-3 flex items-center gap-3">
									<span className="text-sm font-semibold text-foreground">
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
										onChange={(e) => setHumanAnswer(e.target.value)}
										placeholder="Answer"
										className="max-w-24 text-center"
									/>
								</div>
							</div>

							{localError ?? signUpMutation.error ? (
								<p className="text-sm text-destructive">
									{localError ?? signUpMutation.error?.message}
								</p>
							) : null}

							<Button
								type="submit"
								disabled={signUpMutation.isPending}
								className="w-full"
							>
								{signUpMutation.isPending ? "Creating…" : "Create account"}
							</Button>
						</form>
					</CardContent>
					<CardFooter className="justify-center">
						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link
								to="/sign-in"
								className="font-medium text-foreground underline-offset-4 hover:underline"
							>
								Sign in
							</Link>
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}

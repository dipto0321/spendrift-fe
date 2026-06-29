import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Globe, PieChart, TrendingUp, Wallet } from "lucide-react";
import type { ElementType } from "react";
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

export function SignInPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const signInMutation = useMutation({
		mutationFn: authRepository.signIn,
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
						<CardTitle className="text-xl">Welcome back</CardTitle>
						<CardDescription>
							Sign in to continue to your trackers.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							className="grid gap-4"
							onSubmit={async (event) => {
								event.preventDefault();
								const form = event.currentTarget;
								const data = new FormData(form);
								const emailInput = data.get("email");
								const passwordInput = data.get("password");
								const email =
									typeof emailInput === "string" ? emailInput.trim() : "";
								const password =
									typeof passwordInput === "string"
										? passwordInput.trim()
										: "";
								if (!email || !password) return;
								await signInMutation.mutateAsync({ email, password });
							}}
						>
							<div className="grid gap-2">
								<Label htmlFor="signin-email">Email</Label>
								<Input
									id="signin-email"
									name="email"
									type="email"
									autoComplete="email"
									required
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="signin-password">Password</Label>
								<Input
									id="signin-password"
									name="password"
									type="password"
									autoComplete="current-password"
									required
								/>
							</div>
							{signInMutation.error ? (
								<p className="text-sm text-destructive">
									{signInMutation.error.message}
								</p>
							) : null}
							<Button
								type="submit"
								disabled={signInMutation.isPending}
								className="w-full"
							>
								{signInMutation.isPending ? "Signing in…" : "Sign in"}
							</Button>
						</form>
					</CardContent>
					<CardFooter className="justify-center">
						<p className="text-sm text-muted-foreground">
							Don&apos;t have an account?{" "}
							<Link
								to="/sign-up"
								className="font-medium text-foreground underline-offset-4 hover:underline"
							>
								Sign up
							</Link>
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}

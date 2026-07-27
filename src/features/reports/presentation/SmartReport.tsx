// Smart Report — month-by-month AI summary of spending.
//
// Flow:
//   1. User picks a month and clicks "Generate report".
//   2. We fetch the structured monthly snapshot from the backend (no LLM
//      cost yet).
//   3. We build a compact text prompt from the snapshot and call the
//      user's configured LLM directly from the browser.
//   4. The LLM returns a three-section JSON narrative that we render.
//
// The LLM never computes any numbers — it only writes the prose. The
// numbers in the header cards come from the snapshot.

import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	Lightbulb,
	ListChecks,
	Sparkles,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { getCurrentMonth } from "@/features/budgets/domain/services";
import { useFormatCurrency } from "@/features/preferences/presentation/useFormatCurrency";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { loadAiSettingsAsync } from "@/shared/ai/storage";
import { callLlmStructured, LlmError } from "@/shared/llm/client";
import { MoneyText } from "@/shared/ui/MoneyText";
import { PageHeader } from "@/shared/ui/PageHeader";
import { reportRepository } from "../data/repository";
import type {
	MonthlyInsightsSnapshot,
	SmartReportNarrative,
} from "../domain/types";

const TOP_N_CATEGORIES = 5;
const TOP_N_EXPENSES = 3;

type Phase = "idle" | "snapshot" | "narrative" | "done";

function formatMonth(month: string): string {
	const [year, mon] = month.split("-").map(Number);
	if (!year || !mon) return month;
	const date = new Date(year, mon - 1, 1);
	return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/**
 * Compose the prompt. Deterministic formatting — the same snapshot must
 * produce the same prompt so tests can assert against it.
 */
function buildPrompt(snapshot: MonthlyInsightsSnapshot): string {
	const lines: string[] = [];
	lines.push(
		`You are a careful, non-judgmental personal-finance analyst. Use ONLY the numbers below. Do not invent categories or amounts.`,
	);
	lines.push(``);
	lines.push(`Currency: ${snapshot.currency}`);
	lines.push(`Month: ${snapshot.month}`);
	lines.push(`Total spent: ${snapshot.total.toFixed(2)}`);
	lines.push(`Prior month total: ${snapshot.priorTotal.toFixed(2)}`);
	lines.push(`Month-over-month change: ${snapshot.deltaPct}%`);
	lines.push(``);
	lines.push(`Top categories (current vs prior, with delta %):`);
	for (const c of snapshot.topCategories) {
		lines.push(
			`- ${c.categoryName}: ${c.currentTotal.toFixed(2)} (prior ${c.priorTotal.toFixed(2)}, ${c.deltaPct >= 0 ? "+" : ""}${c.deltaPct}%), ${c.count} expense(s)`,
		);
	}
	lines.push(``);
	lines.push(`Needs vs wants:`);
	lines.push(`- Needs: ${snapshot.needsWants.needs.toFixed(2)}`);
	lines.push(`- Wants: ${snapshot.needsWants.wants.toFixed(2)}`);
	lines.push(``);
	lines.push(`Largest individual expenses in the month:`);
	for (const e of snapshot.largestExpenses) {
		lines.push(
			`- ${e.amount.toFixed(2)} on ${e.date} (${e.categoryName}, ${e.type})${e.description ? ` — "${e.description}"` : ""}`,
		);
	}
	lines.push(``);
	lines.push(
		`Reply with a JSON object with three string fields: "where_it_went" (one short paragraph on where the money went), "what_changed" (one short paragraph on what changed vs the prior month), and "where_to_save" (a 3-5 bullet list of practical suggestions). Keep the total response under 220 words.`,
	);
	return lines.join("\n");
}

function parseNarrative(raw: unknown): SmartReportNarrative {
	if (typeof raw !== "object" || raw === null) {
		throw new LlmError("Reply was not an object.");
	}
	const obj = raw as Record<string, unknown>;
	const whereItWent =
		typeof obj.where_it_went === "string" ? obj.where_it_went : "";
	const whatChanged =
		typeof obj.what_changed === "string" ? obj.what_changed : "";
	const whereToSave = Array.isArray(obj.where_to_save)
		? obj.where_to_save.filter((s): s is string => typeof s === "string")
		: [];
	return { whereItWent, whatChanged, whereToSave };
}

function monthValid(month: string): boolean {
	return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

export function SmartReport() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const formatCurrency = useFormatCurrency();
	const [month, setMonth] = useState<string>(getCurrentMonth());
	const [phase, setPhase] = useState<Phase>("idle");
	const [snapshot, setSnapshot] = useState<MonthlyInsightsSnapshot | null>(
		null,
	);
	const [narrative, setNarrative] = useState<SmartReportNarrative | null>(null);
	const [error, setError] = useState<string | null>(null);

	const generate = useMutation({
		mutationFn: async (m: string) => {
			if (!trackerId) {
				throw new Error("Pick a tracker before generating a report.");
			}
			setError(null);
			setSnapshot(null);
			setNarrative(null);

			setPhase("snapshot");
			const snap = await reportRepository.getMonthlyInsights(trackerId, {
				month: m,
				topNCategories: TOP_N_CATEGORIES,
				topNExpenses: TOP_N_EXPENSES,
			});
			setSnapshot(snap);

			setPhase("narrative");
			const settings = await loadAiSettingsAsync();
			if (!settings.apiKey) {
				throw new LlmError(
					"Add an API key in AI Settings before generating a report.",
				);
			}
			const prompt = buildPrompt(snap);
			const raw = await callLlmStructured(
				settings,
				prompt,
				"smart_report_narrative",
			);
			const parsed = parseNarrative(raw);
			setNarrative(parsed);
			setPhase("done");
		},
		onError: (e) => {
			setError(e instanceof Error ? e.message : String(e));
			setPhase("idle");
		},
	});

	const isBusy = phase === "snapshot" || phase === "narrative";
	const headerPhase =
		phase === "snapshot"
			? "Aggregating expenses…"
			: phase === "narrative"
				? "Writing your report…"
				: null;

	return (
		<div className="flex flex-col gap-6 px-4 pb-14 pt-6">
			<div className="mx-auto w-full max-w-3xl flex flex-col gap-6">
				<PageHeader
					title="Smart Report"
					description="An AI-written summary of this month — where you spent, what changed, and where to save."
					actions={
						<Badge variant="outline" className="gap-1">
							<Sparkles className="size-3" />
							Your provider key
						</Badge>
					}
				/>

				<Alert>
					<Lightbulb className="size-4" />
					<AlertTitle>Your key, your privacy</AlertTitle>
					<AlertDescription>
						This report uses your own provider key, configured in{" "}
						<Link
							to="/ai"
							className="font-medium underline-offset-4 hover:underline"
						>
							AI Settings
						</Link>
						. Spendrift never sees your key or the request contents.
					</AlertDescription>
				</Alert>

				<Card>
					<CardHeader>
						<CardTitle>Generate report</CardTitle>
						<CardDescription>
							Pick a month. The numbers are computed on the server; the
							narrative is written by your configured LLM.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
						<div className="grid gap-2 sm:max-w-xs">
							<Label htmlFor="smart-report-month">Month</Label>
							<Input
								id="smart-report-month"
								type="month"
								value={month}
								onChange={(e) => setMonth(e.target.value)}
								max={`${new Date().getFullYear()}-12`}
							/>
						</div>
						<Button
							type="button"
							disabled={isBusy || !trackerId || !monthValid(month)}
							onClick={() => generate.mutate(month)}
						>
							<Sparkles className="size-4" />
							{isBusy ? "Generating…" : "Generate report"}
						</Button>
					</CardContent>
				</Card>

				{error ? (
					<Alert variant="destructive">
						<AlertTitle>Couldn't generate your report</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				{headerPhase ? (
					<Card>
						<CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
							<div className="size-2 animate-pulse rounded-full bg-primary" />
							{headerPhase}
						</CardContent>
					</Card>
				) : null}

				{snapshot ? (
					<div className="grid gap-4 sm:grid-cols-3">
						<Card>
							<CardContent className="flex flex-col gap-1.5">
								<span className="text-xs font-medium text-muted-foreground">
									Total ({formatMonth(snapshot.month)})
								</span>
								<MoneyText
									amount={Math.round(snapshot.total)}
									currency={snapshot.currency}
									className="text-xl font-semibold tabular-nums"
								/>
								<span className="text-xs text-muted-foreground">
									{snapshot.deltaPct === 0
										? "No change vs prior month"
										: `${snapshot.deltaPct > 0 ? "+" : ""}${snapshot.deltaPct}% vs ${snapshot.priorTotal.toFixed(0)}`}
								</span>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="flex flex-col gap-1.5">
								<span className="text-xs font-medium text-muted-foreground">
									Needs
								</span>
								<MoneyText
									amount={Math.round(snapshot.needsWants.needs)}
									currency={snapshot.currency}
									className="text-xl font-semibold tabular-nums"
								/>
								<span className="text-xs text-muted-foreground">
									{snapshot.needsWants.percentage.needs}% of total
								</span>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="flex flex-col gap-1.5">
								<span className="text-xs font-medium text-muted-foreground">
									Wants
								</span>
								<MoneyText
									amount={Math.round(snapshot.needsWants.wants)}
									currency={snapshot.currency}
									className="text-xl font-semibold tabular-nums"
								/>
								<span className="text-xs text-muted-foreground">
									{snapshot.needsWants.percentage.wants}% of total
								</span>
							</CardContent>
						</Card>
					</div>
				) : null}

				{snapshot ? (
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Wallet className="size-4 text-muted-foreground" />
								<CardTitle>Top categories</CardTitle>
							</div>
							<CardDescription>
								How your biggest spending lines moved month over month.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{snapshot.topCategories.map((c) => (
									<div
										key={c.categoryId}
										className="flex items-center justify-between text-sm"
									>
										<div className="flex items-center gap-2">
											<span
												className="h-2.5 w-2.5 rounded-full"
												style={{ backgroundColor: c.categoryColor }}
											/>
											<span className="text-foreground">{c.categoryName}</span>
										</div>
										<div className="flex items-center gap-3 tabular-nums">
											<span className="text-muted-foreground">
												{formatCurrency(c.currentTotal, snapshot.currency)}
											</span>
											<Badge
												variant={c.deltaPct >= 0 ? "secondary" : "outline"}
												className="text-xs"
											>
												{c.deltaPct >= 0 ? "+" : ""}
												{c.deltaPct}%
											</Badge>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				) : null}

				{narrative ? (
					<>
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<TrendingUp className="size-4 text-muted-foreground" />
									<CardTitle>Where it went</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed text-foreground">
									{narrative.whereItWent || "The AI didn't write a summary."}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<Sparkles className="size-4 text-muted-foreground" />
									<CardTitle>What changed</CardTitle>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed text-foreground">
									{narrative.whatChanged || "The AI didn't write a summary."}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<div className="flex items-center gap-2">
									<ListChecks className="size-4 text-muted-foreground" />
									<CardTitle>Where you can save</CardTitle>
								</div>
								<CardDescription>
									Practical suggestions based on this month's data.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{narrative.whereToSave.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No suggestions this month.
									</p>
								) : (
									<ul className="space-y-2 text-sm text-foreground">
										{narrative.whereToSave.map((tip) => (
											<li key={tip} className="flex items-start gap-2">
												<span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
												<span>{tip}</span>
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>
					</>
				) : null}
			</div>
		</div>
	);
}

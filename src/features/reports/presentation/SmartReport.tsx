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
//
// If the model declines to write save tips (returns an empty list), we
// derive a minimal set of suggestions locally from the snapshot so the
// third section is never empty.

import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	ArrowDownRight,
	ArrowUpRight,
	Lightbulb,
	ListChecks,
	Minus,
	PiggyBank,
	Sparkles,
	TrendingUp,
	Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
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
import { Label } from "@/components/ui/label";
import { getCurrentMonth } from "@/features/budgets/domain/services";
import { useFormatCurrency } from "@/features/preferences/presentation/useFormatCurrency";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { cn } from "@/lib/utils";
import { loadAiSettingsAsync } from "@/shared/ai/storage";
import { callLlmStructured, LlmError } from "@/shared/llm/client";
import { MoneyText } from "@/shared/ui/MoneyText";
import { MonthPicker } from "@/shared/ui/MonthPicker";
import { PageHeader } from "@/shared/ui/PageHeader";
import { reportRepository } from "../data/repository";
import type {
	CategoryWithDelta,
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
 *
 * The "where_to_save" instructions are deliberately strict. Models
 * sometimes return an empty list when a month looks "all needs, no
 * wants"; we make explicit that they must still produce concrete
 * actionable tips anchored in the categories and amounts above.
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
	lines.push(`Reply with a JSON object with three string fields:`);
	lines.push(
		`- "where_it_went": one short paragraph (2-3 sentences) on where the money went, naming the 2-3 biggest categories by name and amount.`,
	);
	lines.push(
		`- "what_changed": one short paragraph (2-3 sentences) on what changed vs the prior month, including the percentage change and which categories moved the most.`,
	);
	lines.push(
		`- "where_to_save": an array of exactly 3-5 short, concrete, actionable suggestion strings. Each must reference a real category name or amount from the snapshot above. Examples of good tips: "Groceries are up 46% — try a weekly meal plan to cut 10-15%", "Two single rent payments landed in the same month — consider splitting rent across a dedicated pot", "Wants totalled only 7,497.5 BDT, well within a healthy discretionary budget". Avoid generic advice like "spend less".`,
	);
	lines.push(`Rules:`);
	lines.push(
		`- Never return an empty "where_to_save" array. If spending truly looks healthy, say so with one tip that confirms the good behaviour, plus 2-4 forward-looking tips.`,
	);
	lines.push(`- Keep the total response under 260 words.`);
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
	// Accept either an array of strings (the documented shape) or a single
	// string the model occasionally returns as a fallback. Split on newlines
	// or leading bullet markers so the model has leeway.
	const rawTips = obj.where_to_save;
	let whereToSave: string[] = [];
	if (Array.isArray(rawTips)) {
		whereToSave = rawTips
			.filter((s): s is string => typeof s === "string")
			.map((s) => s.trim())
			.filter(Boolean);
	} else if (typeof rawTips === "string") {
		whereToSave = rawTips
			.split(/\r?\n/)
			.map((line) => line.replace(/^\s*[-*•\d.)]\s*/, "").trim())
			.filter(Boolean);
	}
	return { whereItWent, whatChanged, whereToSave };
}

/**
 * Snapshot-derived save tips used as a fallback when the model returns
 * an empty list. Each tip names a real category and is anchored in a
 * concrete number, so it stays useful even without LLM narration.
 */
function deriveSaveTips(snapshot: MonthlyInsightsSnapshot): string[] {
	const tips: string[] = [];
	const totalNonZero = snapshot.total > 0;
	const fmtAmount = (n: number) => `${n.toFixed(0)} ${snapshot.currency}`;
	const largeUp = snapshot.topCategories
		.filter((c) => c.deltaPct >= 20 && c.currentTotal > 0)
		.sort((a, b) => b.deltaPct - a.deltaPct);
	for (const c of largeUp.slice(0, 2)) {
		const sign = c.deltaPct > 0 ? "up" : "down";
		tips.push(
			`${c.categoryName} is ${sign} ${Math.abs(c.deltaPct)}% this month at ${fmtAmount(c.currentTotal)} — set a soft cap and review the next 4 weeks.`,
		);
	}
	const largeDown = snapshot.topCategories
		.filter((c) => c.deltaPct <= -20 && c.priorTotal > 0)
		.sort((a, b) => a.deltaPct - b.deltaPct);
	if (largeDown.length > 0) {
		const c = largeDown[0];
		tips.push(
			`${c.categoryName} fell ${Math.abs(c.deltaPct)}% to ${fmtAmount(c.currentTotal)} — if intentional, lock the lower baseline as a recurring target.`,
		);
	}
	const wantsPct = snapshot.needsWants.percentage.wants;
	if (totalNonZero && wantsPct >= 30) {
		tips.push(
			`Wants make up ${wantsPct}% of this month (${fmtAmount(snapshot.needsWants.wants)}). Try a 2-week pause on the largest want before the next month.`,
		);
	} else if (totalNonZero && wantsPct <= 15 && snapshot.total > 0) {
		tips.push(
			`Wants are only ${wantsPct}% of spending — strong discretionary control. Keep this cadence.`,
		);
	}
	const outlier = snapshot.largestExpenses[0];
	if (
		outlier &&
		snapshot.total > 0 &&
		outlier.amount / snapshot.total >= 0.25
	) {
		tips.push(
			`The single largest expense (${fmtAmount(outlier.amount)} on ${outlier.date}, ${outlier.categoryName}) is over a quarter of the month. Plan a buffer so it doesn't surprise you next time.`,
		);
	}
	if (tips.length === 0 && snapshot.total > 0) {
		tips.push(
			`Spending is steady and well-distributed. Keep logging expenses so the next month's deltas are easy to read.`,
		);
	}
	return tips;
}

function monthValid(month: string): boolean {
	return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

// ---- Visual building blocks ----------------------------------------------

type SectionTone = "sky" | "amber" | "emerald";

const TONE_CLASSES: Record<
	SectionTone,
	{ ring: string; tile: string; chip: string; dot: string; text: string }
> = {
	sky: {
		ring: "ring-sky-500/20",
		tile: "bg-gradient-to-br from-sky-500/15 to-sky-500/0 text-sky-600 dark:text-sky-400",
		chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
		dot: "bg-sky-500",
		text: "text-sky-700 dark:text-sky-300",
	},
	amber: {
		ring: "ring-amber-500/20",
		tile: "bg-gradient-to-br from-amber-500/20 to-amber-500/0 text-amber-600 dark:text-amber-400",
		chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
		dot: "bg-amber-500",
		text: "text-amber-700 dark:text-amber-300",
	},
	emerald: {
		ring: "ring-emerald-500/20",
		tile: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/0 text-emerald-600 dark:text-emerald-400",
		chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
		dot: "bg-emerald-500",
		text: "text-emerald-700 dark:text-emerald-300",
	},
};

function DeltaPill({ pct }: { pct: number }) {
	if (pct === 0) {
		return (
			<Badge variant="outline" className="gap-1 border-border/60 text-xs">
				<Minus className="size-3" />
				No change
			</Badge>
		);
	}
	const up = pct > 0;
	return (
		<Badge
			variant="outline"
			className={cn(
				"gap-1 text-xs",
				up
					? "border-amber-500/40 text-amber-700 dark:text-amber-400"
					: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
			)}
		>
			{up ? (
				<ArrowUpRight className="size-3" />
			) : (
				<ArrowDownRight className="size-3" />
			)}
			{pct > 0 ? "+" : ""}
			{pct}%
		</Badge>
	);
}

function SectionCard({
	index,
	tone,
	icon: Icon,
	title,
	eyebrow,
	children,
	footer,
}: {
	index: number;
	tone: SectionTone;
	icon: typeof Wallet;
	title: string;
	eyebrow: string;
	children: ReactNode;
	footer?: ReactNode;
}) {
	const t = TONE_CLASSES[tone];
	return (
		<Card
			className={cn(
				"relative overflow-hidden ring-1 ring-inset transition-shadow",
				t.ring,
			)}
		>
			<span
				aria-hidden
				className={cn(
					"pointer-events-none absolute inset-y-0 left-0 w-1",
					t.dot,
				)}
			/>
			<CardHeader className="pb-3">
				<div className="flex items-center gap-3">
					<span
						className={cn(
							"flex size-10 items-center justify-center rounded-xl ring-1 ring-inset ring-border/40",
							t.tile,
						)}
					>
						<Icon className="size-5" />
					</span>
					<div className="flex flex-col gap-0.5">
						<span
							className={cn(
								"text-[10px] font-semibold tracking-[0.18em] uppercase",
								t.text,
							)}
						>
							{eyebrow}
						</span>
						<CardTitle className="text-lg">{title}</CardTitle>
					</div>
					<span
						className={cn(
							"ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
							t.chip,
						)}
					>
						0{index}
					</span>
				</div>
			</CardHeader>
			<CardContent>{children}</CardContent>
			{footer ? (
				<div className="mt-4 border-t border-border/60 px-6 pt-3 pb-2">
					{footer}
				</div>
			) : null}
		</Card>
	);
}

function KeyChips({
	items,
	tone,
}: {
	items: Array<{ label: string; value: string }>;
	tone: SectionTone;
}) {
	if (items.length === 0) return null;
	const t = TONE_CLASSES[tone];
	return (
		<div className="mt-4 flex flex-wrap gap-2">
			{items.map((it) => (
				<span
					key={`${it.label}-${it.value}`}
					className={cn(
						"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
						t.chip,
					)}
				>
					<span className="opacity-70">{it.label}</span>
					<span className="font-semibold tabular-nums">{it.value}</span>
				</span>
			))}
		</div>
	);
}

function TipCard({
	tip,
	tone,
	index,
}: {
	tip: string;
	tone: SectionTone;
	index: number;
}) {
	const t = TONE_CLASSES[tone];
	return (
		<div className="group relative flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3 transition-colors hover:bg-accent/30">
			<span
				aria-hidden
				className={cn("absolute inset-y-2 left-0 w-0.5 rounded-full", t.dot)}
			/>
			<span
				className={cn(
					"mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums",
					t.chip,
				)}
			>
				{index + 1}
			</span>
			<span
				className={cn(
					"flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-border/40",
					t.tile,
				)}
				aria-hidden
			>
				<PiggyBank className="size-4" />
			</span>
			<p className="text-sm leading-relaxed text-foreground">{tip}</p>
		</div>
	);
}

// ---- Main component ------------------------------------------------------

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

	// Snapshot-derived values used by the rich section cards.
	const topCat = snapshot?.topCategories[0];
	const wantsCat = snapshot?.topCategories.find((c: CategoryWithDelta) =>
		c.categoryName.toLowerCase().includes("want"),
	);
	const saveTips =
		narrative && narrative.whereToSave.length > 0
			? narrative.whereToSave
			: snapshot
				? deriveSaveTips(snapshot)
				: [];

	const headlineChips = snapshot
		? [
				{
					label: "Total",
					value: `${snapshot.total.toFixed(0)} ${snapshot.currency}`,
				},
				{
					label: "Prior",
					value: `${snapshot.priorTotal.toFixed(0)} ${snapshot.currency}`,
				},
				{
					label: "Categories",
					value: String(snapshot.topCategories.length),
				},
				{
					label: "Largest expense",
					value: snapshot.largestExpenses[0]
						? `${snapshot.largestExpenses[0].amount.toFixed(0)} ${snapshot.currency}`
						: "—",
				},
			]
		: [];

	const wentChips = topCat
		? [
				{ label: "Biggest", value: topCat.categoryName },
				{
					label: "Amount",
					value: `${topCat.currentTotal.toFixed(0)} ${snapshot?.currency ?? ""}`,
				},
				{
					label: "Share",
					value:
						snapshot && snapshot.total > 0
							? `${Math.round((topCat.currentTotal / snapshot.total) * 100)}%`
							: "—",
				},
			]
		: [];

	const changedChips = [
		{
			label: "MoM",
			value:
				snapshot?.deltaPct === undefined
					? "—"
					: `${snapshot.deltaPct > 0 ? "+" : ""}${snapshot.deltaPct}%`,
		},
		{
			label: "Δ Needs",
			value: snapshot ? `${snapshot.needsWants.needs.toFixed(0)}` : "—",
		},
		{
			label: "Δ Wants",
			value: snapshot ? `${snapshot.needsWants.wants.toFixed(0)}` : "—",
		},
		...(wantsCat
			? [{ label: "Top mover", value: wantsCat.categoryName }]
			: snapshot?.topCategories[1]
				? [
						{
							label: "Top mover",
							value: snapshot.topCategories[1].categoryName,
						},
					]
				: []),
	];

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
							<Label>Month</Label>
							<MonthPicker
								value={month}
								onChange={setMonth}
								maxYear={new Date().getFullYear()}
								aria-label="Month"
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
					<>
						{/* Hero strip: month, total, MoM delta, headline chips. */}
						<Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
							<CardHeader className="pb-2">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<CardDescription className="text-xs uppercase tracking-[0.16em]">
											Report for
										</CardDescription>
										<CardTitle className="text-2xl">
											{formatMonth(snapshot.month)}
										</CardTitle>
									</div>
									<DeltaPill pct={snapshot.deltaPct} />
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap items-baseline gap-3">
									<MoneyText
										amount={Math.round(snapshot.total)}
										currency={snapshot.currency}
										className="text-3xl font-bold tabular-nums"
									/>
									<span className="text-sm text-muted-foreground">
										spent this month
									</span>
								</div>
								<KeyChips items={headlineChips} tone="sky" />
							</CardContent>
						</Card>

						<div className="grid gap-4 sm:grid-cols-3">
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
							<Card>
								<CardContent className="flex flex-col gap-1.5">
									<span className="text-xs font-medium text-muted-foreground">
										Transactions
									</span>
									<span className="text-xl font-semibold tabular-nums">
										{snapshot.topCategories.reduce(
											(acc: number, c: CategoryWithDelta) => acc + c.count,
											0,
										)}
									</span>
									<span className="text-xs text-muted-foreground">
										across top categories
									</span>
								</CardContent>
							</Card>
						</div>
					</>
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
						<SectionCard
							index={1}
							tone="sky"
							icon={TrendingUp}
							eyebrow="Snapshot"
							title="Where it went"
						>
							<p className="text-sm leading-relaxed text-foreground">
								{narrative.whereItWent || "The AI didn't write a summary."}
							</p>
							<KeyChips items={wentChips} tone="sky" />
						</SectionCard>

						<SectionCard
							index={2}
							tone="amber"
							icon={Sparkles}
							eyebrow="Movement"
							title="What changed"
						>
							<p className="text-sm leading-relaxed text-foreground">
								{narrative.whatChanged || "The AI didn't write a summary."}
							</p>
							<KeyChips items={changedChips} tone="amber" />
						</SectionCard>

						<SectionCard
							index={3}
							tone="emerald"
							icon={ListChecks}
							eyebrow="Action"
							title="Where you can save"
							footer={
								<p className="text-xs text-muted-foreground">
									Concrete tips anchored in this month's numbers. Open{" "}
									<Link
										to="/expenses"
										className="font-medium text-foreground underline-offset-4 hover:underline"
									>
										Expenses
									</Link>{" "}
									to act on any of them.
								</p>
							}
						>
							{saveTips.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									No suggestions this month.
								</p>
							) : (
								<div className="grid gap-2.5">
									{saveTips.map((tip, idx) => (
										<TipCard
											// Tip text is unique by construction: deriveSaveTips is
											// a pure function over an immutable snapshot and each
											// branch references a distinct category / amount.
											key={tip}
											tip={tip}
											tone="emerald"
											index={idx}
										/>
									))}
								</div>
							)}
						</SectionCard>
					</>
				) : null}
			</div>
		</div>
	);
}

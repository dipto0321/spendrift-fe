import { cn } from "@/lib/utils";
import { MoneyText } from "./MoneyText";

type BudgetProgressKind = "spending" | "savings";

interface BudgetProgressProps {
	label: string;
	budget: number;
	actual: number;
	currency: string;
	className?: string;
	/**
	 * `spending` (default) — exceeding `budget` is bad and renders the bar in
	 * destructive red. `savings` — exceeding `budget` is good; the bar fills
	 * to 100% and the label celebrates hitting/passing the goal instead of
	 * flagging it as over budget.
	 */
	kind?: BudgetProgressKind;
}

function getState(
	pct: number,
	kind: BudgetProgressKind,
): "under" | "warning" | "over" {
	if (kind === "savings") {
		// For savings, hitting 100% is the best outcome — not "over".
		if (pct >= 100) return "under";
		if (pct >= 80) return "warning";
		return "under";
	}
	if (pct >= 100) return "over";
	if (pct >= 80) return "warning";
	return "under";
}

export function BudgetProgress({
	label,
	budget,
	actual,
	currency,
	className,
	kind = "spending",
}: BudgetProgressProps) {
	const pct = budget > 0 ? (actual / budget) * 100 : 0;
	const state = getState(pct, kind);
	// Spending caps at 100% — we don't want a 200% overspend to fill the
	// bar past the edge. Savings also caps at 100% visually, but a >100%
	// value still renders the "Goal hit" state instead of "Over budget".
	const clamped = Math.min(pct, 100);
	const passedGoal = kind === "savings" && pct >= 100;

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex items-baseline justify-between gap-2">
				<span className="text-sm font-medium text-foreground">{label}</span>
				<span className="text-sm tabular-nums text-muted-foreground">
					<MoneyText
						amount={actual}
						currency={currency}
						className="text-foreground"
					/>
					{" / "}
					<MoneyText amount={budget} currency={currency} />
				</span>
			</div>
			<div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
				<div
					className={cn(
						"h-full rounded-full transition-all",
						state === "under" && "bg-success",
						state === "warning" && "bg-warning",
						state === "over" && "bg-destructive",
					)}
					style={{ width: `${clamped}%` }}
				/>
			</div>
			<div className="flex items-center justify-between">
				<span
					className={cn(
						"text-xs font-medium",
						state === "under" &&
							(kind === "savings" ? "text-success" : "text-muted-foreground"),
						state === "warning" && "text-warning-foreground dark:text-warning",
						state === "over" && "text-destructive",
					)}
				>
					{kind === "savings"
						? passedGoal
							? "Goal hit"
							: state === "warning"
								? "Almost there"
								: "Behind on goal"
						: state === "over"
							? "Over budget"
							: state === "warning"
								? "Approaching limit"
								: "Under budget"}
				</span>
				<span className="text-xs tabular-nums text-muted-foreground">
					{Math.round(pct)}%
				</span>
			</div>
		</div>
	);
}

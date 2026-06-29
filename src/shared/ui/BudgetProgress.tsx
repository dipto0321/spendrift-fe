import { cn } from "@/lib/utils";
import { MoneyText } from "./MoneyText";

interface BudgetProgressProps {
	label: string;
	budget: number;
	actual: number;
	currency: string;
	className?: string;
}

function getState(pct: number): "under" | "warning" | "over" {
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
}: BudgetProgressProps) {
	const pct = budget > 0 ? (actual / budget) * 100 : 0;
	const state = getState(pct);
	const clamped = Math.min(pct, 100);

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
						state === "under" && "text-muted-foreground",
						state === "warning" &&
							"text-warning-foreground dark:text-warning",
						state === "over" && "text-destructive",
					)}
				>
					{state === "over"
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

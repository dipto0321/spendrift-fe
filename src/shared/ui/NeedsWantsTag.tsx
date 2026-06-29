import { cn } from "@/lib/utils";
import type { ExpenseType } from "@/features/expenses/domain/types";

export function NeedsWantsTag({
	type,
	className,
}: {
	type: ExpenseType;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
				type === "need"
					? "bg-secondary text-secondary-foreground"
					: "bg-accent text-accent-foreground",
				className,
			)}
		>
			<span
				className={cn(
					"size-1.5 rounded-full",
					type === "need" ? "bg-muted-foreground" : "bg-primary",
				)}
			/>
			{type === "need" ? "Need" : "Want"}
		</span>
	);
}

import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavingsHealth } from "@/features/budgets/domain/types";

const CONFIG: Record<
	SavingsHealth,
	{ label: string; icon: typeof ShieldCheck; className: string }
> = {
	green: {
		label: "On track",
		icon: ShieldCheck,
		className: "bg-success/15 text-success",
	},
	yellow: {
		label: "Tight",
		icon: ShieldAlert,
		className: "bg-warning/15 text-warning-foreground dark:text-warning",
	},
	red: {
		label: "Off target",
		icon: ShieldX,
		className: "bg-destructive/15 text-destructive",
	},
};

export function SavingsHealthBadge({
	health,
	className,
}: {
	health: SavingsHealth;
	className?: string;
}) {
	const { label, icon: Icon, className: tone } = CONFIG[health];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
				tone,
				className,
			)}
		>
			<Icon className="size-3.5" />
			{label}
		</span>
	);
}

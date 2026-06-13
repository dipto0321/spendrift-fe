import { Badge } from "@/components/ui/badge";
import {
	getHealthBgColor,
	getHealthColor,
	getHealthLabel,
} from "../domain/services";
import type { SavingsHealth } from "../domain/types";

type SavingsHealthBadgeProps = {
	health: SavingsHealth;
};

const dotColor: Record<SavingsHealth, string> = {
	green: "bg-green-500",
	yellow: "bg-yellow-500",
	red: "bg-red-500",
};

export function SavingsHealthBadge({ health }: SavingsHealthBadgeProps) {
	return (
		<Badge
			variant="outline"
			className={`gap-1.5 border-transparent px-2.5 py-1 font-semibold ${getHealthBgColor(health)} ${getHealthColor(health)}`}
		>
			<span className={`h-2 w-2 rounded-full ${dotColor[health]}`} />
			{getHealthLabel(health)}
		</Badge>
	);
}

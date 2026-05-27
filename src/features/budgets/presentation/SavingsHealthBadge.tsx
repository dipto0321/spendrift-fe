import {
	getHealthBgColor,
	getHealthColor,
	getHealthLabel,
} from "../domain/services";
import type { SavingsHealth } from "../domain/types";

type SavingsHealthBadgeProps = {
	health: SavingsHealth;
};

export function SavingsHealthBadge({ health }: SavingsHealthBadgeProps) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getHealthBgColor(health)} ${getHealthColor(health)}`}
		>
			<span
				className={`h-2 w-2 rounded-full ${
					health === "green"
						? "bg-green-500"
						: health === "yellow"
							? "bg-yellow-500"
							: "bg-red-500"
				}`}
			/>
			{getHealthLabel(health)}
		</span>
	);
}

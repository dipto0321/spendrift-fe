import { Badge } from "@/components/ui/badge";
import type { CategoryColor } from "../domain/types";

type CategoryChipProps = {
	name: string;
	color: CategoryColor;
	size?: "sm" | "md";
};

export function CategoryChip({
	name,
	color,
	size = "md",
}: Readonly<CategoryChipProps>) {
	return (
		<Badge
			variant="outline"
			className={`gap-1.5 font-medium ${
				size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
			}`}
			style={{
				color: color,
				backgroundColor: `${color}18`,
				borderColor: `${color}40`,
			}}
		>
			<span
				className="h-1.5 w-1.5 shrink-0 rounded-full"
				style={{ backgroundColor: color }}
			/>
			{name}
		</Badge>
	);
}

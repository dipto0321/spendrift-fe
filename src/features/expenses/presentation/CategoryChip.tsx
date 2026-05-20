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
}: CategoryChipProps) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${
				size === "sm"
					? "px-2 py-0.5 text-[10px]"
					: "px-2.5 py-1 text-xs"
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
		</span>
	);
}
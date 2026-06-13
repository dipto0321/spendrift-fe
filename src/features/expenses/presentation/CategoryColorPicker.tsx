import type { CategoryColor } from "../domain/types";
import { CATEGORY_COLORS } from "../domain/types";

type CategoryColorPickerProps = {
	value: CategoryColor;
	onChange: (color: CategoryColor) => void;
};

export function CategoryColorPicker({
	value,
	onChange,
}: CategoryColorPickerProps) {
	return (
		<div className="grid grid-cols-6 gap-2">
			{CATEGORY_COLORS.map((color) => (
				<button
					key={color}
					type="button"
					title={color}
					onClick={() => onChange(color)}
					className={`h-7 w-7 rounded-full transition-all duration-150 ${
						value === color
							? "scale-110 ring-2 ring-offset-2 ring-offset-background"
							: "hover:scale-105"
					}`}
					style={{
						backgroundColor: color,
						...(value === color && {
							"--tw-ring-color": color,
						}),
					}}
					aria-label={`Select color ${color}`}
					aria-pressed={value === color}
				/>
			))}
		</div>
	);
}

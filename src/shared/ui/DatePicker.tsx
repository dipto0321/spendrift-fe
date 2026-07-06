import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	"aria-label"?: string;
	className?: string;
};

// Parses/formats using the date's own calendar fields (not UTC) so a
// "YYYY-MM-DD" string round-trips to the same day regardless of timezone.
export function parseDateValue(value?: string): Date | undefined {
	if (!value) return undefined;
	const [year, month, day] = value.split("-").map(Number);
	if (!year || !month || !day) return undefined;
	return new Date(year, month - 1, day);
}

export function formatDateValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function formatDateLabel(date: Date): string {
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function DatePicker({
	value,
	onChange,
	placeholder = "Pick a date",
	disabled,
	className,
	...ariaProps
}: Readonly<DatePickerProps>) {
	const selected = parseDateValue(value);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					disabled={disabled}
					aria-label={ariaProps["aria-label"]}
					className={cn(
						"w-full justify-start text-left font-normal",
						!selected && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="size-4" />
					{selected ? formatDateLabel(selected) : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={(date) => date && onChange(formatDateValue(date))}
					autoFocus
				/>
			</PopoverContent>
		</Popover>
	);
}

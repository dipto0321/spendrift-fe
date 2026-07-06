import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateLabel, formatDateValue, parseDateValue } from "./DatePicker";

type DateRangeValue = {
	start?: string;
	end?: string;
};

type DateRangePickerProps = {
	value?: DateRangeValue;
	onChange: (value: DateRangeValue) => void;
	placeholder?: string;
	className?: string;
	"aria-label"?: string;
};

export function DateRangePicker({
	value,
	onChange,
	placeholder = "Pick a date range",
	className,
	...ariaProps
}: Readonly<DateRangePickerProps>) {
	const from = parseDateValue(value?.start);
	const to = parseDateValue(value?.end);

	// Closes only via "Done"/"Clear" or clicking outside — never auto-closes
	// on the 2nd date click. react-day-picker's range onSelect can't reliably
	// tell "just completed a fresh range" from "reselecting an already-complete
	// one", which made auto-close fire at the wrong times.
	const [open, setOpen] = useState(false);

	let label = placeholder;
	if (from && to) {
		label = `${formatDateLabel(from)} – ${formatDateLabel(to)}`;
	} else if (from) {
		label = `${formatDateLabel(from)} – …`;
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					aria-label={ariaProps["aria-label"]}
					className={cn(
						"justify-start text-left font-normal",
						!from && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="size-4" />
					{label}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="range"
					selected={{ from, to }}
					onSelect={(range) =>
						onChange({
							start: range?.from ? formatDateValue(range.from) : undefined,
							end: range?.to ? formatDateValue(range.to) : undefined,
						})
					}
					numberOfMonths={2}
					autoFocus
				/>
				<div className="flex justify-end gap-2 border-t border-border p-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!from && !to}
						onClick={() => {
							onChange({ start: undefined, end: undefined });
							setOpen(false);
						}}
					>
						Clear
					</Button>
					<Button type="button" size="sm" onClick={() => setOpen(false)}>
						Done
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}

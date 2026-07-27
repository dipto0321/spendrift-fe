// Month-only picker styled to match the project's existing DatePicker:
//   - same Popover + outline Button + CalendarIcon trigger shape
//   - same display label format ("June 2026")
//   - same "YYYY-MM" string contract as <input type="month">
//
// The popover body is a custom 12-month grid (react-day-picker v10 has no
// native month-only mode). Year navigation is a pair of chevron buttons
// matching the Calendar's chevrons.

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

export const FULL_MONTH_LABELS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const;

type MonthPickerProps = {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	"aria-label"?: string;
	className?: string;
	// Optional earliest year shown in the year nav. Omit for no lower cap.
	minYear?: number;
	// Optional latest year shown in the year nav. Omit for no upper cap.
	maxYear?: number;
};

// Parse "YYYY-MM" (1-indexed month) → { year, month: 1-12 }. Returns null
// for empty or malformed input so callers can treat invalid state as
// "no selection".
export function parseMonthValue(
	value?: string,
): { year: number; month: number } | null {
	if (!value) return null;
	const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
	if (!m) return null;
	return { year: Number(m[1]), month: Number(m[2]) };
}

export function formatMonthValue(year: number, month: number): string {
	const mm = String(month).padStart(2, "0");
	return `${year}-${mm}`;
}

export function formatMonthLabel(year: number, month: number): string {
	const date = new Date(year, month - 1, 1);
	return date.toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
	});
}

const CURRENT_YEAR = new Date().getFullYear();

export function MonthPicker({
	value,
	onChange,
	placeholder = "Pick a month",
	disabled,
	className,
	minYear,
	maxYear,
	...ariaProps
}: Readonly<MonthPickerProps>) {
	const parsed = parseMonthValue(value);
	const initialYear = parsed?.year ?? CURRENT_YEAR;
	// The visible year starts at `value`'s year if present (so opening the
	// popover lands on the selected month), otherwise the current year.
	const [viewYear, setViewYear] = useState<number>(initialYear);

	// No bound → no cap. With both bounds specified the nav buttons
	// disable at the edges, matching react-day-picker's behaviour.
	const canGoPrev = minYear === undefined || viewYear > minYear;
	const canGoNext = maxYear === undefined || viewYear < maxYear;

	const selectedMonth = parsed?.month;
	const selectedYear = parsed?.year;
	const label = parsed
		? formatMonthLabel(parsed.year, parsed.month)
		: placeholder;

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
						!parsed && "text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="size-4" />
					{label}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-3" align="start">
				<div className="flex items-center justify-between gap-1 pb-3">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => canGoPrev && setViewYear((y) => y - 1)}
						disabled={!canGoPrev}
						aria-label="Previous year"
						className="size-8"
					>
						<ChevronLeftIcon className="size-4" />
					</Button>
					<span
						className="text-sm font-medium"
						aria-live="polite"
						aria-atomic="true"
					>
						{viewYear}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => canGoNext && setViewYear((y) => y + 1)}
						disabled={!canGoNext}
						aria-label="Next year"
						className="size-8"
					>
						<ChevronRightIcon className="size-4" />
					</Button>
				</div>
				<fieldset
					className="m-0 grid grid-cols-3 gap-2 border-0 p-0"
					aria-label={`Months in ${viewYear}`}
				>
					{MONTH_LABELS.map((short, idx) => {
						const monthNumber = idx + 1;
						const isSelected =
							selectedMonth === monthNumber && selectedYear === viewYear;
						return (
							<Button
								key={short}
								type="button"
								variant={isSelected ? "default" : "ghost"}
								size="sm"
								aria-pressed={isSelected}
								aria-label={FULL_MONTH_LABELS[idx]}
								onClick={() =>
									onChange(formatMonthValue(viewYear, monthNumber))
								}
								className={cn(
									"h-9 px-2 text-sm font-normal",
									!isSelected && "hover:bg-accent hover:text-accent-foreground",
								)}
							>
								{short}
							</Button>
						);
					})}
				</fieldset>
			</PopoverContent>
		</Popover>
	);
}

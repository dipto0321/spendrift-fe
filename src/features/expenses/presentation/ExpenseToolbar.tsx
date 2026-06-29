import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getThisMonthRange,
	getTodayRange,
	isSameDateRange,
} from "../domain/services";
import type { Category, ExpenseFilter, ExpenseType } from "../domain/types";

type ExpenseToolbarProps = {
	filter: ExpenseFilter;
	categories: Category[];
	onFilterChange: (filter: ExpenseFilter) => void;
};

export function ExpenseToolbar({
	filter,
	categories,
	onFilterChange,
}: Readonly<ExpenseToolbarProps>) {
	function updateFilter(patch: Partial<ExpenseFilter>) {
		onFilterChange({ ...filter, ...patch });
	}

	function clearFilter() {
		onFilterChange({ dateRange: getTodayRange() });
	}

	function setQuickRange(dateRange: ExpenseFilter["dateRange"]) {
		onFilterChange({ ...filter, dateRange });
	}

	const todayRange = getTodayRange();
	const thisMonthRange = getThisMonthRange();
	const isTodaySelected = isSameDateRange(filter.dateRange, todayRange);
	const isThisMonthSelected = isSameDateRange(filter.dateRange, thisMonthRange);

	const hasActiveFilters =
		filter.search ||
		!isTodaySelected ||
		(filter.categoryIds && filter.categoryIds.length > 0) ||
		(filter.types && filter.types.length > 0);

	const userCategories = categories.filter((c) => c.name !== "Uncategorized");

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
				<div className="relative flex-1 sm:max-w-xs">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search expenses..."
						value={filter.search ?? ""}
						onChange={(e) =>
							updateFilter({ search: e.target.value || undefined })
						}
						className="pl-9"
						aria-label="Search expenses"
					/>
				</div>
				<Select
					value={filter.categoryIds?.[0] ?? "all"}
					onValueChange={(v) => {
						if (v === "all") updateFilter({ categoryIds: undefined });
						else updateFilter({ categoryIds: [v] });
					}}
				>
					<SelectTrigger className="h-9 sm:w-40" aria-label="Filter by category">
						<SelectValue placeholder="All categories" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All categories</SelectItem>
						{userCategories.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={(filter.types?.[0] ?? "all") as string}
					onValueChange={(v) => {
						if (v === "all") updateFilter({ types: undefined });
						else updateFilter({ types: [v as ExpenseType] });
					}}
				>
					<SelectTrigger className="h-9 sm:w-36" aria-label="Filter by type">
						<SelectValue placeholder="Needs & Wants" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Needs & Wants</SelectItem>
						<SelectItem value="need">Needs</SelectItem>
						<SelectItem value="want">Wants</SelectItem>
					</SelectContent>
				</Select>
				<div className="flex items-center gap-1.5">
					<Input
						type="date"
						title="From date"
						value={filter.dateRange?.start ?? ""}
						onChange={(e) =>
							updateFilter({
								dateRange: {
									start: e.target.value || undefined,
									end: filter.dateRange?.end,
								},
							})
						}
					/>
					<span className="text-muted-foreground">—</span>
					<Input
						type="date"
						title="To date"
						value={filter.dateRange?.end ?? ""}
						onChange={(e) =>
							updateFilter({
								dateRange: {
									start: filter.dateRange?.start,
									end: e.target.value || undefined,
								},
							})
						}
					/>
				</div>
				{hasActiveFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilter}
						className="flex items-center gap-1"
					>
						<X className="size-4" />
						Clear
					</Button>
				)}
			</div>
		</div>
	);
}
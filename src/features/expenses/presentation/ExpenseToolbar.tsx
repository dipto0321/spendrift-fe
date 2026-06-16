import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
	onAddExpense: () => void;
};

export function ExpenseToolbar({
	filter,
	categories,
	onFilterChange,
	onAddExpense,
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

	// Quick-range toggle value; empty when a custom date range is active.
	let activeQuickRange = "";
	if (isTodaySelected) activeQuickRange = "today";
	else if (isThisMonthSelected) activeQuickRange = "month";

	const hasActiveFilters =
		filter.search ||
		!isTodaySelected ||
		(filter.categoryIds && filter.categoryIds.length > 0) ||
		(filter.types && filter.types.length > 0);

	const userCategories = categories.filter((c) => c.name !== "Uncategorized");

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative flex-1 min-w-50">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search expenses…"
						value={filter.search ?? ""}
						onChange={(e) =>
							updateFilter({ search: e.target.value || undefined })
						}
						className="pl-9"
					/>
				</div>

				<ToggleGroup
					type="single"
					value={activeQuickRange}
					onValueChange={(value) => {
						if (value === "today") setQuickRange(todayRange);
						else if (value === "month") setQuickRange(thisMonthRange);
					}}
					className="rounded-full border border-border/60 bg-muted/30 p-1"
				>
					<ToggleGroupItem
						value="today"
						className="rounded-full px-2.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
					>
						Today
					</ToggleGroupItem>
					<ToggleGroupItem
						value="month"
						className="rounded-full px-2.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
					>
						This month
					</ToggleGroupItem>
				</ToggleGroup>

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

				<div className="flex flex-wrap items-center gap-1.5">
					<ToggleGroup
						type="multiple"
						value={filter.types ?? []}
						onValueChange={(value) =>
							updateFilter({
								types: value.length > 0 ? (value as ExpenseType[]) : undefined,
							})
						}
						className="flex items-center gap-1"
					>
						<ToggleGroupItem
							value="need"
							className="rounded-full px-2.5 py-0.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
						>
							Need
						</ToggleGroupItem>
						<ToggleGroupItem
							value="want"
							className="rounded-full px-2.5 py-0.5 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
						>
							Want
						</ToggleGroupItem>
					</ToggleGroup>

					{userCategories.map((cat) => {
						const isActive = filter.categoryIds?.includes(cat.id) ?? false;
						return (
							<Button
								key={cat.id}
								variant={isActive ? "default" : "ghost"}
								size="sm"
								onClick={() => {
									const current = filter.categoryIds ?? [];
									const updated = isActive
										? current.filter((id) => id !== cat.id)
										: [...current, cat.id];
									updateFilter({
										categoryIds: updated.length > 0 ? updated : undefined,
									});
								}}
								className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isActive ? "" : "text-muted-foreground"}`}
							>
								{cat.name}
							</Button>
						);
					})}
				</div>

				{hasActiveFilters && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={clearFilter}
						className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
					>
						<X className="h-3 w-3" />
						Clear
					</Button>
				)}

				<Button
					type="button"
					onClick={onAddExpense}
					className="ml-auto flex items-center gap-1.5"
				>
					<Plus className="h-4 w-4" />
					Add Expense
				</Button>
			</div>
		</div>
	);
}

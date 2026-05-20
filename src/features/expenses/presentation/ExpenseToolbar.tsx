import { Plus, Search, X } from "lucide-react";
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
}: ExpenseToolbarProps) {
	function updateFilter(patch: Partial<ExpenseFilter>) {
		onFilterChange({ ...filter, ...patch });
	}

	function toggleType(type: ExpenseType) {
		const current = filter.types ?? [];
		const updated = current.includes(type)
			? current.filter((t) => t !== type)
			: [...current, type];
		updateFilter({ types: updated.length > 0 ? updated : undefined });
	}

	function clearFilter() {
		onFilterChange({});
	}

	const hasActiveFilters =
		filter.search ||
		filter.dateRange ||
		(filter.categoryIds && filter.categoryIds.length > 0) ||
		(filter.types && filter.types.length > 0);

	const userCategories = categories.filter((c) => c.id !== "uncategorized");

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="search"
						placeholder="Search expenses…"
						value={filter.search ?? ""}
						onChange={(e) => updateFilter({ search: e.target.value || undefined })}
						className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
				</div>

				<div className="flex items-center gap-1.5">
					<input
						type="date"
						title="From date"
						value={filter.dateRange?.start ?? ""}
						onChange={(e) =>
							updateFilter({
								dateRange: {
									start: e.target.value,
									end: filter.dateRange?.end ?? "9999-12-31",
								},
							})
						}
						className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
					<span className="text-muted-foreground">—</span>
					<input
						type="date"
						title="To date"
						value={filter.dateRange?.end ?? ""}
						onChange={(e) =>
							updateFilter({
								dateRange: {
									start: filter.dateRange?.start ?? "1970-01-01",
									end: e.target.value,
								},
							})
						}
						className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					{userCategories.map((cat) => {
						const isActive =
							filter.categoryIds?.includes(cat.id) ?? false;
						return (
							<button
								key={cat.id}
								type="button"
								onClick={() => {
									const current = filter.categoryIds ?? [];
									const updated = isActive
										? current.filter((id) => id !== cat.id)
										: [...current, cat.id];
									updateFilter({
										categoryIds: updated.length > 0 ? updated : undefined,
									});
								}}
								className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
									isActive
										? "border-primary/50 bg-primary/10 text-primary"
										: "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
								}`}
							>
								{cat.name}
							</button>
						);
					})}
				</div>

				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => toggleType("need")}
						className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
							filter.types?.includes("need")
								? "border-green-500/50 bg-green-500/15 text-green-600 dark:text-green-400"
								: "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
						}`}
					>
						Need
					</button>
					<button
						type="button"
						onClick={() => toggleType("want")}
						className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
							filter.types?.includes("want")
								? "border-orange-500/50 bg-orange-500/15 text-orange-600 dark:text-orange-400"
								: "border-border bg-card text-muted-foreground hover:border-muted-foreground/50"
						}`}
					>
						Want
					</button>
				</div>

				{hasActiveFilters && (
					<button
						type="button"
						onClick={clearFilter}
						className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-all"
					>
						<X className="h-3 w-3" />
						Clear
					</button>
				)}

				<button
					type="button"
					onClick={onAddExpense}
					className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="h-4 w-4" />
					Add Expense
				</button>
			</div>
		</div>
	);
}
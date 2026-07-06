import { ArrowUpDown, Receipt, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/shared/ui/EmptyState";
import { buildCategoryMap } from "../domain/services";
import type { Category, Expense } from "../domain/types";
import { ExpenseRow } from "./ExpenseRow";

export type SortKey = "date" | "category" | "description" | "amount";
export type SortState = { key: SortKey; dir: "asc" | "desc" };

type SortHeaderProps = {
	readonly label: string;
	readonly sortKey: SortKey;
	readonly sort: SortState;
	readonly onSort: (key: SortKey) => void;
	readonly className?: string;
};

function SortHeader({ label, sortKey, sort, onSort, className }: SortHeaderProps) {
	const active = sort.key === sortKey;
	return (
		<TableHead className={className}>
			<button
				type="button"
				onClick={() => onSort(sortKey)}
				className={cn(
					"inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-foreground",
					active ? "text-foreground" : "text-muted-foreground",
				)}
			>
				{label}
				<ArrowUpDown className="size-3.5" />
			</button>
		</TableHead>
	);
}

const SKELETON_ROWS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

type ExpenseTableProps = {
	readonly expenses: Expense[];
	readonly categories: Category[];
	readonly currency: string;
	readonly sort: SortState;
	readonly onSort: (key: SortKey) => void;
	readonly onEdit: (expense: Expense) => void;
	readonly onDelete: (id: string) => void;
	readonly isLoading?: boolean;
	readonly isFiltered?: boolean;
	readonly onAddExpense?: () => void;
	readonly onClearFilters?: () => void;
};

export function ExpenseTable({
	expenses,
	categories,
	currency,
	sort,
	onSort,
	onEdit,
	onDelete,
	isLoading,
	isFiltered,
	onAddExpense,
	onClearFilters,
}: ExpenseTableProps) {
	const categoryMap = buildCategoryMap(categories);

	if (isLoading) {
		return (
			<div className="overflow-hidden rounded-xl border border-border">
				<div className="flex flex-col">
					{SKELETON_ROWS.map((k) => (
						<div
							key={k}
							className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-b-0"
						>
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 flex-1" />
							<Skeleton className="hidden h-4 w-24 md:block" />
							<Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
							<Skeleton className="h-4 w-16 text-right" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (expenses.length === 0) {
		return (
			<EmptyState
				icon={isFiltered ? SearchX : Receipt}
				title={isFiltered ? "No matching expenses" : "No expenses yet"}
				description={
					isFiltered
						? "Try adjusting your filters or search terms."
						: "Add your first expense to start tracking your spending."
				}
				action={
					isFiltered ? (
						<Button variant="outline" size="sm" onClick={onClearFilters}>
							Clear filters
						</Button>
					) : (
						<Button size="sm" onClick={onAddExpense}>
							Add expense
						</Button>
					)
				}
			/>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl border border-border">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/40 hover:bg-muted/40">
						<SortHeader label="Date" sortKey="date" sort={sort} onSort={onSort} />
						<SortHeader
							label="Title"
							sortKey="description"
							sort={sort}
							onSort={onSort}
						/>
						<SortHeader
							label="Category"
							sortKey="category"
							sort={sort}
							onSort={onSort}
							className="hidden md:table-cell"
						/>
						<TableHead className="hidden text-xs sm:table-cell">Type</TableHead>
						<SortHeader
							label="Amount"
							sortKey="amount"
							sort={sort}
							onSort={onSort}
							className="text-right"
						/>
						<TableHead className="w-10" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{expenses.map((expense) => (
						<ExpenseRow
							key={expense.id}
							expense={expense}
							category={categoryMap.get(expense.categoryId)}
							currency={currency}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

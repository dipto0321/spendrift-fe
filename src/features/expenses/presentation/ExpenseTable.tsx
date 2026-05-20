import {
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { buildCategoryMap } from "../domain/services";
import type { Category, Expense } from "../domain/types";
import { ExpenseRow } from "./ExpenseRow";

type ExpenseTableProps = {
	expenses: Expense[];
	categories: Category[];
	currency: string;
	onEdit: (expense: Expense) => void;
	onDelete: (id: string) => void;
	isLoading?: boolean;
};

export function ExpenseTable({
	expenses,
	categories,
	currency,
	onEdit,
	onDelete,
	isLoading,
}: ExpenseTableProps) {
	const categoryMap = buildCategoryMap(categories);

	const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

	if (isLoading) {
		return (
			<div className="rounded-2xl border border-border/60 bg-card/30 p-6">
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-12 animate-pulse rounded-lg bg-muted/50"
						/>
					))}
				</div>
			</div>
		);
	}

	if (sorted.length === 0) {
		return (
			<div className="rounded-2xl border border-border/60 bg-card/30 p-12 text-center">
				<p className="m-0 text-sm text-muted-foreground">No expenses found.</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-2xl border border-border/60 bg-card/30">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Date
						</TableHead>
						<TableHead className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Category
						</TableHead>
						<TableHead className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Description
						</TableHead>
						<TableHead className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Type
						</TableHead>
						<TableHead className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Amount
						</TableHead>
						<TableHead className="w-10 px-4 py-3" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{sorted.map((expense) => (
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

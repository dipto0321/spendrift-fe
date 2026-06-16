import { Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatDateShort } from "@/shared/utils/format";
import { formatExpenseType } from "../domain/services";
import type { Category, Expense } from "../domain/types";
import { CategoryChip } from "./CategoryChip";

type ExpenseRowProps = {
	expense: Expense;
	category: Category | undefined;
	currency: string;
	onEdit: (expense: Expense) => void;
	onDelete: (id: string) => void;
};

export function ExpenseRow({
	expense,
	category,
	currency,
	onEdit,
	onDelete,
}: Readonly<ExpenseRowProps>) {
	const categoryName = category?.name ?? "Uncategorized";
	const categoryColor = category?.color ?? "#78716C";

	return (
		<TableRow
			className="group cursor-pointer border-b border-border/50 last:border-none hover:bg-muted/30 transition-colors"
			onClick={() => onEdit(expense)}
		>
			<TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
				{formatDateShort(expense.date)}
			</TableCell>
			<TableCell className="px-4 py-3">
				<CategoryChip name={categoryName} color={categoryColor} />
			</TableCell>
			<TableCell className="max-w-50 truncate px-4 py-3 text-sm text-foreground">
				{expense.description || "—"}
			</TableCell>
			<TableCell className="whitespace-nowrap px-4 py-3 text-sm">
				<Badge
					variant="outline"
					className={`border-transparent ${
						expense.type === "need"
							? "bg-green-500/15 text-green-600 dark:text-green-400"
							: "bg-orange-500/15 text-orange-600 dark:text-orange-400"
					}`}
				>
					{formatExpenseType(expense.type)}
				</Badge>
			</TableCell>
			<TableCell className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-foreground">
				{formatCurrency(expense.amount, currency)}
			</TableCell>
			<TableCell className="px-4 py-3 text-right">
				<AlertDialog>
					<Tooltip>
						<TooltipTrigger asChild>
							<AlertDialogTrigger asChild>
								<button
									type="button"
									onClick={(e) => e.stopPropagation()}
									className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									aria-label={`Delete expense: ${expense.description || categoryName}`}
								>
									<Trash2 className="h-4 w-4" />
								</button>
							</AlertDialogTrigger>
						</TooltipTrigger>
						<TooltipContent>Delete expense</TooltipContent>
					</Tooltip>
					<AlertDialogContent onClick={(e) => e.stopPropagation()}>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete this expense?</AlertDialogTitle>
							<AlertDialogDescription>
								This permanently removes "{expense.description || categoryName}"{" "}
								({formatCurrency(expense.amount, currency)}). This action cannot
								be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => onDelete(expense.id)}
								className="bg-destructive text-white hover:bg-destructive/90"
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</TableCell>
		</TableRow>
	);
}

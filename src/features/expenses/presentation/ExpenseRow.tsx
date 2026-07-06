import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { useFormatCurrency } from "@/features/preferences/presentation/useFormatCurrency";
import { MoneyText } from "@/shared/ui/MoneyText";
import { NeedsWantsTag } from "@/shared/ui/NeedsWantsTag";
import { formatDateShort } from "@/shared/utils/format";
import type { Category, Expense } from "../domain/types";

type ExpenseRowProps = {
	readonly expense: Expense;
	readonly category: Category | undefined;
	readonly currency: string;
	readonly onEdit: (expense: Expense) => void;
	readonly onDelete: (id: string) => void;
};

export function ExpenseRow({
	expense,
	category,
	currency,
	onEdit,
	onDelete,
}: ExpenseRowProps) {
	const [deleteOpen, setDeleteOpen] = useState(false);
	const formatCurrency = useFormatCurrency();
	const categoryName = category?.name ?? "Uncategorized";

	return (
		<>
			<TableRow
				className="group cursor-pointer border-b border-border/50 last:border-none hover:bg-muted/30 transition-colors"
				onClick={() => onEdit(expense)}
			>
				<TableCell className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
					{formatDateShort(expense.date)}
				</TableCell>
				<TableCell className="max-w-52 truncate px-4 py-3 font-medium text-foreground">
					{expense.description || "—"}
					<span className="mt-0.5 block text-xs text-muted-foreground md:hidden">
						{categoryName}
					</span>
				</TableCell>
				<TableCell className="hidden text-sm text-muted-foreground md:table-cell">
					{categoryName}
				</TableCell>
				<TableCell className="hidden sm:table-cell">
					<NeedsWantsTag type={expense.type} />
				</TableCell>
				<TableCell className="whitespace-nowrap px-4 py-3 text-right">
					<MoneyText
						amount={expense.amount}
						currency={currency}
						className="font-medium"
					/>
				</TableCell>
				<TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="opacity-0 group-hover:opacity-100 transition-opacity flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
								aria-label={`Actions for ${expense.description || categoryName}`}
							>
								<MoreHorizontal className="size-4" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-36">
							<DropdownMenuGroup>
								<DropdownMenuItem onSelect={() => onEdit(expense)}>
									<Pencil className="size-4" />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onSelect={() => setDeleteOpen(true)}
								>
									<Trash2 className="size-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</TableCell>
			</TableRow>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this expense?</AlertDialogTitle>
						<AlertDialogDescription>
							This permanently removes "{expense.description || categoryName}""
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
		</>
	);
}

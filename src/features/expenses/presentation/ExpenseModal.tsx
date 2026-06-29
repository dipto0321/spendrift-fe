import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import type { Category, Expense, ExpenseCreateInput } from "../domain/types";
import { ExpenseForm } from "./ExpenseForm";

type ExpenseModalProps = {
	readonly categories: Category[];
	readonly expense?: Expense;
	readonly onSubmit: (data: ExpenseCreateInput) => Promise<void>;
	readonly onClose: () => void;
	readonly isSubmitting?: boolean;
};

export function ExpenseModal({
	categories,
	expense,
	onSubmit,
	onClose,
	isSubmitting,
}: ExpenseModalProps) {
	const isEditing = Boolean(expense);

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogTitle>
					{isEditing ? "Edit expense" : "Add expense"}
				</DialogTitle>
				<DialogDescription>
					{isEditing
						? "Update the details of this transaction."
						: "Record a new transaction for this tracker."}
				</DialogDescription>
				<ExpenseForm
					categories={categories}
					initialData={expense}
					onSubmit={async (data) => {
						await onSubmit(data);
					}}
					onCancel={onClose}
					isSubmitting={isSubmitting}
				/>
			</DialogContent>
		</Dialog>
	);
}

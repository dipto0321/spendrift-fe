import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
} from "#/components/ui/dialog";
import type { Category, Expense, ExpenseCreateInput } from "../domain/types";
import { ExpenseForm } from "./ExpenseForm";

type ExpenseModalProps = {
	categories: Category[];
	expense?: Expense;
	onSubmit: (data: ExpenseCreateInput) => Promise<void>;
	onClose: () => void;
	isSubmitting?: boolean;
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
				<DialogTitle className="text-base font-semibold text-foreground">
					{isEditing ? "Edit Expense" : "Add Expense"}
				</DialogTitle>
				<div className="mt-2">
					<ExpenseForm
						categories={categories}
						initialData={expense}
						onSubmit={async (data) => {
							await onSubmit(data);
						}}
						onCancel={onClose}
						isSubmitting={isSubmitting}
					/>
				</div>
				<DialogClose />
			</DialogContent>
		</Dialog>
	);
}

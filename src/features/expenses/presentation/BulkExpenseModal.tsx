import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import type { BulkCreateResult } from "../domain/services";
import type { Category, ExpenseCreateInput } from "../domain/types";
import { BulkExpenseForm } from "./BulkExpenseForm";

type BulkExpenseModalProps = {
	readonly categories: Category[];
	readonly onSubmit: (
		inputs: ExpenseCreateInput[],
	) => Promise<BulkCreateResult>;
	readonly onClose: () => void;
	readonly isSubmitting?: boolean;
};

export function BulkExpenseModal({
	categories,
	onSubmit,
	onClose,
	isSubmitting,
}: BulkExpenseModalProps) {
	return (
		<Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
			<DialogContent className="sm:max-w-3xl">
				<DialogTitle>Add multiple expenses</DialogTitle>
				<DialogDescription>
					Record several transactions for one day in a single pass.
				</DialogDescription>
				<BulkExpenseForm
					categories={categories}
					onSubmit={onSubmit}
					onCancel={onClose}
					isSubmitting={isSubmitting}
				/>
			</DialogContent>
		</Dialog>
	);
}

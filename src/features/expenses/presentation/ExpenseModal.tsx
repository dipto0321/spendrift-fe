import { X } from "lucide-react";
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

	function handleBackdropClick(e: React.MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
			onClick={handleBackdropClick}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}
			role="dialog"
			aria-modal="true"
			aria-labelledby="expense-modal-title"
		>
			<div className="w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-xl">
				<div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
					<h2
						id="expense-modal-title"
						className="text-base font-semibold text-foreground"
					>
						{isEditing ? "Edit Expense" : "Add Expense"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
						aria-label="Close modal"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="px-6 py-5">
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
			</div>
		</div>
	);
}
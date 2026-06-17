import { useState } from "react";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { PageHeader } from "@/shared/ui/PageHeader";
import { formatCurrency } from "@/shared/utils/format";
import {
	calculateTotal,
	filterExpenses,
	getTodayRange,
} from "../domain/services";
import type {
	Expense,
	ExpenseCreateInput,
	ExpenseFilter,
} from "../domain/types";
import { ExpenseModal } from "./ExpenseModal";
import { ExpenseTable } from "./ExpenseTable";
import { ExpenseToolbar } from "./ExpenseToolbar";
import { useCategories } from "./useCategories";
import {
	useCreateExpense,
	useDeleteExpense,
	useExpenses,
	useUpdateExpense,
} from "./useExpenses";

export function ExpensePage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";
	const [filter, setFilter] = useState<ExpenseFilter>(() => ({
		dateRange: getTodayRange(),
	}));
	const [modalState, setModalState] = useState<{
		open: boolean;
		expense?: Expense;
	}>({ open: false });

	const {
		data: allExpenses = [],
		isLoading: expensesLoading,
		error: expensesError,
	} = useExpenses(trackerId);

	const { data: categories = [] } = useCategories(trackerId);

	const createMutation = useCreateExpense(trackerId);
	const updateMutation = useUpdateExpense(trackerId);
	const deleteMutation = useDeleteExpense(trackerId);

	const filteredExpenses = filterExpenses(allExpenses, filter);
	const filteredExpenseTotal = calculateTotal(filteredExpenses);
	const filteredExpenseCount = filteredExpenses.length;
	const formattedFilteredExpenseTotal = formatCurrency(
		filteredExpenseTotal,
		currency,
	);

	function openAddModal() {
		setModalState({ open: true });
	}

	function openEditModal(expense: Expense) {
		setModalState({ open: true, expense });
	}

	function closeModal() {
		setModalState({ open: false });
	}

	async function handleFormSubmit(data: ExpenseCreateInput) {
		if (modalState.expense) {
			await updateMutation.mutateAsync({
				id: modalState.expense.id,
				data,
			});
		} else {
			await createMutation.mutateAsync(data);
		}
		// Reached only when the mutation resolves; on error mutateAsync throws
		// (the hook already surfaced a toast) and the modal stays open.
		closeModal();
	}

	const isFormSubmitting = createMutation.isPending || updateMutation.isPending;

	if (expensesError) {
		return (
			<main className="page-wrap rise-in px-4 pb-14 pt-10 sm:pt-12">
				<p className="text-sm text-destructive">
					Failed to load expenses. Please try again.
				</p>
			</main>
		);
	}

	return (
		<main className="page-wrap rise-in px-4 pb-14 pt-10 sm:pt-12">
			<header className="mb-6">
				<PageHeader
					kicker="Expenses"
					title="Expense list"
					description="Track and manage your spending by category and type."
					actions={
						<div className="rounded-2xl border border-border/60 bg-card/40 px-4 py-3 shadow-sm backdrop-blur-sm">
							<p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
								Filtered expenses
							</p>
							<div className="mt-2 flex items-baseline gap-3">
								<p className="text-2xl font-semibold text-foreground">
									{formattedFilteredExpenseTotal}
								</p>
								<p className="text-sm text-muted-foreground">
									{filteredExpenseCount} expense
									{filteredExpenseCount === 1 ? "" : "s"}
								</p>
							</div>
						</div>
					}
				/>
			</header>

			<div className="space-y-4">
				<ExpenseToolbar
					filter={filter}
					categories={categories}
					onFilterChange={setFilter}
					onAddExpense={openAddModal}
				/>

				<ExpenseTable
					expenses={filteredExpenses}
					categories={categories}
					currency={currency}
					isLoading={expensesLoading}
					onEdit={openEditModal}
					onDelete={(id) => deleteMutation.mutate(id)}
				/>
			</div>

			{modalState.open && (
				<ExpenseModal
					categories={categories}
					expense={modalState.expense}
					onSubmit={handleFormSubmit}
					onClose={closeModal}
					isSubmitting={isFormSubmitting}
				/>
			)}
		</main>
	);
}

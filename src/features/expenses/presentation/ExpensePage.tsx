import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { MoneyText } from "@/shared/ui/MoneyText";
import { PageHeader } from "@/shared/ui/PageHeader";
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
import { ExpenseTable, type SortKey, type SortState } from "./ExpenseTable";
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
	const [sort, setSort] = useState<SortState>({ key: "date", dir: "desc" });
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

	const sortedExpenses = [...filteredExpenses].sort((a, b) => {
		const dir = sort.dir === "asc" ? 1 : -1;
		if (sort.key === "amount") return (a.amount - b.amount) * dir;
		if (sort.key === "description") {
			return (a.description ?? "").localeCompare(b.description ?? "") * dir;
		}
		if (sort.key === "category") {
			const catA = categories.find((c) => c.id === a.categoryId)?.name ?? "";
			const catB = categories.find((c) => c.id === b.categoryId)?.name ?? "";
			return catA.localeCompare(catB) * dir;
		}
		return a.date.localeCompare(b.date) * dir;
	});

	const filteredTotal = calculateTotal(filteredExpenses);
	const filteredCount = filteredExpenses.length;

	const isFiltered = Boolean(
		filter.search ||
			(filter.categoryIds && filter.categoryIds.length > 0) ||
			(filter.types && filter.types.length > 0),
	);

	function handleSort(key: SortKey) {
		setSort((s) =>
			s.key === key
				? { key, dir: s.dir === "asc" ? "desc" : "asc" }
				: { key, dir: "desc" },
		);
	}

	function openAddModal() {
		setModalState({ open: true });
	}

	function openEditModal(expense: Expense) {
		setModalState({ open: true, expense });
	}

	function closeModal() {
		setModalState({ open: false });
	}

	function clearFilter() {
		setFilter({ dateRange: getTodayRange() });
	}

	async function handleFormSubmit(data: ExpenseCreateInput) {
		if (modalState.expense) {
			await updateMutation.mutateAsync({ id: modalState.expense.id, data });
		} else {
			await createMutation.mutateAsync(data);
		}
		closeModal();
	}

	const isFormSubmitting = createMutation.isPending || updateMutation.isPending;

	if (expensesError) {
		return (
			<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
				<p className="text-sm text-destructive">
					Failed to load expenses. Please try again.
				</p>
			</main>
		);
	}

	return (
		<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
			<PageHeader
				title="Expenses"
				description={`All transactions for ${activeTracker?.name ?? "your tracker"}.`}
				actions={
					<Button onClick={openAddModal}>
						<Plus className="size-4" />
						Add expense
					</Button>
				}
			/>

			<Card>
				<CardContent className="flex flex-col gap-4">
					<ExpenseToolbar
						filter={filter}
						categories={categories}
						onFilterChange={setFilter}
					/>

					{!expensesLoading && filteredCount > 0 && (
						<div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
							<span className="text-sm text-muted-foreground">
								{filteredCount}{" "}
								{filteredCount === 1 ? "expense" : "expenses"}
								{isFiltered ? " matching filters" : ""}
							</span>
							<div className="flex items-baseline gap-1.5">
								<span className="text-xs text-muted-foreground">Total</span>
								<MoneyText
									amount={filteredTotal}
									currency={currency}
									className="text-base font-semibold"
								/>
							</div>
						</div>
					)}

					<ExpenseTable
						expenses={sortedExpenses}
						categories={categories}
						currency={currency}
						sort={sort}
						onSort={handleSort}
						isLoading={expensesLoading}
						isFiltered={isFiltered}
						onEdit={openEditModal}
						onDelete={(id) => deleteMutation.mutate(id)}
						onAddExpense={openAddModal}
						onClearFilters={clearFilter}
					/>
				</CardContent>
			</Card>

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

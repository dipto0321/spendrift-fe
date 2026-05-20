import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { categoryRepository, expenseRepository } from "../data/repository";
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

export function ExpensePage() {
	const queryClient = useQueryClient();
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
	} = useQuery({
		queryKey: ["expenses"],
		queryFn: () => expenseRepository.getAll(),
	});

	const { data: categories = [] } = useQuery({
		queryKey: ["categories"],
		queryFn: () => categoryRepository.getAll(),
	});

	const createMutation = useMutation({
		mutationFn: (input: ExpenseCreateInput) => expenseRepository.create(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["expenses"] });
			closeModal();
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: string;
			data: Partial<ExpenseCreateInput>;
		}) => expenseRepository.update(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["expenses"] });
			closeModal();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => expenseRepository.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["expenses"] });
		},
	});

	const filteredExpenses = filterExpenses(allExpenses, filter);
	const filteredExpenseTotal = calculateTotal(filteredExpenses);
	const filteredExpenseCount = filteredExpenses.length;
	const formattedFilteredExpenseTotal = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(filteredExpenseTotal);

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
	}

	const isFormSubmitting = createMutation.isPending || updateMutation.isPending;

	if (expensesError) {
		return (
			<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
				<p className="text-sm text-destructive">
					Failed to load expenses. Please try again.
				</p>
			</main>
		);
	}

	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<header className="mb-6">
				<p className="island-kicker mb-2">Expenses</p>
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<h1 className="display-title m-0 text-3xl font-semibold text-foreground sm:text-5xl">
							Expense list
						</h1>
						<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
							Track and manage your spending by category and type.
						</p>
					</div>

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
				</div>
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
					currency="USD"
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

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Expense, ExpenseFilter, ExpenseCreateInput } from "../domain/types";
import type { CategoryColor } from "../domain/types";
import { expenseRepository, categoryRepository } from "../data/repository";
import { filterExpenses } from "../domain/services";
import { ExpenseToolbar } from "./ExpenseToolbar";
import { ExpenseTable } from "./ExpenseTable";
import { ExpenseModal } from "./ExpenseModal";
import { CategoryManager } from "./CategoryManager";

export function ExpensePage() {
	const queryClient = useQueryClient();
	const [filter, setFilter] = useState<ExpenseFilter>({});
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

	const {
		data: categories = [],
	} = useQuery({
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

	const categoryCreateMutation = useMutation({
		mutationFn: ({
			name,
			color,
		}: {
			name: string;
			color: CategoryColor
		}) => categoryRepository.create(name, color as CategoryColor),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	const categoryUpdateMutation = useMutation({
		mutationFn: ({
			id,
			name,
			color,
		}: {
			id: string;
			name: string;
			color: CategoryColor
		}) =>
			categoryRepository.update(id, {
				name,
				color: color as CategoryColor,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	const categoryDeleteMutation = useMutation({
		mutationFn: (id: string) => categoryRepository.delete(id, "uncategorized"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			queryClient.invalidateQueries({ queryKey: ["expenses"] });
		},
	});

	const filteredExpenses = filterExpenses(allExpenses, filter);

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
		if (data.amount === 0 && data.categoryId === "new") {
			const parsed = JSON.parse(data.description || "{}");
			if (parsed.action === "createCategory") {
				await categoryCreateMutation.mutateAsync({
					name: parsed.name,
					color: parsed.color,
				});
				return;
			}
		}

		if (modalState.expense) {
			await updateMutation.mutateAsync({
				id: modalState.expense.id,
				data,
			});
		} else {
			await createMutation.mutateAsync(data);
		}
	}

	const isFormSubmitting =
		createMutation.isPending || updateMutation.isPending;

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
				<h1 className="display-title m-0 text-3xl font-semibold text-foreground sm:text-5xl">
					Expense list
				</h1>
				<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
					Track and manage your spending by category and type.
				</p>
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

				<CategoryManager
					categories={categories}
					onCreate={async (name, color) => {
						await categoryCreateMutation.mutateAsync({ name, color });
					}}
					onUpdate={async (id, name, color) => {
						await categoryUpdateMutation.mutateAsync({ id, name, color });
					}}
					onDelete={async (id) => {
						await categoryDeleteMutation.mutateAsync(id);
					}}
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
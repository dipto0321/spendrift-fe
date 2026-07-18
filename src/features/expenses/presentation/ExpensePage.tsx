import { ListPlus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTracker } from "@/features/trackers/presentation/TrackerContext";
import { MoneyText } from "@/shared/ui/MoneyText";
import { PageHeader } from "@/shared/ui/PageHeader";
import { getCurrencySymbol } from "@/shared/utils/currency";
import type { BulkCreateResult } from "../domain/services";
import {
	calculateTotal,
	filterExpenses,
	getTodayRange,
	pageCount,
} from "../domain/services";
import type {
	Expense,
	ExpenseCreateInput,
	ExpenseFilter,
} from "../domain/types";
import { BulkExpenseModal } from "./BulkExpenseModal";
import { ExpenseModal } from "./ExpenseModal";
import { ExpensePagination } from "./ExpensePagination";
import { ExpenseTable, type SortKey, type SortState } from "./ExpenseTable";
import { ExpenseToolbar } from "./ExpenseToolbar";
import { useCategories } from "./useCategories";
import {
	useBulkCreateExpenses,
	useCreateExpense,
	useDeleteExpense,
	useExpenses,
	useUpdateExpense,
} from "./useExpenses";

const PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function ExpensePage() {
	const { activeTracker } = useTracker();
	const trackerId = activeTracker?.id;
	const currency = activeTracker?.currency ?? "";

	const [filter, setFilter] = useState<ExpenseFilter>(() => ({
		dateRange: getTodayRange(),
	}));
	// Debounced view of the filter — feeds the query so each keystroke doesn't
	// fire a network round-trip. The toolbar still drives `filter` immediately
	// so the UI feels responsive.
	const [debouncedFilter, setDebouncedFilter] = useState(filter);
	useEffect(() => {
		const id = setTimeout(() => setDebouncedFilter(filter), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(id);
	}, [filter]);

	const [sort, setSort] = useState<SortState>({ key: "date", dir: "desc" });
	const [page, setPage] = useState(1);
	const [modalState, setModalState] = useState<{
		open: boolean;
		expense?: Expense;
	}>({ open: false });
	const [bulkOpen, setBulkOpen] = useState(false);

	const {
		data,
		isLoading: expensesLoading,
		error: expensesError,
	} = useExpenses(trackerId, {
		filter: debouncedFilter,
		page,
		pageSize: PAGE_SIZE,
	});
	const pageItems = data?.items ?? [];
	const total = data?.total ?? 0;

	// If the server's total drops (e.g. after a delete) so the current page is
	// past the end, snap back to the last valid page.
	useEffect(() => {
		if (expensesLoading) return;
		const lastPage = pageCount(total, PAGE_SIZE);
		if (page > lastPage) setPage(lastPage);
	}, [expensesLoading, page, total]);

	const { data: categories = [] } = useCategories(trackerId);

	const createMutation = useCreateExpense(trackerId);
	const updateMutation = useUpdateExpense(trackerId);
	const deleteMutation = useDeleteExpense(trackerId);
	const bulkCreateMutation = useBulkCreateExpenses(trackerId);

	// Search is debounced via `debouncedFilter`, so the page query sees a
	// stable filter set per search burst. The other filters apply
	// immediately because they're chip-style with no per-keystroke fan-out.
	const filteredExpenses = filterExpenses(pageItems, filter);

	const sortedExpenses = useMemo(() => {
		const dir = sort.dir === "asc" ? 1 : -1;
		return [...filteredExpenses].sort((a, b) => {
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
	}, [filteredExpenses, sort, categories]);

	const pageTotal = calculateTotal(filteredExpenses);

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

	function handleFilterChange(next: ExpenseFilter) {
		// Any filter change should restart pagination at the first page so the
		// user immediately sees the start of the new result set.
		setFilter(next);
		setPage(1);
	}

	function clearFilter() {
		handleFilterChange({ dateRange: getTodayRange() });
	}

	async function handleFormSubmit(data: ExpenseCreateInput) {
		if (modalState.expense) {
			await updateMutation.mutateAsync({ id: modalState.expense.id, data });
		} else {
			await createMutation.mutateAsync(data);
		}
		closeModal();
	}

	async function handleBulkSubmit(
		inputs: ExpenseCreateInput[],
	): Promise<BulkCreateResult> {
		const result = await bulkCreateMutation.mutateAsync(inputs);
		// Only fully successful batches close the modal — failed rows stay in the
		// grid for retry.
		if (result.failed.length === 0) setBulkOpen(false);
		return result;
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
				description={`All transactions for ${activeTracker?.name ?? "your tracker"}, in ${getCurrencySymbol(currency)}.`}
				actions={
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => setBulkOpen(true)}>
							<ListPlus className="size-4" />
							Add multiple
						</Button>
						<Button onClick={openAddModal}>
							<Plus className="size-4" />
							Add expense
						</Button>
					</div>
				}
			/>

			<Card>
				<CardContent className="flex flex-col gap-4">
					<ExpenseToolbar
						filter={filter}
						categories={categories}
						onFilterChange={handleFilterChange}
					/>

					{!expensesLoading && total > 0 && (
						<div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
							<span className="text-sm text-muted-foreground">
								{total} {total === 1 ? "expense" : "expenses"}
								{isFiltered ? " matching filters" : ""}
							</span>
							<div className="flex items-baseline gap-1.5">
								<span className="text-xs text-muted-foreground">
									Page total
								</span>
								<MoneyText
									amount={pageTotal}
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

					<ExpensePagination
						page={page}
						pageSize={PAGE_SIZE}
						total={total}
						onPageChange={setPage}
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

			{bulkOpen && (
				<BulkExpenseModal
					categories={categories}
					onSubmit={handleBulkSubmit}
					onClose={() => setBulkOpen(false)}
					isSubmitting={bulkCreateMutation.isPending}
				/>
			)}
		</main>
	);
}

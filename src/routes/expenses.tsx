import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	type Expense,
	getAllExpenses,
} from "#/features/expenses/api/mockExpenses";
import { ExpenseList } from "#/features/expenses/components/ExpenseList";

export const Route = createFileRoute("/expenses")({
	component: ExpensesPage,
});

function ExpensesPage() {
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setIsLoading(true);
		setError(null);
		getAllExpenses()
			.then((data) => {
				if (!cancelled) setExpenses(data);
			})
			.catch(() => {
				if (!cancelled) setError("Could not load expenses.");
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<header className="mb-6">
				<p className="island-kicker mb-2">Expenses</p>
				<h1 className="display-title m-0 text-3xl font-semibold text-[var(--sea-ink)] sm:text-5xl">
					Expense list
				</h1>
				<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--sea-ink-soft)] sm:text-base">
					Review recent spending by category and date. We’ll add filtering and
					exports next.
				</p>
			</header>

			{error ? (
				<p className="text-sm text-[var(--sea-ink-soft)]" role="alert">
					{error}
				</p>
			) : (
				<ExpenseList expenses={expenses} isLoading={isLoading} />
			)}
		</main>
	);
}

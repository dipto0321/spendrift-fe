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
		<main className="page-wrap px-4 py-12">
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

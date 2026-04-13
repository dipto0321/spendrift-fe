import { useEffect, useMemo, useState } from "react";

import {
	type Expense,
	getAllExpenses,
} from "#/features/expenses/api/mockExpenses";
import { ExpenseList } from "#/features/expenses/components/ExpenseList";

import {
	type DashboardSummary,
	getDashboardSummary,
} from "../api/mockDashboard";

function formatCurrency(amount: number) {
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: "USD",
	}).format(amount);
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<section className="island-shell rounded-2xl p-5">
			<p className="m-0 text-xs font-semibold tracking-wide text-[var(--sea-ink-soft)] uppercase">
				{label}
			</p>
			<p className="m-0 mt-2 text-2xl font-semibold text-[var(--sea-ink)] tabular-nums">
				{value}
			</p>
		</section>
	);
}

export function DashboardPage() {
	const [summary, setSummary] = useState<DashboardSummary | null>(null);
	const [summaryLoading, setSummaryLoading] = useState(true);

	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [expensesLoading, setExpensesLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setSummaryLoading(true);
		getDashboardSummary()
			.then((data) => {
				if (!cancelled) setSummary(data);
			})
			.finally(() => {
				if (!cancelled) setSummaryLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		setExpensesLoading(true);
		getAllExpenses()
			.then((data) => {
				if (!cancelled) setExpenses(data);
			})
			.finally(() => {
				if (!cancelled) setExpensesLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const recentExpenses = useMemo(() => {
		return [...expenses]
			.sort((a, b) => b.date.localeCompare(a.date))
			.slice(0, 5);
	}, [expenses]);

	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<header className="mb-6 flex items-end justify-between gap-4">
				<div className="min-w-0">
					<p className="island-kicker mb-2">Dashboard</p>
					<h1 className="display-title m-0 text-3xl font-semibold text-[var(--sea-ink)] sm:text-5xl">
						FinTrack overview
					</h1>
					<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-[var(--sea-ink-soft)] sm:text-base">
						Track what matters: cash position, monthly trends, and recent
						spending.
					</p>
				</div>
			</header>

			<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				<StatCard
					label="Total balance"
					value={
						summaryLoading || !summary
							? "—"
							: formatCurrency(summary.totalBalance)
					}
				/>
				<StatCard
					label="This month spend"
					value={
						summaryLoading || !summary
							? "—"
							: formatCurrency(summary.monthSpend)
					}
				/>
				<StatCard
					label="This month income"
					value={
						summaryLoading || !summary
							? "—"
							: formatCurrency(summary.monthIncome)
					}
				/>
			</section>

			<section className="mt-6 grid gap-6 lg:grid-cols-2">
				<div className="min-w-0">
					<ExpenseList expenses={recentExpenses} isLoading={expensesLoading} />
				</div>

				<section className="island-shell rounded-2xl p-6">
					<h2 className="island-kicker mb-4">Insights</h2>
					<ul className="m-0 list-none space-y-3 p-0 text-sm text-[var(--sea-ink-soft)]">
						<li className="flex items-start justify-between gap-4">
							<span>Budget setup</span>
							<span className="font-semibold text-[var(--sea-ink)]">Next</span>
						</li>
						<li className="flex items-start justify-between gap-4">
							<span>Recurring expenses</span>
							<span className="font-semibold text-[var(--sea-ink)]">Soon</span>
						</li>
						<li className="flex items-start justify-between gap-4">
							<span>Cashflow chart</span>
							<span className="font-semibold text-[var(--sea-ink)]">Soon</span>
						</li>
					</ul>
				</section>
			</section>
		</main>
	);
}

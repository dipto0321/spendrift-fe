import { useQuery } from "@tanstack/react-query";

import type { Category } from "#/features/expenses/domain/types";
import { expenseRepository } from "#/features/expenses/data/repository";
import { getDashboardSummary } from "../api/mockDashboard";

function formatCurrency(amount: number) {
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency: "USD",
	}).format(amount);
}

function formatDate(isoDate: string) {
	return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
		dateStyle: "medium",
	});
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<section className="island-shell rounded-2xl p-5">
			<p className="m-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
				{label}
			</p>
			<p className="m-0 mt-2 text-2xl font-semibold text-foreground tabular-nums">
				{value}
			</p>
		</section>
	);
}

export function DashboardPage() {
	const { data: summary, isLoading: summaryLoading } = useQuery({
		queryKey: ["dashboard-summary"],
		queryFn: getDashboardSummary,
	});

	const { data: expenses = [], isLoading: expensesLoading } = useQuery({
		queryKey: ["expenses"],
		queryFn: () => expenseRepository.getAll(),
	});

	const { data: categories = [] } = useQuery({
		queryKey: ["categories"],
		queryFn: () => import("#/features/expenses/data/repository").then(m => m.categoryRepository.getAll()),
	});

	const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

	const recentExpenses = [...expenses]
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, 5);

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
					<section className="island-shell rounded-2xl p-6" aria-labelledby="recent-expenses-heading">
						<h2 id="recent-expenses-heading" className="island-kicker mb-4">Recent expenses</h2>
						{expensesLoading ? (
							<p className="m-0 text-sm text-muted-foreground">Loading…</p>
						) : recentExpenses.length === 0 ? (
							<p className="m-0 text-sm text-muted-foreground">No expenses yet.</p>
						) : (
							<ul className="m-0 list-none space-y-3 p-0">
								{recentExpenses.map((expense) => {
									const cat = categoryMap.get(expense.categoryId);
									return (
										<li
											key={expense.id}
											className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3 last:border-none last:pb-0"
										>
											<div className="min-w-0">
												<p className="m-0 font-semibold text-[var(--sea-ink)]">
													{cat?.name ?? "Uncategorized"}
												</p>
												<p className="m-0 text-sm text-[var(--sea-ink-soft)]">
													{formatDate(expense.date)}
												</p>
											</div>
											<span className="shrink-0 font-medium tabular-nums text-[var(--sea-ink)]">
												{formatCurrency(expense.amount)}
											</span>
										</li>
									);
								})}
							</ul>
						)}
					</section>
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

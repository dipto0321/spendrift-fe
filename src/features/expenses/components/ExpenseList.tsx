import type { Expense } from "../api/mockExpenses";

export type ExpenseListProps = {
	expenses: Expense[];
	isLoading?: boolean;
	title?: string;
	currency?: string;
};

function formatCurrency(amount: number, currency: string) {
	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
	}).format(amount);
}

function formatDate(isoDate: string) {
	return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
		dateStyle: "medium",
	});
}

export function ExpenseList({
	expenses,
	isLoading,
	title = "Expenses",
	currency = "USD",
}: ExpenseListProps) {
	if (isLoading) {
		return (
			<section className="island-shell rounded-2xl p-6">
				<p className="island-kicker mb-4">{title}</p>
				<p className="m-0 text-sm text-[var(--sea-ink-soft)]">Loading…</p>
			</section>
		);
	}

	const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

	if (sorted.length === 0) {
		return (
			<section className="island-shell rounded-2xl p-6">
				<p className="island-kicker mb-4">{title}</p>
				<p className="m-0 text-sm text-[var(--sea-ink-soft)]">
					No expenses yet.
				</p>
			</section>
		);
	}

	return (
		<section
			className="island-shell rounded-2xl p-6"
			aria-labelledby="expense-list-heading"
		>
			<h2 id="expense-list-heading" className="island-kicker mb-4">
				{title}
			</h2>
			<ul className="m-0 list-none space-y-3 p-0">
				{sorted.map((expense) => (
					<li
						key={expense.id}
						className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--line)] pb-3 last:border-none last:pb-0"
					>
						<div className="min-w-0">
							<p className="m-0 font-semibold text-[var(--sea-ink)]">
								{expense.category}
							</p>
							<p className="m-0 text-sm text-[var(--sea-ink-soft)]">
								{formatDate(expense.date)}
							</p>
						</div>
						<span className="shrink-0 font-medium tabular-nums text-[var(--sea-ink)]">
							{formatCurrency(expense.amount, currency)}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}

import type { Category, Expense } from "@/features/expenses/domain/types";
import { formatCurrency, formatDate } from "@/shared/utils/format";

type RecentExpensesProps = {
	expenses: Expense[];
	categoryMap: Map<string, Category>;
	currency: string;
	isLoading: boolean;
};

export function RecentExpenses({
	expenses,
	categoryMap,
	currency,
	isLoading,
}: RecentExpensesProps) {
	return (
		<section
			className="island-shell rounded-2xl p-6"
			aria-labelledby="recent-expenses-heading"
		>
			<h2 id="recent-expenses-heading" className="island-kicker mb-4">
				Recent expenses
			</h2>
			<RecentExpensesList
				expenses={expenses}
				categoryMap={categoryMap}
				currency={currency}
				isLoading={isLoading}
			/>
		</section>
	);
}

function RecentExpensesList({
	expenses,
	categoryMap,
	currency,
	isLoading,
}: RecentExpensesProps) {
	if (isLoading) {
		return <p className="m-0 text-sm text-muted-foreground">Loading…</p>;
	}
	if (expenses.length === 0) {
		return (
			<p className="m-0 text-sm text-muted-foreground">No expenses yet.</p>
		);
	}
	return (
		<ul className="m-0 list-none space-y-3 p-0">
			{expenses.map((expense) => {
				const cat = categoryMap.get(expense.categoryId);
				return (
					<li
						key={expense.id}
						className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3 last:border-none last:pb-0"
					>
						<div className="min-w-0">
							<p className="m-0 font-semibold text-foreground">
								{cat?.name ?? "Uncategorized"}
							</p>
							<p className="m-0 text-sm text-muted-foreground">
								{formatDate(expense.date)}
							</p>
						</div>
						<span className="shrink-0 font-medium tabular-nums text-foreground">
							{formatCurrency(expense.amount, currency)}
						</span>
					</li>
				);
			})}
		</ul>
	);
}

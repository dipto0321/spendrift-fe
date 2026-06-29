import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, Expense } from "@/features/expenses/domain/types";
import { EmptyState } from "@/shared/ui/EmptyState";
import { MoneyText } from "@/shared/ui/MoneyText";
import { NeedsWantsTag } from "@/shared/ui/NeedsWantsTag";
import { formatDate } from "@/shared/utils/format";

type RecentExpensesProps = {
	readonly expenses: Expense[];
	readonly categoryMap: Map<string, Category>;
	readonly currency: string;
	readonly isLoading: boolean;
};

const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f"] as const;

function RecentExpensesContent({
	expenses,
	categoryMap,
	currency,
	isLoading,
}: RecentExpensesProps) {
	if (isLoading) {
		return (
			<ul className="space-y-3 p-0 m-0 list-none">
				{SKELETON_KEYS.map((k) => (
					<li key={k} className="flex items-center justify-between gap-2 py-1">
						<div className="flex flex-col gap-1">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="h-3 w-20" />
						</div>
						<Skeleton className="h-4 w-16" />
					</li>
				))}
			</ul>
		);
	}

	if (expenses.length === 0) {
		return (
			<EmptyState
				icon={Receipt}
				title="No expenses yet"
				description="Start tracking your spending to see recent activity here."
			/>
		);
	}

	return (
		<ul className="space-y-1 p-0 m-0 list-none">
			{expenses.map((expense) => {
				const cat = categoryMap.get(expense.categoryId);
				return (
					<li
						key={expense.id}
						className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
					>
						<div className="min-w-0 flex-1">
							<p className="m-0 truncate text-sm font-medium text-foreground">
								{cat?.name ?? "Uncategorized"}
							</p>
							<p className="m-0 text-xs text-muted-foreground">
								{formatDate(expense.date)}
							</p>
						</div>
						<div className="flex shrink-0 items-center gap-2">
							<NeedsWantsTag type={expense.type} />
							<MoneyText
								amount={expense.amount}
								currency={currency}
								className="text-sm font-semibold"
							/>
						</div>
					</li>
				);
			})}
		</ul>
	);
}

export function RecentExpenses(props: RecentExpensesProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center gap-2">
				<span className="flex size-7 items-center justify-center rounded-md bg-secondary">
					<Receipt className="size-4 text-muted-foreground" />
				</span>
				<CardTitle>Recent expenses</CardTitle>
			</CardHeader>
			<CardContent>
				<RecentExpensesContent {...props} />
			</CardContent>
		</Card>
	);
}

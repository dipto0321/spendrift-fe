import type { Expense } from "@/features/expenses/domain/types";
import type { BudgetStatus, SavingsHealth } from "./types";

export function calculateBudgetStatus(
	monthlyLimit: number,
	savingsTarget: number,
	expenses: Expense[],
): BudgetStatus {
	const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
	const remaining = monthlyLimit - spent;
	const savingsProgress =
		monthlyLimit > 0
			? Math.min(
					100,
					Math.round(((monthlyLimit - spent) / savingsTarget) * 100),
				)
			: 0;

	const savingsHealth = getSavingsHealth(spent, monthlyLimit, savingsTarget);
	const isOverBudget = spent > monthlyLimit;

	return {
		spent,
		remaining,
		savingsProgress,
		savingsHealth,
		isOverBudget,
	};
}

export function getSavingsHealth(
	spent: number,
	monthlyLimit: number,
	savingsTarget: number,
): SavingsHealth {
	if (monthlyLimit <= 0) return "yellow";

	const spentPercentage = (spent / monthlyLimit) * 100;

	if (spent > monthlyLimit) return "red";

	const remaining = monthlyLimit - spent;

	if (savingsTarget > 0 && remaining >= savingsTarget) return "green";
	if (spentPercentage < 80) return "green";
	if (spentPercentage < 95) return "yellow";

	return "red";
}

export function getHealthLabel(health: SavingsHealth): string {
	switch (health) {
		case "green":
			return "On Track";
		case "yellow":
			return "Caution";
		case "red":
			return "Over Budget";
	}
}

export function getHealthColor(health: SavingsHealth): string {
	switch (health) {
		case "green":
			return "text-green-500";
		case "yellow":
			return "text-yellow-500";
		case "red":
			return "text-red-500";
	}
}

export function getHealthBgColor(health: SavingsHealth): string {
	switch (health) {
		case "green":
			return "bg-green-500/15";
		case "yellow":
			return "bg-yellow-500/15";
		case "red":
			return "bg-red-500/15";
	}
}

export function getProgressBarColor(health: SavingsHealth): string {
	switch (health) {
		case "green":
			return "bg-green-500";
		case "yellow":
			return "bg-yellow-500";
		case "red":
			return "bg-red-500";
	}
}

export function getCurrentMonth(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

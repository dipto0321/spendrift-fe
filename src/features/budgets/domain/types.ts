export type Budget = {
	id: string;
	trackerId: string;
	name: string;
	monthlyLimit: number;
	savingsTarget: number;
	month: string;
	createdAt: string;
};

export type BudgetCreateInput = Omit<Budget, "id" | "createdAt" | "trackerId">;

export type BudgetUpdateInput = Partial<
	Omit<Budget, "id" | "createdAt" | "trackerId">
>;

export type SavingsHealth = "green" | "yellow" | "red";

export type BudgetStatus = {
	spent: number;
	remaining: number;
	savingsProgress: number;
	savingsHealth: SavingsHealth;
	isOverBudget: boolean;
};

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type Expense = {
	id: string;
	amount: number;
	category: string;
	/** ISO date string (YYYY-MM-DD) */
	date: string;
};

let expenses: Expense[] = [
	{
		id: "1",
		amount: 47.32,
		category: "Groceries",
		date: "2026-04-02",
	},
	{
		id: "2",
		amount: 12.5,
		category: "Coffee",
		date: "2026-04-03",
	},
	{
		id: "3",
		amount: 89.0,
		category: "Transport",
		date: "2026-03-28",
	},
	{
		id: "4",
		amount: 24.99,
		category: "Subscriptions",
		date: "2026-03-25",
	},
];

export async function getAllExpenses(): Promise<Expense[]> {
	await delay(200);
	return expenses.map((e) => ({ ...e }));
}

export async function getExpenseById(id: string): Promise<Expense | null> {
	await delay(200);
	const found = expenses.find((e) => e.id === id);
	return found ? { ...found } : null;
}

export type ExpenseCreateInput = Omit<Expense, "id">;

export async function createExpense(
	input: ExpenseCreateInput,
): Promise<Expense> {
	await delay(200);
	const expense: Expense = { ...input, id: crypto.randomUUID() };
	expenses = [...expenses, expense];
	return { ...expense };
}

export async function updateExpense(
	id: string,
	patch: Partial<ExpenseCreateInput>,
): Promise<Expense | null> {
	await delay(200);
	const idx = expenses.findIndex((e) => e.id === id);
	if (idx === -1) return null;
	const updated = { ...expenses[idx], ...patch };
	expenses = expenses.map((e) => (e.id === id ? updated : e));
	return { ...updated };
}

export async function deleteExpense(id: string): Promise<boolean> {
	await delay(200);
	const before = expenses.length;
	expenses = expenses.filter((e) => e.id !== id);
	return expenses.length < before;
}

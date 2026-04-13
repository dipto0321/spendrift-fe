const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type DashboardSummary = {
	totalBalance: number;
	monthSpend: number;
	monthIncome: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
	await delay(200);
	return {
		totalBalance: 18420.55,
		monthSpend: 1267.42,
		monthIncome: 3540.0,
	};
}

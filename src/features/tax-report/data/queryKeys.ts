export const taxReportKeys = {
	report: (trackerId: string, fiscalYear: string) =>
		["tax-report", trackerId, fiscalYear] as const,
	list: (trackerId: string) => ["tax-report", trackerId, "list"] as const,
};

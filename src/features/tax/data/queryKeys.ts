export const taxKeys = {
	all: (trackerId: string) => ["tax", trackerId] as const,
	list: (trackerId: string) => ["tax", trackerId, "list"] as const,
	detail: (trackerId: string, fiscalYear: string) =>
		["tax", trackerId, "detail", fiscalYear] as const,
};

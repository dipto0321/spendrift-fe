export const dashboardKeys = {
	summary: (trackerId: string, month?: string) =>
		["dashboard", trackerId, month] as const,
};

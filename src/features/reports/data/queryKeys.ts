import type { ReportPeriod } from "../domain/types";

// A date range filter shared by every report query. Both ends are optional
// (omitted → server returns all-time). Dates are `YYYY-MM-DD` strings.
export type ReportRange = {
	startDate?: string;
	endDate?: string;
};

// Single-shot POST query key helper. The request body is part of the key so
// re-querying with different months or different N values is cached
// independently.
export type MonthlyInsightsQuery = {
	month: string;
	topNCategories: number;
	topNExpenses: number;
};

// Centralized React Query keys for the reports feature. The range (and period,
// for spending) is part of the key so each filter combination caches
// independently.
export const reportKeys = {
	spending: (trackerId: string, period: ReportPeriod, range: ReportRange) =>
		["reports", trackerId, "spending", period, range] as const,
	categoryBreakdown: (trackerId: string, range: ReportRange) =>
		["reports", trackerId, "category-breakdown", range] as const,
	needsWants: (trackerId: string, range: ReportRange) =>
		["reports", trackerId, "needs-vs-wants", range] as const,
	yearComparison: (trackerId: string) =>
		["reports", trackerId, "year-comparison"] as const,
	monthlyInsights: (trackerId: string, query: MonthlyInsightsQuery) =>
		["reports", trackerId, "monthly-insights", query] as const,
};

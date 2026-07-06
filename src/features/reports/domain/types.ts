export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type AnalyticsResult = {
	total: number;
	min: number;
	max: number;
	avg: number;
	count: number;
};

export type CategoryBreakdown = {
	categoryId: string;
	categoryName: string;
	categoryColor: string;
	total: number;
	percentage: number;
	count: number;
};

export type PeriodData = {
	label: string;
	total: number;
	count: number;
};

export type YearComparison = {
	year: string;
	total: number;
	avg: number;
	count: number;
};
